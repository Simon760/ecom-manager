'use client'
// ============================================================
// CREATIVES MANAGER — Suivi des créatives publicitaires
// ============================================================
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { getCreatives, addCreative, updateCreative, deleteCreative } from '@/services/creatives.service'
import { Creative, CreativeFormData, Currency } from '@/types'
import { formatCurrency, formatMultiplier, formatNumber } from '@/lib/utils'
import { safeDivide } from '@/lib/utils'
import { CURRENCY_SYMBOLS } from '@/types'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import { Plus, Trash2, Pencil, Palette, Trophy, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'winner', label: '🏆 Winner' },
  { value: 'testing', label: '🔬 En test' },
  { value: 'loser', label: '💀 Loser' },
]

interface CreativesManagerProps {
  projectId: string
  currency: Currency
}

export default function CreativesManager({ projectId, currency }: CreativesManagerProps) {
  const { user } = useAuth()
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Creative | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState<'roas' | 'spend' | 'revenue'>('roas')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getCreatives(projectId, user.uid)
      .then((items) => { if (!cancelled) setCreatives(items) })
      .catch((err) => {
        if (!cancelled) {
          console.error('Erreur chargement créatives:', err)
          setLoadError('Erreur lors du chargement des créatives.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId, user])

  const sorted = [...creatives].sort((a, b) => {
    if (sortBy === 'roas') return b.roas - a.roas
    if (sortBy === 'spend') return b.spend - a.spend
    return b.revenue - a.revenue
  })

  const totalSpend = creatives.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = creatives.reduce((s, c) => s + c.revenue, 0)
  const winners = creatives.filter((c) => c.status === 'winner').length
  const losers = creatives.filter((c) => c.status === 'loser').length

  const handleSubmit = async (data: CreativeFormData) => {
    setSaving(true)
    setSaveError(null)
    try {
      if (editItem) {
        await updateCreative(editItem.id, data)
        setCreatives((prev) => prev.map((c) => c.id === editItem.id ? {
          ...c, ...data, roas: safeDivide(data.revenue, data.spend)
        } : c))
      } else {
        const newC = await addCreative(projectId, user!.uid, data)
        setCreatives((prev) => [newC, ...prev])
      }
      setShowModal(false)
      setEditItem(null)
    } catch (err) {
      console.error('Erreur sauvegarde créative:', err)
      setSaveError('Erreur lors de l\'enregistrement de la créative.')
    } finally { setSaving(false) }
  }

  if (loading) return <Spinner size="md" className="mt-10 mx-auto" />
  if (loadError) return (
    <div className="mt-10 mx-auto max-w-md p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-center">
      {loadError}
    </div>
  )

  return (
    <div className="space-y-5">
      {saveError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {saveError}
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Total spend" value={formatCurrency(totalSpend, currency)} />
        <SummaryCard label="Total revenue" value={formatCurrency(totalRevenue, currency)} />
        <SummaryCard label="ROAS global" value={formatMultiplier(safeDivide(totalRevenue, totalSpend))} />
        <SummaryCard label="Winners / Losers" value={`${winners}W — ${losers}L`} />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <CardHeader title="Créatives" subtitle={`${creatives.length} créative${creatives.length > 1 ? 's' : ''}`} className="mb-0" />
          <div className="flex items-center gap-2">
            {/* Sort */}
            <Select
              options={[
                { value: 'roas', label: 'Trier : ROAS' },
                { value: 'spend', label: 'Trier : Dépense' },
                { value: 'revenue', label: 'Trier : Revenue' },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="py-1.5 text-xs"
            />
            <Button size="sm" icon={<Plus size={12} />} onClick={() => { setEditItem(null); setShowModal(true) }}>
              Ajouter
            </Button>
          </div>
        </div>

        {creatives.length === 0 ? (
          <EmptyState
            icon={<Palette size={22} />}
            title="Aucune créative"
            description="Ajoutez vos publicités pour identifier vos winners."
            action={{ label: '+ Ajouter une créative', onClick: () => setShowModal(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Statut', 'Nom', 'Dépense', 'Revenue', 'ROAS', 'CTR', 'Impressions', ''].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-zinc-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((creative) => (
                  <tr key={creative.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 group">
                    <td className="px-3 py-3">
                      <StatusBadge status={creative.status} />
                    </td>
                    <td className="px-3 py-3 text-zinc-200 font-medium max-w-[180px] truncate">
                      {creative.name}
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{formatCurrency(creative.spend, currency)}</td>
                    <td className="px-3 py-3 text-zinc-300">{formatCurrency(creative.revenue, currency)}</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'font-bold',
                        creative.roas >= 3 ? 'text-emerald-400' : creative.roas >= 2 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {formatMultiplier(creative.roas)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-500">
                      {creative.clicks && creative.impressions
                        ? `${((creative.clicks / creative.impressions) * 100).toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-3 text-zinc-500">
                      {creative.impressions ? formatNumber(creative.impressions) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => { setEditItem(creative); setShowModal(true) }}
                          className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => setDeleteId(creative.id)}
                          className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editItem ? 'Modifier la créative' : 'Nouvelle créative'} size="sm">
        <CreativeForm
          defaultValues={editItem ? {
            name: editItem.name, spend: editItem.spend, revenue: editItem.revenue,
            impressions: editItem.impressions, clicks: editItem.clicks, status: editItem.status,
          } : undefined}
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          currencySymbol={CURRENCY_SYMBOLS[currency]}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        message="Supprimer cette créative ?"
        loading={saving}
        onConfirm={async () => {
          if (!deleteId) return
          setSaving(true)
          setSaveError(null)
          try {
            await deleteCreative(deleteId)
            setCreatives((prev) => prev.filter((c) => c.id !== deleteId))
            setDeleteId(null)
          } catch (err) {
            console.error('Erreur suppression créative:', err)
            setSaveError('Erreur lors de la suppression.')
          } finally { setSaving(false) }
        }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: Creative['status'] }) {
  if (status === 'winner') return <Badge variant="success">🏆 Winner</Badge>
  if (status === 'loser') return <Badge variant="danger">💀 Loser</Badge>
  return <Badge variant="warning">🔬 Test</Badge>
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="sm">
      <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-zinc-100">{value}</p>
    </Card>
  )
}

function CreativeForm({ defaultValues, loading, onSubmit, onCancel, currencySymbol }: {
  defaultValues?: Partial<CreativeFormData>
  loading: boolean
  onSubmit: (data: CreativeFormData) => Promise<void>
  onCancel: () => void
  currencySymbol?: string
}) {
  const { register, handleSubmit } = useForm<CreativeFormData>({
    defaultValues: { status: 'testing', spend: 0, revenue: 0, ...defaultValues },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input label="Nom de la créative" placeholder="ex: VSL v3 — Carrousel Produit A" required
        {...register('name', { required: true })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Dépense" type="number" step="0.01" prefix={currencySymbol}
          {...register('spend', { valueAsNumber: true, min: 0 })} />
        <Input label="Revenue" type="number" step="0.01" prefix={currencySymbol}
          {...register('revenue', { valueAsNumber: true, min: 0 })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Impressions (opt.)" type="number"
          {...register('impressions', { valueAsNumber: true, min: 0 })} />
        <Input label="Clics (opt.)" type="number"
          {...register('clicks', { valueAsNumber: true, min: 0 })} />
      </div>
      <Select label="Statut" options={STATUS_OPTIONS} {...register('status')} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>Annuler</Button>
        <Button type="submit" fullWidth loading={loading}>Enregistrer</Button>
      </div>
    </form>
  )
}
