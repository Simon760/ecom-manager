'use client'
// ============================================================
// GLOBAL DASHBOARD — Agrégation de tous les projets
// ============================================================
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProjects } from '@/services/projects.service'
import { getDailyStats } from '@/services/tracker.service'
import { Project, DailyStat } from '@/types'
import { aggregateStats } from '@/lib/calculations'
import { formatCurrency, formatMultiplier, formatNumber, getLastNDays } from '@/lib/utils'
import MetricCard from './MetricCard'
import ProjectRanking from './ProjectRanking'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Card, { CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { formatDateShort } from '@/lib/utils'
import { FolderKanban, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'

interface ProjectWithStats {
  project: Project
  stats: DailyStat[]
  metrics: ReturnType<typeof aggregateStats>
}

export default function GlobalDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Calculé une seule fois via useMemo (ne change pas entre les renders)
  const days30 = useMemo(() => getLastNDays(30), [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const startDate = days30[0]
    const endDate = days30[days30.length - 1]
    const load = async () => {
      try {
        const projects = await getProjects(user.uid)
        if (cancelled) return
        const results = await Promise.all(
          projects.map(async (project) => {
            const stats = await getDailyStats(
              project.id,
              user.uid,
              startDate,
              endDate
            )
            return { project, stats, metrics: aggregateStats(stats) }
          })
        )
        if (!cancelled) setData(results)
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
  }, [user, days30])

  if (loading) return <Spinner size="lg" className="mt-16 mx-auto" text="Chargement du dashboard…" />
  if (loadError) return (
    <div>
      <TopBar title="Dashboard global" subtitle="Vue d'ensemble de tous vos projets" />
      <div className="mt-8 mx-auto max-w-md p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-center">
        {loadError}
      </div>
    </div>
  )

  // Totaux globaux
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

  // Agrégation des revenus par date pour le graphique global
  const revenueByDate: Record<string, number> = {}
  data.forEach(({ stats }) => {
    stats.forEach((s) => {
      revenueByDate[s.date] = (revenueByDate[s.date] || 0) + s.revenue
    })
  })
  const chartData = days30.map((d) => ({
    date: d,
    revenue: revenueByDate[d] || 0,
  }))

  if (data.length === 0) {
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

  // Devise dominante pour l'affichage (simplifié : on prend la première)
  const mainCurrency = data[0]?.project.currency ?? 'EUR'

  return (
    <div>
      <TopBar
        title="Dashboard global"
        subtitle={`30 derniers jours • ${data.length} projet${data.length > 1 ? 's' : ''}`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Revenue total"
          value={formatCurrency(total.revenue, mainCurrency)}
          icon={<DollarSign size={14} />}
          variationLabel="30j"
        />
        <MetricCard
          label="Profit total"
          value={formatCurrency(total.profit, mainCurrency)}
          icon={<TrendingUp size={14} />}
          variationLabel="30j"
        />
        <MetricCard
          label="Commandes"
          value={formatNumber(total.orders)}
          icon={<ShoppingCart size={14} />}
        />
        <MetricCard
          label="ROAS global"
          value={formatMultiplier(globalROAS)}
          icon={<TrendingUp size={14} />}
          variationLabel={`${formatCurrency(total.adSpend, mainCurrency)} dépensé`}
        />
      </div>

      {/* Graph + Ranking */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Graphique revenus 30j */}
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue 30 derniers jours" subtitle="Agrégation tous projets" />
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
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#52525b' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v) => formatCurrency(v, mainCurrency)}
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#a1a1aa' }}
                  itemStyle={{ color: '#a78bfa' }}
                  labelFormatter={(l) => formatDateShort(l as string)}
                  formatter={(v: number) => [formatCurrency(v, mainCurrency), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Classement projets */}
        <Card>
          <CardHeader title="Classement projets" subtitle="Par revenue 30j" />
          <ProjectRanking data={data} />
        </Card>
      </div>
    </div>
  )
}
