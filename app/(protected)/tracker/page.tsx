'use client'
import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import TopBar from '@/components/layout/TopBar'
import DailyEntryForm from '@/components/tracker/DailyEntryForm'
import TrackerTable from '@/components/tracker/TrackerTable'
import TrackerCharts from '@/components/tracker/TrackerCharts'
import DateFilter from '@/components/tracker/DateFilter'
import MetricCard from '@/components/dashboard/MetricCard'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { getProjects } from '@/services/projects.service'
import { getDailyStats, addDailyStat, updateDailyStat, deleteDailyStat } from '@/services/tracker.service'
import { Project, DailyStat, DailyStatFormData, CURRENCY_SYMBOLS } from '@/types'
import { aggregateStats } from '@/lib/calculations'
import { formatCurrency, formatMultiplier, formatPercent, formatNumber, getLastNDays, todayStr } from '@/lib/utils'
import { Plus, BarChart2 } from 'lucide-react'
import { useState, useEffect } from 'react'

function TrackerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = searchParams.get('projectId')
  const [project, setProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<DailyStat[]>([])
  const [filteredStats, setFilteredStats] = useState<DailyStat[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editStat, setEditStat] = useState<DailyStat | null>(null)
  const [deleteStat, setDeleteStat] = useState<DailyStat | null>(null)
  const [saving, setSaving] = useState(false)
  const [dateRange, setDateRange] = useState({ start: getLastNDays(30)[0], end: todayStr() })

  useEffect(() => { if (!projectId) router.replace('/projects') }, [projectId, router])

  useEffect(() => {
    if (!user || !projectId) return
    const load = async () => {
      const [projects, statData] = await Promise.all([getProjects(user.uid), getDailyStats(projectId, user.uid)])
      const proj = projects.find((p) => p.id === projectId)
      if (!proj) { router.replace('/projects'); return }
      setProject(proj); setStats(statData); setLoading(false)
    }
    load()
  }, [user, projectId]) // eslint-disable-line

  useEffect(() => {
    setFilteredStats(stats.filter((s) => s.date >= dateRange.start && s.date <= dateRange.end))
  }, [stats, dateRange])

  if (!projectId || loading) return <Spinner size="md" className="mt-16 mx-auto" />
  if (!project) return null

  const sym = CURRENCY_SYMBOLS[project.currency]
  const metrics = aggregateStats(filteredStats)

  const handleAdd = async (data: DailyStatFormData) => {
    setSaving(true)
    try {
      const newStat = await addDailyStat(projectId, user!.uid, data)
      setStats((prev) => [newStat, ...prev]); setShowAdd(false)
    } finally { setSaving(false) }
  }

  const handleUpdate = async (data: DailyStatFormData) => {
    if (!editStat) return
    setSaving(true)
    try {
      await updateDailyStat(editStat.id, data)
      const m = { cpa: data.adSpend/(data.orders||1), aov: data.revenue/(data.orders||1), roas: data.adSpend>0?data.revenue/data.adSpend:0, cvr: data.sessions?(data.orders/data.sessions)*100:data.addToCart>0?(data.orders/data.addToCart)*100:0, mer: data.adSpend>0?data.revenue/data.adSpend:0, dailyProfit: data.revenue-data.adSpend-data.refunds }
      setStats((prev) => prev.map((s) => s.id === editStat.id ? { ...s, ...data, ...m } : s)); setEditStat(null)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteStat) return
    setSaving(true)
    try { await deleteDailyStat(deleteStat.id); setStats((prev) => prev.filter((s) => s.id !== deleteStat.id)); setDeleteStat(null) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <TopBar title={project.name} subtitle="Tracker journalier"
        badge={<Badge variant="violet">{sym} {project.currency}</Badge>}
        actions={<Button icon={<Plus size={14} />} size="sm" onClick={() => setShowAdd(true)}>Ajouter</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <MetricCard label="Revenue" value={formatCurrency(metrics.totalRevenue, project.currency)} size="sm" />
        <MetricCard label="Profit" value={formatCurrency(metrics.totalProfit, project.currency)} size="sm" />
        <MetricCard label="ROAS" value={formatMultiplier(metrics.avgROAS)} size="sm" />
        <MetricCard label="CPA" value={formatCurrency(metrics.avgCPA, project.currency)} size="sm" inverseVariation />
        <MetricCard label="AOV" value={formatCurrency(metrics.avgAOV, project.currency)} size="sm" />
        <MetricCard label="Commandes" value={formatNumber(metrics.totalOrders)} size="sm" />
      </div>
      <div className="mb-4"><DateFilter value={dateRange} onChange={setDateRange} /></div>
      {filteredStats.length === 0 ? (
        <EmptyState icon={<BarChart2 size={24} />} title="Aucune donnée sur cette période"
          action={{ label: '+ Ajouter une journée', onClick: () => setShowAdd(true) }} />
      ) : (
        <div className="space-y-5">
          <TrackerCharts stats={filteredStats} currency={project.currency} />
          <TrackerTable stats={filteredStats} currency={project.currency} onEdit={setEditStat} onDelete={setDeleteStat} />
        </div>
      )}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Ajouter une journée" size="md">
        <DailyEntryForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={saving} currencySymbol={sym} />
      </Modal>
      <Modal isOpen={!!editStat} onClose={() => setEditStat(null)} title="Modifier la journée" size="md">
        {editStat && <DailyEntryForm defaultValues={editStat} onSubmit={handleUpdate} onCancel={() => setEditStat(null)} loading={saving} currencySymbol={sym} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleteStat} onClose={() => setDeleteStat(null)} message={`Supprimer les données du ${deleteStat?.date} ?`} loading={saving} onConfirm={handleDelete} />
    </div>
  )
}

export default function TrackerPage() {
  return <Suspense fallback={<Spinner size="md" className="mt-16 mx-auto" />}><TrackerContent /></Suspense>
}
