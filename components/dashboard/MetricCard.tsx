'use client'
// ============================================================
// METRIC CARD — Carte KPI avec variation
// ============================================================
import React from 'react'
import { cn, formatNumber, variationColor, variationArrow } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  variation?: number    // % de variation vs J-1 ou période précédente
  variationLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  inverseVariation?: boolean  // Pour CPA : baisse = bon
  className?: string
  size?: 'sm' | 'md'
}

export default function MetricCard({
  label,
  value,
  variation,
  variationLabel,
  icon,
  inverseVariation = false,
  className,
  size = 'md',
}: MetricCardProps) {
  const hasVariation = variation !== undefined && variation !== 0
  const isPositive = inverseVariation ? (variation ?? 0) < 0 : (variation ?? 0) > 0

  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-200',
        size === 'md' ? 'p-5' : 'p-4',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
            {icon}
          </div>
        )}
      </div>

      <p className={cn('font-bold text-zinc-100 tracking-tight', size === 'md' ? 'text-2xl' : 'text-xl')}>
        {value}
      </p>

      {/* Variation */}
      {hasVariation && (
        <div className={cn('flex items-center gap-1 mt-2', variationColor(variation!, inverseVariation))}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span className="text-xs font-medium">
            {variationArrow(variation!)} {Math.abs(variation!).toFixed(1)}%
          </span>
          {variationLabel && (
            <span className="text-xs text-zinc-600">{variationLabel}</span>
          )}
        </div>
      )}

      {/* Label sans variation */}
      {!hasVariation && variationLabel && (
        <p className="text-xs text-zinc-600 mt-1.5">{variationLabel}</p>
      )}
    </div>
  )
}
