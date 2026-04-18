'use client'
// ============================================================
// TRACKER TABLE — Tableau des stats journalières
// ============================================================
import React from 'react'
import { DailyStat, Currency } from '@/types'
import {
  formatCurrency, formatDate, formatPercent, formatMultiplier, formatNumber,
} from '@/lib/utils'
import { calcVariation } from '@/lib/utils'
import { calcSevenDayAverages } from '@/lib/calculations'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrackerTableProps {
  stats: DailyStat[]
  currency: Currency
  onEdit: (stat: DailyStat) => void
  onDelete: (stat: DailyStat) => void
  breakEvenROAS?: number   // si fourni, colore le ROAS selon BE au lieu des seuils fixes
}

function getCumulativeProfit(stats: DailyStat[]): Record<string, number> {
  const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date))
  let cum = 0
  const map: Record<string, number> = {}
  sorted.forEach((s) => { cum += s.dailyProfit; map[s.id] = cum })
  return map
}

function roasClass(roas: number, be?: number): string {
  if (be && be > 0) {
    if (roas >= be * 1.2) return 'text-emerald-400'
    if (roas >= be) return 'text-amber-400'
    return 'text-red-400'
  }
  if (roas >= 3) return 'text-emerald-400'
  if (roas >= 2) return 'text-amber-400'
  return 'text-red-400'
}

