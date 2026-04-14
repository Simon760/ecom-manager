'use client'
// ============================================================
// METRIC CARD — Carte KPI avec variation et couleurs dynamiques
// ============================================================
import React from 'react'
import { cn, variationColor, variationArrow } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

type ColorMode = 'profit' | 'roas' | 'none'

interface MetricCardProps {
  label: string
  value: string
  rawValue?: number          // valeur brute pour la couleur
  colorMode?: ColorMode      // 'profit' = vert/rouge selon signe | 'roas' = seuils ROAS
  breakEvenROAS?: number     // pour colorMode='roas'
  variation?: number
  variationLabel?: string
  icon?: React.ReactNode
  inverseVariation?: boolean
  className?: string
  size?: 'sm' | 'md'
}

function getValueColor(mode: ColorMode, raw?: number, beROAS?: number): string {
  if (mode === 'profit' && raw !== undefined) {
    if (raw > 0) return 'text-emerald-400'
    if (raw < 0) return 'text-red-400'
    return 'text-white'
  }
  if (mode === 'roas' && raw !== undefined) {
    if (beROAS && beROAS > 0) {
      if (raw >= beROAS * 1.2) return 'text-emerald-400'
      if (raw >= beROAS) return 'text-amber-400'
      return 'text-red-400'
    }
    // Seuils par défaut sans BE
    if (raw >= 3) return 'text-emerald-400'
    if (raw >= 2) return 'text-amber-400'
    return 'text-red-400'
  }
  return 'text-white'
}

export default function MetricCard({
  label, value, rawValue, colorMode = 'none', breakEvenROAS,
  variation, variationLabel, icon, inverseVariation = false,
  className, size = 'md',
}: MetricCardProps) {
  const hasVariation = variation !== undefined && variation !== 0
  const isPositive = inverseVariation ? (variation ?? 0) < 0 : (variation ?? 0) > 0
  const valueColor = getValueColor(colorMode, rawValue, breakEvenROAS)

  return (
    <div className={cn(
      'rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-200',
      size === 'md' ? 'p-5' : 'p-4',
      className
    )}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs text-zinc-400 font-medium">{label}</p>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
            {icon}
          </div>
        )}
      </div>

      <p className={cn(
        'font-bold tracking-tight',
        size === 'md' ? 'text-2xl' : 'text-xl',
        valueColor
      )}>
        {value}
      </p>

      {hasVariation && (
        <div className={cn('flex items-center gap-1 mt-2', variationColor(variation!, inverseVariation))}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span className="text-xs font-medium">
            {variationArrow(variation!)} {Math.abs(variation!).toFixed(1)}%
          </span>
          {variationLabel && <span className="text-xs text-zinc-500">{variationLabel}</span>}
        </div>
      )}

      {!hasVariation && variationLabel && (
        <p className="text-xs text-zinc-500 mt-1.5">{variationLabel}</p>
      )}
    </div>
  )
}
