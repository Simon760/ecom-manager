'use client'
// ============================================================
// APP LAYOUT — Wrapper principal avec sidebar + guard auth
// ============================================================
import React, { Suspense, useState, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, ProjectRefreshContext } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import ProjectForm from '@/components/projects/ProjectForm'
import { createProject } from '@/services/projects.service'
import { ProjectFormData } from '@/types'

interface AppLayoutProps {
  children: React.ReactNode
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const { user, loading } = useAuth()
  const { triggerRefresh } = useContext(ProjectRefreshContext)
  const router = useRouter()
  const [showNewProject, setShowNewProject] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Redirection si non connecté
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return <Spinner fullPage size="lg" text="Chargement…" />
  }

  if (!user) return null

  const handleCreateProject = async (data: ProjectFormData) => {
    setCreating(true)
    setCreateError(null)
    try {
      const project = await createProject(user.uid, data)
      setShowNewProject(false)
      // Déclenche le rafraîchissement de la sidebar
      triggerRefresh()
      // Redirige vers le tracker du nouveau projet (router.push gère le basePath automatiquement)
      router.push(`/tracker?projectId=${project.id}`)
    } catch (err) {
      console.error('Erreur création projet:', err)
      setCreateError('Erreur lors de la création du projet. Veuillez réessayer.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar (inclut useSearchParams, donc dans Suspense) */}
      <Suspense fallback={<div className="w-56 bg-zinc-950 border-r border-zinc-800" />}>
        <Sidebar onNewProject={() => setShowNewProject(true)} />
      </Suspense>

      {/* Contenu principal */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:pl-8">
          {children}
        </div>
      </main>

      {/* Modal nouveau projet */}
      <Modal
        isOpen={showNewProject}
        onClose={() => { setShowNewProject(false); setCreateError(null) }}
        title="Nouveau projet"
        size="md"
      >
        {createError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {createError}
          </div>
        )}
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => { setShowNewProject(false); setCreateError(null) }}
          loading={creating}
        />
      </Modal>
    </div>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <Suspense fallback={<Spinner fullPage size="lg" text="Initialisation…" />}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  )
}
