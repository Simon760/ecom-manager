'use client'
// ============================================================
// BADGE — Étiquette de statut/label
// ============================================================
import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'violet'

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  danger: 'bg-red-500/15 text-red-400 border-red-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