export default function TrackerTable({ stats, currency, onEdit, onDelete, breakEvenROAS }: TrackerTableProps) {
  if (stats.length === 0) return null

  const sorted = [...stats].sort((a, b) => b.date.localeCompare(a.date))
  const cumMap = getCumulativeProfit(sorted)

  const last7 = sorted.slice(0, 7)
  const avg7 = calcSevenDayAverages(last7)

  const showCOGS = sorted.some((s) => s.cogsTotal !== undefined && s.cogsTotal > 0)

  return (
    <div className="overflow-x-auto rounded-xl border border-[#23272F] bg-[#12151C]">
      <table className="w-full text-xs tabular">
        <thead>
          <tr className="border-b border-[#23272F] bg-[#0E1118]">
            {[
              'Date', 'Revenue', 'Cmds', 'Pub',
              'ROAS', 'CPA', 'AOV', 'CVR',
              ...(showCOGS ? ['COGS'] : []),
              'Remb.', 'Profit J', 'Profit Cum.', 'Notes', ''
            ].map((h) => (
              <th key={h} className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
          {/* Moyennes 7j */}
          {sorted.length >= 2 && (
            <tr className="border-b border-[#1B1F27] bg-[#0E1118]/60">
              <td className="px-3 py-2 text-zinc-500 font-medium text-[10px] uppercase tracking-[0.08em]">Moy. 7j</td>
              <td className="px-3 py-2 text-zinc-400">{formatCurrency(avg7.avgRevenue, currency)}</td>
              <td className="px-3 py-2 text-zinc-400">{formatNumber(avg7.avgOrders, 1)}</td>
              <td className="px-3 py-2 text-zinc-400">{formatCurrency(avg7.avgAdSpend, currency)}</td>
              <td className="px-3 py-2 text-zinc-400">{formatMultiplier(avg7.avgROAS)}</td>
              <td className="px-3 py-2 text-zinc-400">{formatCurrency(avg7.avgCPA, currency)}</td>
              <td className="px-3 py-2 text-zinc-400">—</td>
              <td className="px-3 py-2 text-zinc-400">{formatPercent(avg7.avgCVR)}</td>
              {showCOGS && <td className="px-3 py-2 text-zinc-400">—</td>}
              <td className="px-3 py-2 text-zinc-400">—</td>
              <td className="px-3 py-2 text-zinc-400">{formatCurrency(avg7.avgProfit, currency)}</td>
              <td className="px-3 py-2" colSpan={showCOGS ? 3 : 3}></td>
            </tr>
          )}
        </thead>
        <tbody>
          {sorted.map((stat, idx) => {
            const prev = sorted[idx + 1]
            const revVar = prev ? calcVariation(stat.revenue, prev.revenue) : undefined
            const roasVar = prev ? calcVariation(stat.roas, prev.roas) : undefined
            const cpaVar = prev ? calcVariation(stat.cpa, prev.cpa) : undefined

            const profitPositive = stat.dailyProfit > 0
            const profitNeutral = stat.dailyProfit === 0
            const cumProfit = cumMap[stat.id] ?? 0

            return (
              <tr
                key={stat.id}
                className={cn(
                  'border-b border-[#1B1F27] transition-colors group',
                  profitPositive
                    ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.07]'
                    : profitNeutral
                    ? 'hover:bg-[#171B23]'
                    : 'bg-red-500/[0.04] hover:bg-red-500/[0.08]'
                )}
              >
                <td className="px-3 py-3 font-medium text-zinc-200 whitespace-nowrap">
                  {formatDate(stat.date)}
                  {idx === 0 && <span className="ml-1.5 text-[10px] text-violet-400">auj.</span>}
                </td>

                <td className="px-3 py-3 font-medium text-zinc-100">
                  {formatCurrency(stat.revenue, currency)}
                  {revVar !== undefined && <Delta value={revVar} />}
                </td>

                <td className="px-3 py-3 text-zinc-300">{stat.orders}</td>

                <td className="px-3 py-3 text-zinc-300">
                  {stat.channelBreakdowns?.length ? (
                    <span
                      className="cursor-help"
                      title={stat.channelBreakdowns.map((c) => `${c.label}: ${formatCurrency(c.adSpend, currency)}`).join('\n')}
                    >
                      {formatCurrency(stat.adSpend, currency)}
                      <span className="ml-1 text-[10px] text-violet-400/70">▾</span>
                    </span>
                  ) : formatCurrency(stat.adSpend, currency)}
                </td>

                <td className="px-3 py-3">
                  <span className={cn('font-semibold', roasClass(stat.roas, breakEvenROAS))}>
                    {formatMultiplier(stat.roas)}
                  </span>
                  {roasVar !== undefined && <Delta value={roasVar} />}
                  {breakEvenROAS && breakEvenROAS > 0 && stat.roas < breakEvenROAS && (
                    <span className="ml-1 text-[10px] text-red-500">▼BE</span>
                  )}
                </td>

                <td className="px-3 py-3">
                  <span className={cn(
                    avg7.avgCPA > 0 && stat.cpa > avg7.avgCPA * 1.2 ? 'text-red-400' : 'text-zinc-300'
                  )}>
                    {formatCurrency(stat.cpa, currency)}
                  </span>
                  {cpaVar !== undefined && <Delta value={cpaVar} inverse />}
                </td>

                <td className="px-3 py-3 text-zinc-300">{formatCurrency(stat.aov, currency)}</td>
                <td className="px-3 py-3 text-zinc-300">{formatPercent(stat.cvr)}</td>

                {showCOGS && (
                  <td className="px-3 py-3">
                    {stat.cogsTotal ? (
                      <span
                        className="text-amber-400/80 cursor-help"
                        title={stat.offerBreakdowns
                          ?.map((b) => `${b.offerName}: ${b.orders} × ${b.cogsPerOrder.toFixed(2)} = ${b.cogsTotal.toFixed(2)}`)
                          .join('\n') ?? ''}
                      >
                        − {formatCurrency(stat.cogsTotal, currency)}
                      </span>
                    ) : <span className="text-zinc-700">—</span>}
                  </td>
                )}

                <td className="px-3 py-3 text-zinc-400">
                  {stat.refunds > 0 ? formatCurrency(stat.refunds, currency) : '—'}
                </td>

                <td className="px-3 py-3">
                  <span className={cn(
                    'font-semibold',
                    profitPositive ? 'text-emerald-400' : profitNeutral ? 'text-zinc-400' : 'text-red-400'
                  )}>
                    {formatCurrency(stat.dailyProfit, currency)}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <span className={cumProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatCurrency(cumProfit, currency)}
                  </span>
                </td>

                <td className="px-3 py-3 text-zinc-600 max-w-xs truncate">
                  {stat.notes || '—'}
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(stat)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-[#1F242D] transition-colors"
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

function Delta({ value, inverse = false }: { value: number; inverse?: boolean }) {
  if (Math.abs(value) < 0.5) return null
  const isGood = inverse ? value < 0 : value > 0
  return (
    <span className={cn('ml-1.5 text-[10px] font-medium', isGood ? 'text-emerald-500' : 'text-red-500')}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}
