'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import TopBar from '@/components/layout/TopBar'
import FinanceManager from '@/components/finance/FinanceManager'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { getProjects } from '@/services/projects.service'
import { Project, CURRENCY_SYMBOLS } from '@/types'

function FinanceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = searchParams.get('projectId')
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) { router.replace('/projects'); return }
    if (!user) return
    let cancelled = false
    getProjects(user.uid)
      .then((ps) => {
        if (cancelled) return
        const p = ps.find((x) => x.id === projectId)
        if (!p) { router.replace('/projects'); return }
        setProject(p); setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Erreur chargement projet finance:', err)
          setLoadError('Erreur lors du chargement du projet.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [user, projectId]) // eslint-disable-line

  if (loading) return <Spinner size="md" className="mt-16 mx-auto" />
  if (loadError) return (
    <div className="mt-16 mx-auto max-w-md p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-center">
      {loadError}
    </div>
  )
  if (!project) return null
  return (
    <div>
      <TopBar title={project.name} subtitle="Finance & P&L"
        badge={<Badge variant="violet">{CURRENCY_SYMBOLS[project.currency]} {project.currency}</Badge>} />
      <FinanceManager projectId={project.id} currency={project.currency} />
    </div>
  )
}

export default function FinancePage() {
  return <Suspense fallback={<Spinner size="md" className="mt-16 mx-auto" />}><FinanceContent /></Suspense>
}
