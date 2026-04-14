'use client'
import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import TopBar from '@/components/layout/TopBar'
import DailyEntryForm from '@/components/tracker/DailyEntryForm'
import CSVImportModal from '@/components/tracker/CSVImportModal'
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
import { getOffers } from '@/services/calculator.service'
import { Project, DailyStat, DailyStatFormData, CalculatorOffer, CURRENCY_SYMBOLS } from '@/types'
import { aggregateStats, computeDailyMetrics } from '@/lib/calculations'
import { formatCurrency, formatMultiplier, formatPercent, formatNumber, getLastNDays, todayStr } from '@/lib/utils'
import { Plus, BarChart2, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'

function TrackerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = searchParams.get('projectId')
  const [project, setProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<DailyStat[]>([])
  const [filteredStats, setFilteredStats] = useState<DailyStat[]>([])
  const [offers, setOffers] = useState<CalculatorOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editStat, setEditStat] = useState<DailyStat | null>(null)
  const [deleteStat, setDeleteStat] = useState<DailyStat | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ start: getLastNDays(30)[0], end: todayStr() })

  useEffect(() => { if (!projectId) router.replace('/projects') }, [projectId, router])

  useEffect(() => {
    if (!user || !projectId) return
    let cancelled = false
    const load = async () => {
      try {
        const [projects, statData, offerData] = await Promise.all([
          getProjects(user.uid),
          getDailyStats(projectId, user.uid),
          getOffers(user.uid, projectId),
        ])
        if (cancelled) return
        const proj = projects.find((p) => p.id === projectId)
        if (!proj) { router.replace('/projects'); return }
        setProject(proj)
        setStats(statData)
        setOffers(offerData)
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          console.error('Erreur chargement tracker:', err)
          setLoadError('Erreur lors du chargement. Veuillez recharger la page.')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [user, projectId]) // eslint-disable-line

  useEffect(() => {
    setFilteredStats(stats.filter((s) => s.date >= dateRange.start && s.date <= dateRange.end))
  }, [stats, dateRange])

  if (!projectId || loading) return <Spinner size="md" className="mt-16 mx-auto" />
  if (loadError) return (
    <div className="mt-16 mx-auto max-w-md p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-center">
      {loadError}
    </div>
  )
  if (!project) return null

  const sym = CURRENCY_SYMBOLS[project.currency]
  const metrics = aggregateStats(filteredStats)

  // BE ROAS depuis la première offre (référence) pour le coloring
  const beROAS = offers[0]?.outputs.breakEvenROAS

  const handleAdd = async (data: DailyStatFormData) => {
    setSaving(true); setSaveError(null)
    try {
      const newStat = await addDailyStat(projectId, user!.uid, data)
      setStats((prev) => [newStat, ...prev]); setShowAdd(false)
    } catch (err) {
      console.error('Erreur ajout stat:', err)
      setSaveError('Erreur lors de l\'enregistrement.')
    } finally { setSaving(false) }
  }

  const handleUpdate = async (data: DailyStatFormData) => {
    if (!editStat) return
    setSaving(true); setSaveError(null)
    try {
      await updateDailyStat(editStat.id, data)
      const m = computeDailyMetrics(data)
      setStats((prev) => prev.map((s) => s.id === editStat.id ? { ...s, ...data, ...m } : s))
      setEditStat(null)
    } catch (err) {
      console.error('Erreur mise à jour stat:', err)
      setSaveError('Erreur lors de la mise à jour.')
    } finally { setSaving(false) }
  }

  const handleBatchImport = async (rows: DailyStatFormData[]) => {
    setSaving(true); setSaveError(null)
    try {
      const newStats = await Promise.all(rows.map((row) => addDailyStat(projectId!, user!.uid, row)))
      setStats((prev) => [...newStats, ...prev])
      setShowImport(false)
    } catch (err) {
      console.error('Erreur import CSV:', err)
      setSaveError('Erreur lors de l\'import CSV.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteStat) return
    setSaving(true); setSaveError(null)
    try {
      await deleteDailyStat(deleteStat.id)
      setStats((prev) => prev.filter((s) => s.id !== deleteStat.id))
      setDeleteStat(null)
    } catch (err) {
      console.error('Erreur suppression stat:', err)
      setSaveError('Erreur lors de la suppression.')
    } finally { setSaving(false) }
  }

  return (
    <div>
      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {saveError}
        </div>
      )}
      <TopBar title={project.name} subtitle="Tracker journalier"
        badge={<Badge variant="violet">{sym} {project.currency}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<Upload size={14} />} size="sm" onClick={() => setShowImport(true)}>Import CSV</Button>
            <Button icon={<Plus size={14} />} size="sm" onClick={() => setShowAdd(true)}>Ajouter</Button>
          </div>
        } />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <MetricCard label="Revenue" value={formatCurrency(metrics.totalRevenue, project.currency)} rawValue={metrics.totalRevenue} colorMode="profit" size="sm" />
        <MetricCard label="Profit" value={formatCurrency(metrics.totalProfit, project.currency)} rawValue={metrics.totalProfit} colorMode="profit" size="sm" />
        <MetricCard label="ROAS" value={formatMultiplier(metrics.avgROAS)} rawValue={metrics.avgROAS} colorMode="roas" breakEvenROAS={beROAS} size="sm" />
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
          {/* Table d'abord, puis graphiques en bas */}
          <TrackerTable
            stats={filteredStats}
            currency={project.currency}
            onEdit={setEditStat}
            onDelete={setDeleteStat}
            breakEvenROAS={beROAS}
          />
          <TrackerCharts stats={filteredStats} currency={project.currency} />
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Ajouter une journée" size="md">
        <DailyEntryForm
          onSubmit={handleAdd} onCancel={() => setShowAdd(false)}
          loading={saving} currencySymbol={sym} currency={project.currency}
          offers={offers}
        />
      </Modal>
      <Modal isOpen={!!editStat} onClose={() => setEditStat(null)} title="Modifier la journée" size="md">
        {editStat && (
          <DailyEntryForm
            defaultValues={editStat}
            onSubmit={handleUpdate} onCancel={() => setEditStat(null)}
            loading={saving} currencySymbol={sym} currency={project.currency}
            offers={offers}
          />
        )}
      </Modal>
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Importer depuis un CSV" size="md">
        <CSVImportModal
          onImport={handleBatchImport}
          onCancel={() => setShowImport(false)}
          loading={saving}
          currencySymbol={sym}
        />
      </Modal>
      <ConfirmDialog isOpen={!!deleteStat} onClose={() => setDeleteStat(null)}
        message={`Supprimer les données du ${deleteStat?.date} ?`}
        loading={saving} onConfirm={handleDelete} />
    </div>
  )
}

export default function TrackerPage() {
  return <Suspense fallback={<Spinner size="md" className="mt-16 mx-auto" />}><TrackerContent /></Suspense>
}
