'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectForm from '@/components/projects/ProjectForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TopBar from '@/components/layout/TopBar'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import { getProjects, createProject, updateProject, deleteProject } from '@/services/projects.service'
import { Project, ProjectFormData } from '@/types'
import { Plus, FolderKanban } from 'lucide-react'

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    getProjects(user.uid).then(setProjects).finally(() => setLoading(false))
  }, [user])

  const handleCreate = async (data: ProjectFormData) => {
    if (!user) return
    setSaving(true)
    try {
      const project = await createProject(user.uid, data)
      setProjects((prev) => [project, ...prev])
      setShowCreate(false)
    } finally { setSaving(false) }
  }

  const handleUpdate = async (data: ProjectFormData) => {
    if (!editProject) return
    setSaving(true)
    try {
      await updateProject(editProject.id, data)
      setProjects((prev) => prev.map((p) => p.id === editProject.id ? { ...p, ...data } : p))
      setEditProject(null)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user) return
    setDeleting(true)
    try {
      await deleteProject(deleteTarget.id, user.uid)
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  if (loading) return <Spinner size="md" className="mt-16 mx-auto" />

  return (
    <div>
      <TopBar
        title="Mes projets"
        subtitle={`${projects.length} projet${projects.length > 1 ? 's' : ''}`}
        actions={<Button icon={<Plus size={14} />} size="sm" onClick={() => setShowCreate(true)}>Nouveau projet</Button>}
      />
      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban size={24} />} title="Aucun projet"
          description="Créez votre première marque e-commerce."
          action={{ label: '+ Créer un projet', onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project}
              onEdit={(p) => setEditProject(p)} onDelete={(p) => setDeleteTarget(p)} />
          ))}
          <button onClick={() => setShowCreate(true)}
            className="rounded-xl border border-dashed border-zinc-700 hover:border-violet-600/50 p-5 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-violet-400 transition-all min-h-[140px]">
            <Plus size={20} /><span className="text-sm font-medium">Nouveau projet</span>
          </button>
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouveau projet">
        <ProjectForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={saving} />
      </Modal>
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Modifier le projet">
        {editProject && (
          <ProjectForm defaultValues={{ name: editProject.name, description: editProject.description, currency: editProject.currency }}
            onSubmit={handleUpdate} onCancel={() => setEditProject(null)} loading={saving} />
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Supprimer le projet"
        message={`Supprimer "${deleteTarget?.name}" ? Toutes les données seront perdues.`}
        confirmLabel="Supprimer définitivement" loading={deleting} onConfirm={handleDelete} />
    </div>
  )
}
