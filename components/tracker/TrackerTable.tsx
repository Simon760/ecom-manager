'use client'
// ============================================================
// TRACKER TABLE — Tableau des stats journalières
// ============================================================
import React from 'react'
import { DailyStat, Currency } from '@/types'
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatMultiplier,
  formatNumber,
  variationColor,
  variationArrow,
} from '@/lib/utils'
import { calcVariation, calcSevenDayAverages } from '@/lib/calculations'
import Badge from '@/components/ui/Badge'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrackerTableProps {
  stats: DailyStat[]
  currency: Currency
  onEdit: (stat: DailyStat) => void
  onDelete: (stat: DailyStat) => void
}

// Calcule le profit cumulé
function getCumulativeProfit(stats: DailyStat[]): number[] {
  const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date))
  let cum = 0
  const map: Record<string, number> = {}
  sorted.forEach((s) => { cum += s.dailyProfit; map[s.id] = cum })
  return stats.map((s) => map[s.id])
}

export default function TrackerTable({ stats, currency, onEdit, onDelete }: TrackerTableProps) {
  if (stats.length === 0) return null

  // Sorted by date DESC for display
  const sorted = [...stats].sort((a, b) => b.date.localeCompare(a.date))
  const cumProfits = getCumulativeProfit(sorted)

  // 7j average (from last 7 entries)
  const last7 = sorted.slice(0, 7)
  const avg7 = calcSevenDayAverages(last7)

  const sym = currency

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80">
            {[
              'Date', 'Revenue', 'Commandes', 'Dépense pub',
              'ROAS', 'CPA', 'AOV', 'CVR', 'Remb.', 'Profit J', 'Profit Cum.', 'Notes', ''
            ].map((h) => (
              <th key={h} className="px-3 py-3 text-left font-semibold text-zinc-500 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
          {/* Ligne moyennes 7j */}
          {sorted.length >= 2 && (
            <tr className="border-b border-zinc-800 bg-zinc-800/30">
              <td className="px-3 py-2 text-zinc-600 font-medium">Moy. 7j</td>
              <td className="px-3 py-2 text-zinc-500">{formatCurrency(avg7.avgRevenue, sym)}</td>
              <td className="px-3 py-2 text-zinc-500">{formatNumber(avg7.avgOrders, 1)}</td>
              <td className="px-3 py-2 text-zinc-500">{formatCurrency(avg7.avgAdSpend, sym)}</td>
              <td className="px-3 py-2 text-zinc-500">{formatMultiplier(avg7.avgROAS)}</td>
              <td className="px-3 py-2 text-zinc-500">{formatCurrency(avg7.avgCPA, sym)}</td>
              <td className="px-3 py-2 text-zinc-500">—</td>
              <td className="px-3 py-2 text-zinc-500">{formatPercent(avg7.avgCVR)}</td>
              <td className="px-3 py-2 text-zinc-500">—</td>
              <td className="px-3 py-2 text-zinc-500">{formatCurrency(avg7.avgProfit, sym)}</td>
              <td className="px-3 py-2" colSpan={3}></td>
            </tr>
          )}
        </thead>
        <tbody>
          {sorted.map((stat, idx) => {
            // Comparaison J-1
            const prev = sorted[idx + 1]
            const revVar = prev ? calcVariation(stat.revenue, prev.revenue) : undefined
            const roasVar = prev ? calcVariation(stat.roas, prev.roas) : undefined
            const cpaVar = prev ? calcVariation(stat.cpa, prev.cpa) : undefined

            const profitPositive = stat.dailyProfit >= 0
            const cumProfit = cumProfits[idx]

            return (
              <tr
                key={stat.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group"
              >
                <td className="px-3 py-3 font-medium text-zinc-300 whitespace-nowrap">
                  {formatDate(stat.date)}
                  {idx === 0 && <span className="ml-1.5 text-[10px] text-violet-400">aujourd&apos;hui</span>}
                </td>

                <td className="px-3 py-3 font-medium text-zinc-100">
                  <span>{formatCurrency(stat.revenue, sym)}</span>
                  {revVar !== undefined && (
                    <DeltaBadge value={revVar} />
                  )}
                </td>

                <td className="px-3 py-3 text-zinc-300">{stat.orders}</td>

                <td className="px-3 py-3 text-zinc-400">{formatCurrency(stat.adSpend, sym)}</td>

                <td className="px-3 py-3">
                  <span className={cn(
                    'font-semibold',
                    stat.roas >= 3 ? 'text-emerald-400' : stat.roas >= 2 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {formatMultiplier(stat.roas)}
                  </span>
                  {roasVar !== undefined && <DeltaBadge value={roasVar} />}
                </td>

                <td className="px-3 py-3">
                  <span className={cn(
                    avg7.avgCPA > 0 && stat.cpa > avg7.avgCPA * 1.2
                      ? 'text-red-400'
                      : 'text-zinc-300'
                  )}>
                    {formatCurrency(stat.cpa, sym)}
                  </span>
                  {cpaVar !== undefined && <DeltaBadge value={cpaVar} inverse />}
                </td>

                <td className="px-3 py-3 text-zinc-400">{formatCurrency(stat.aov, sym)}</td>

                <td className="px-3 py-3 text-zinc-400">{formatPercent(stat.cvr)}</td>

                <td className="px-3 py-3 text-zinc-500">
                  {stat.refunds > 0 ? formatCurrency(stat.refunds, sym) : '—'}
                </td>

                <td className="px-3 py-3">
                  <span className={profitPositive ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {formatCurrency(stat.dailyProfit, sym)}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <span className={cumProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatCurrency(cumProfit, sym)}
                  </span>
                </td>

                <td className="px-3 py-3 text-zinc-600 max-w-xs truncate">
                  {stat.notes || '—'}
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(stat)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => onDelete(stat)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Mini delta badge
function DeltaBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  if (Math.abs(value) < 0.5) return null
  const isGood = inverse ? value < 0 : value > 0
  return (
    <span className={cn(
      'ml-1.5 text-[10px] font-medium',
      isGood ? 'text-emerald-500' : 'text-red-500'
    )}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}
