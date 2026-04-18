'use client'
// ============================================================
// PROJECT CARD — Carte d'un projet dans la liste
// ============================================================
import React from 'react'
import Link from 'next/link'
import { Project } from '@/types'
import { CURRENCY_SYMBOLS } from '@/types'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { MoreVertical, Pencil, Trash2, BarChart2 } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <div className="group relative rounded-xl border border-[#23272F] bg-[#12151C] p-5 hover:border-[#2F3541] transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-100 text-sm truncate">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-[#171B23] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 w-36 rounded-lg border border-[#2F3541] bg-[#12151C] shadow-xl py-1">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(project) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-300 hover:bg-[#171B23] transition-colors"
                >
                  <Pencil size={12} /> Modifier
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(project) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-[#171B23] transition-colors"
                >
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Devise */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="violet">{CURRENCY_SYMBOLS[project.currency]} {project.currency}</Badge>
        <span className="text-[10px] text-zinc-600">
          Créé le {formatDate(project.createdAt.toISOString().split('T')[0])}
        </span>
      </div>

      {/* CTA */}
      <Link
        href={`/tracker?projectId=${project.id}`}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#171B23] hover:bg-violet-600/20 border border-[#2F3541] hover:border-violet-500/50 text-xs font-medium text-zinc-300 hover:text-violet-300 transition-all duration-150"
      >
        <BarChart2 size={12} />
        Ouvrir le tracker
      </Link>
    </div>
  )
}
