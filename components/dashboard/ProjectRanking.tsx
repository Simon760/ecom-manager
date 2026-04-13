'use client'
// ============================================================
// PROJECT RANKING — Classement des projets par revenue
// ============================================================
import React from 'react'
import Link from 'next/link'
import { Project, DailyStat } from '@/types'
import { aggregateStats } from '@/lib/calculations'
import { formatCurrency, formatMultiplier } from '@/lib/utils'

interface RankingEntry {
  project: Project
  stats: DailyStat[]
  metrics: ReturnType<typeof aggregateStats>
}

export default function ProjectRanking({ data }: { data: RankingEntry[] }) {
  const sorted = [...data].sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue)

  if (sorted.length === 0) {
    return <p className="text-xs text-zinc-600 text-center py-6">Aucune donnée</p>
  }

  const maxRevenue = sorted[0].metrics.totalRevenue || 1

  return (
    <div className="space-y-3">
      {sorted.map(({ project, metrics }, idx) => (
        <Link
          key={project.id}
          href={`/tracker?projectId=${project.id}`}
          className="block group"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-bold text-zinc-600 w-4 text-center">
              #{idx + 1}
            </span>
            <span className="text-xs font-medium text-zinc-300 group-hover:text-violet-300 transition-colors flex-1 truncate">
              {project.name}
            </span>
            <span className="text-xs font-bold text-zinc-100">
              {formatCurrency(metrics.totalRevenue, project.currency)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="ml-7 h-1 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-500"
              style={{ width: `${(metrics.totalRevenue / maxRevenue) * 100}%` }}
            />
          </div>
          <div className="ml-7 flex gap-3 mt-1">
            <span className="text-[10px] text-zinc-600">
              ROAS {formatMultiplier(metrics.avgROAS)}
            </span>
            <span className="text-[10px] text-zinc-600">
              {metrics.totalOrders} cmd
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
