'use client'
// ============================================================
// DATE FILTER — Filtre de période pour le tracker
// ============================================================
import React from 'react'
import { cn } from '@/lib/utils'
import { format, subDays, startOfMonth } from 'date-fns'
import Input from '@/components/ui/Input'

type Preset = '1d' | '7d' | '14d' | '30d' | '90d' | 'mtd' | 'custom'

interface DateRange {
  start: string
  end: string
}

interface DateFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: '1d', label: 'Auj.' },
  { key: '7d', label: '7j' },
  { key: '14d', label: '14j' },
  { key: '30d', label: '30j' },
  { key: '90d', label: '90j' },
  { key: 'mtd', label: 'Mois' },
  { key: 'custom', label: 'Perso' },
]

function getPresetRange(preset: Exclude<Preset, 'custom'>): DateRange {
  const today = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (preset) {
    case '1d':  return { start: fmt(today), end: fmt(today) }
    case '7d':  return { start: fmt(subDays(today, 6)), end: fmt(today) }
    case '14d': return { start: fmt(subDays(today, 13)), end: fmt(today) }
    case '30d': return { start: fmt(subDays(today, 29)), end: fmt(today) }
    case '90d': return { start: fmt(subDays(today, 89)), end: fmt(today) }
    case 'mtd': return { start: fmt(startOfMonth(today)), end: fmt(today) }
  }
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
  const [preset, setPreset] = React.useState<Preset>('30d')
  const [showCustom, setShowCustom] = React.useState(false)

  const handlePreset = (p: Preset) => {
    setPreset(p)
    if (p === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      onChange(getPresetRange(p as Exclude<Preset, 'custom'>))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex items-center gap-1 bg-[#171B23] rounded-lg p-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              preset === p.key
                ? 'bg-[#1F242D] text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-36 py-1 text-xs"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
          />
          <span className="text-xs text-zinc-600">→</span>
          <Input
            type="date"
            className="w-36 py-1 text-xs"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
