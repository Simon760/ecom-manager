'use client'
// ============================================================
// GLOBAL DASHBOARD — Agrégation de tous les projets
// ============================================================
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProjects } from '@/services/projects.service'
import { getDailyStats } from '@/services/tracker.service'
import { Project, DailyStat } from '@/types'
import { aggregateStats } from '@/lib/calculations'
import { formatCurrency, formatMultiplier, formatNumber, formatDateShort } from '@/lib/utils'
import { format, subDays, startOfMonth } from 'date-fns'
import MetricCard from './MetricCard'
import ProjectRanking from './ProjectRanking'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Card, { CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { FolderKanban, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

type Period = '1d' | '7d' | '30d'

const PERIODS: { key: Period; label: string }[] = [
  { key: '1d', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
]

function getPeriodRange(period: Period): { start: string; end: string; days: string[] } {
  const today = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  const end = fmt(today)
  let start: string
  let days: string[] = []

  if (period === '1d') {
    start = end
    days = [end]
  } else if (period === '7d') {
    start = fmt(subDays(today, 6))
    for (let i = 6; i >= 0; i--) days.push(fmt(subDays(today, i)))
  } else {
    start = fmt(subDays(today, 29))
    for (let i = 29; i >= 0; i--) days.push(fmt(subDays(today, i)))
  }
  return { start, end, days }
}

interface ProjectWithStats {
  project: Project
  stats: DailyStat[]
  metrics: ReturnType<typeof aggregateStats>
}

export default function GlobalDashboard() {
  const { user } = useAuth()
  const [allData, setAllData] = useState<{ project: Project; stats: DailyStat[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('30d')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      try {
        const projects = await getProjects(user.uid)
        if (cancelled) return
        const results = await Promise.all(
          projects.map(async (project) => {
            const stats = await getDailyStats(project.id, user.uid)
            return { project, stats }
          })
        )
        if (!cancelled) setAllData(results)
      } catch (err) {
        if (!cancelled) {
          console.error('Erreur chargement dashboard:', err)
          setLoadError('Erreur lors du chargement du dashboard.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  if (loading) return <Spinner size="lg" className="mt-16 mx-auto" text="Chargement du dashboard…" />
  if (loadError) return (
    <div>
      <TopBar title="Dashboard global" subtitle="Vue d'ensemble de tous vos projets" />
      <div className="mt-8 mx-auto max-w-md p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-center">
        {loadError}
      </div>
    </div>
  )

  if (allData.length === 0) {
    return (
      <div>
        <TopBar title="Dashboard global" subtitle="Vue d'ensemble de tous vos projets" />
        <EmptyState
          icon={<FolderKanban size={24} />}
          title="Aucun projet"
          description="Créez votre premier projet e-commerce pour commencer à tracker vos performances."
          action={{ label: '+ Nouveau projet', onClick: () => {} }}
        />
      </div>
    )
  }

  const { start, end, days } = getPeriodRange(period)

  // Filtrer et agréger les données selon la période sélectionnée
  const data: ProjectWithStats[] = allData.map(({ project, stats }) => {
    const filtered = stats.filter((s) => s.date >= start && s.date <= end)
    return { project, stats: filtered, metrics: aggregateStats(filtered) }
  })

  const total = data.reduce(
    (acc, { metrics }) => ({
      revenue: acc.revenue + metrics.totalRevenue,
      adSpend: acc.adSpend + metrics.totalAdSpend,
      profit: acc.profit + metrics.totalProfit,
      orders: acc.orders + metrics.totalOrders,
    }),
    { revenue: 0, adSpend: 0, profit: 0, orders: 0 }
  )
  const globalROAS = total.adSpend > 0 ? total.revenue / total.adSpend : 0
  const mainCurrency = allData[0]?.project.currency ?? 'EUR'

  // Agrégation revenus par date pour le graphique
  const revenueByDate: Record<string, number> = {}
  data.forEach(({ stats }) => {
    stats.forEach((s) => {
      revenueByDate[s.date] = (revenueByDate[s.date] || 0) + s.revenue
    })
  })
  const chartData = days.map((d) => ({ date: d, revenue: revenueByDate[d] || 0 }))

  const periodLabel = period === '1d' ? "aujourd'hui" : period === '7d' ? '7 derniers jours' : '30 derniers jours'

  return (
    <div>
      <TopBar
        title="Dashboard global"
        subtitle={`${data.length} projet${data.length > 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  period === p.key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Revenue total"
          value={formatCurrency(total.revenue, mainCurrency)}
          rawValue={total.revenue} colorMode="profit"
          icon={<DollarSign size={14} />}
          variationLabel={periodLabel}
        />
        <MetricCard
          label="Profit total"
          value={formatCurrency(total.profit, mainCurrency)}
          rawValue={total.profit} colorMode="profit"
          icon={<TrendingUp size={14} />}
          variationLabel={periodLabel}
        />
        <MetricCard
          label="Commandes"
          value={formatNumber(total.orders)}
          icon={<ShoppingCart size={14} />}
        />
        <MetricCard
          label="ROAS global"
          value={formatMultiplier(globalROAS)}
          rawValue={globalROAS} colorMode="roas"
          icon={<TrendingUp size={14} />}
          variationLabel={`${formatCurrency(total.adSpend, mainCurrency)} dépensé`}
        />
      </div>

      {/* Graph + Ranking */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title={`Revenue — ${periodLabel}`} subtitle="Agrégation tous projets" />
          {period === '1d' ? (
            <div className="h-52 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-violet-400">{formatCurrency(total.revenue, mainCurrency)}</p>
                <p className="text-xs text-zinc-500 mt-2">Revenue aujourd'hui</p>
              </div>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    tick={{ fontSize: 10, fill: '#52525b' }}
                    axisLine={false} tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#52525b' }}
                    axisLine={false} tickLine={false} width={50}
                    tickFormatter={(v) => formatCurrency(v, mainCurrency)}
                  />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#a1a1aa' }}
                    itemStyle={{ color: '#a78bfa' }}
                    labelFormatter={(l) => formatDateShort(l as string)}
                    formatter={(v: number) => [formatCurrency(v, mainCurrency), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2}
                    fill="url(#revenueGradient)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Classement projets" subtitle={`Par revenue — ${periodLabel}`} />
          <ProjectRanking data={data} />
        </Card>
      </div>
    </div>
  )
}
