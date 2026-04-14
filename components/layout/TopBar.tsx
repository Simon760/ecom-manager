'use client'
// ============================================================
// TOPBAR — Barre supérieure avec titre et actions
// ============================================================
import React from 'react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  badge?: React.ReactNode
}

export default function TopBar({ title, subtitle, actions, badge }: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-bold text-white tracking-tight truncate">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-zinc-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
