'use client'
// ============================================================
// CARD — Conteneur carte réutilisable
// ============================================================
import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-[#23272F] bg-[#12151C]',
        paddingStyles[padding],
        hover && 'cursor-pointer transition-colors duration-200 hover:border-[#2F3541] hover:bg-[#171B23]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

// --- Card Header ---
interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, icon, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-5', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#171B23] border border-[#23272F] flex items-center justify-center text-zinc-400">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-white truncate tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
