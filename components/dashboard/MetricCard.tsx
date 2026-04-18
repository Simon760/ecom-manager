'use client'
// ============================================================
// METRIC CARD — KPI card, style Mercury/Ramp (warm dark + tabular)
// ============================================================
import React from 'react'
import { cn } from '@/lib/utils'

type ColorMode = 'profit' | 'roas' | 'none'

interface MetricCardProps {
  label: string
  value: string
  rawValue?: number           // valeur brute pour la couleur du delta / seuil
  colorMode?: ColorMode       // 'profit' = vert/rouge selon signe | 'roas' = seuils ROAS
  breakEvenROAS?: number      // pour colorMode='roas'
  variation?: number          // % vs période précédente
  variationLabel?: string     // ex: "vs 7j préc."
  inverseVariation?: boolean  // pour CPA : baisse = bon
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// Couleur de la barre d'accent à gauche (subtile, indique état)
function getAccentColor(mode: ColorMode, raw?: number, beROAS?: number): string | null {
  if (raw === undefined) return null
  if (mode === 'profit') {
    if (raw > 0) return 'bg-emerald-500'
    if (raw < 0) return 'bg-red-500'
    return null
  }
  if (mode === 'roas') {
    if (beROAS && beROAS > 0) {
      if (raw >= beROAS * 1.2) return 'bg-emerald-500'
      if (raw >= beROAS) return 'bg-amber-500'
      return 'bg-red-500'
    }
    if (raw >= 3) return 'bg-emerald-500'
    if (raw >= 2) return 'bg-amber-500'
    return 'bg-red-500'
  }
  return null
}

function deltaColor(variation: number, inverse: boolean): string {
  if (Math.abs(variation) < 0.5) return 'text-zinc-500'
  const positive = inverse ? variation < 0 : variation > 0
  return positive ? 'text-emerald-400' : 'text-red-400'
}

function deltaArrow(variation: number): string {
  if (Math.abs(variation) < 0.5) return '—'
  return variation > 0 ? '▲' : '▼'
}

export default function MetricCard({
  label, value, rawValue, colorMode = 'none', breakEvenROAS,
  variation, variationLabel, inverseVariation = false,
  className, size = 'md',
}: MetricCardProps) {
  const hasVariation = variation !== undefined && !isNaN(variation)
  const accentColor = getAccentColor(colorMode, rawValue, breakEvenROAS)

  // Dimensions par taille
  const dims = {
    sm: { padding: 'p-4',   label: 'text-[10px]', value: 'text-[22px]', divider: 'my-3' },
    md: { padding: 'p-5',   label: 'text-[10px]', value: 'text-[28px]', divider: 'my-3' },
    lg: { padding: 'p-6',   label: 'text-[11px]', value: 'text-[36px]', divider: 'my-4' },
  }[size]

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-[#23272F] bg-[#12151C]',
        'transition-colors duration-200 hover:border-[#2F3541] hover:bg-[#141820]',
        dims.padding,
        className
      )}
    >
      {/* Barre d'accent verticale (gauche) */}
      {accentColor && (
        <div className={cn('absolute inset-y-3 left-0 w-[2px] rounded-full', accentColor)} />
      )}

      {/* Label */}
      <p className={cn(
        'font-medium uppercase tracking-[0.12em] text-zinc-500',
        dims.label
      )}>
        {label}
      </p>

      {/* Value */}
      <p className={cn(
        'font-semibold text-white num-display leading-none mt-3',
        dims.value
      )}>
        {value}
      </p>

      {/* Divider */}
      <div className={cn('h-px bg-[#1B1F27]', dims.divider)} />

      {/* Delta / Context */}
      <div className="flex items-center gap-1.5 min-h-[14px]">
        {hasVariation ? (
          <>
            <span className={cn('text-[11px] font-semibold tabular', deltaColor(variation!, inverseVariation))}>
              {deltaArrow(variation!)} {Math.abs(variation!).toFixed(1)}%
            </span>
            {variationLabel && (
              <span className="text-[11px] text-zinc-500">{variationLabel}</span>
            )}
          </>
        ) : variationLabel ? (
          <span className="text-[11px] text-zinc-500">{variationLabel}</span>
        ) : (
          <span className="text-[11px] text-zinc-600">—</span>
        )}
      </div>
    </div>
  )
}
