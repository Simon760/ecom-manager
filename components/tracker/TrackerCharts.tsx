'use client'
// ============================================================
// TRACKER CHARTS — Graphiques du tracker journalier
// ============================================================
import React, { useState } from 'react'
import {
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { DailyStat, Currency } from '@/types'
import { formatCurrency, formatMultiplier, formatPercent, formatDateShort } from '@/lib/utils'
import { calcCumulativeProfit } from '@/lib/calculations'
import Card, { CardHeader } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

type ChartTab = 'revenue' | 'roas' | 'cvr' | 'profit'

const TABS: { key: ChartTab; label: string }[] = [
  { key: 'revenue', label: 'Revenue vs Pub' },
  { key: 'roas', label: 'ROAS' },
  { key: 'cvr', label: 'CVR' },
  { key: 'profit', label: 'Profit cumulé' },
]

interface TrackerChartsProps {
  stats: DailyStat[]
  currency: Currency
}

export default function TrackerCharts({ stats, currency }: TrackerChartsProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('revenue')

  if (stats.length === 0) return null

  // Tri chronologique pour les graphiques
  const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date))
  const cumProfits = calcCumulativeProfit(sorted)

  const chartData = sorted.map((s, i) => ({
    date: s.date,
    revenue: s.revenue,
    adSpend: s.adSpend,
    roas: s.roas,
    cvr: s.cvr,
    cpa: s.cpa,
    dailyProfit: s.dailyProfit,
    cumProfit: cumProfits[i],
  }))

  const sym = currency

  const tooltipStyle = {
    contentStyle: {
      background: '#12151C',
      border: '1px solid #23272F',
      borderRadius: 8,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums' as const,
    },
    labelStyle: { color: '#8A93A3' },
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-4">
        <CardHeader title="Graphiques" subtitle={`${sorted.length} jours de données`} className="mb-0" />
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#0E1118] border border-[#1B1F27] rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-[#171B23] text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'revenue' ? (
            <ComposedChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B1F27" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 10, fill: '#5E6674' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#5E6674' }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => formatCurrency(v, sym)} />
              <Tooltip {...tooltipStyle} labelFormatter={(l) => formatDateShort(l as string)} formatter={(v: number, name) => [formatCurrency(v, sym), name === 'revenue' ? 'Revenue' : 'Pub']} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8A93A3' }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              <Bar yAxisId="left" dataKey="adSpend" name="Pub" fill="#2A2F38" radius={[2, 2, 0, 0]} maxBarSize={16} />
            </ComposedChart>
          ) : activeTab === 'roas' ? (
            <ComposedChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B1F27" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 10, fill: '#5E6674' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#5E6674' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}x`} />
              <Tooltip {...tooltipStyle} labelFormatter={(l) => formatDateShort(l as string)} formatter={(v: number, name) => [name === 'roas' ? formatMultiplier(v) : formatCurrency(v, sym), name === 'roas' ? 'ROAS' : 'CPA']} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8A93A3' }} />
              <Line type="monotone" dataKey="roas" name="ROAS" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} />
              {/* Ligne de référence ROAS 2x */}
              <Line type="monotone" dataKey={() => 2} name="Seuil 2x" stroke="#5E6674" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          ) : activeTab === 'cvr' ? (
            <ComposedChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B1F27" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 10, fill: '#5E6674' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#5E6674' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
              <Tooltip {...tooltipStyle} labelFormatter={(l) => formatDateShort(l as string)} formatter={(v: number) => [formatPercent(v), 'CVR']} />
              <Area type="monotone" dataKey="cvr" name="CVR" stroke="#34d399" strokeWidth={2} fill="#34d39920" dot={false} />
            </ComposedChart>
          ) : (
            // Profit cumulé
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B1F27" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 10, fill: '#5E6674' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#5E6674' }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => formatCurrency(v, sym)} />
              <Tooltip {...tooltipStyle} labelFormatter={(l) => formatDateShort(l as string)} formatter={(v: number) => [formatCurrency(v, sym), 'Profit cumulé']} />
              <Area type="monotone" dataKey="cumProfit" stroke="#34d399" strokeWidth={2} fill="url(#profitGrad)" dot={false} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
