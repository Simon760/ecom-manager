'use client'
// ============================================================
// FINANCE MANAGER — P&L : Dépenses + Revenus
// ============================================================
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import {
  getExpenses, addExpense, updateExpense, deleteExpense,
  getRevenues, addRevenue, updateRevenue, deleteRevenue,
} from '@/services/finance.service'
import { Expense, Revenue, ExpenseFormData, RevenueFormData, Currency, EXPENSE_CATEGORY_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import { Plus, Trash2, Pencil, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinanceManagerProps {
  projectId: string
  currency: Currency
}

const CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))
const TYPE_OPTIONS = [{ value: 'cash', label: 'Cash' }, { value: 'accrual', label: 'Accrual' }]
const SOURCE_OPTIONS = [
  { value: 'shopify', label: 'Shopify Payout' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'other', label: 'Autre' },
]

type ActiveTab = 'expenses' | 'revenues' | 'pnl'

export default function FinanceManager({ projectId, currency }: FinanceManagerProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<ActiveTab>('pnl')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [loading, setLoading] = useState(true)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [editRevenue, setEditRevenue] = useState<Revenue | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'expense' | 'revenue'; id: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      try {
        const [exps, revs] = await Promise.all([
          getExpenses(projectId, user.uid),
          getRevenues(projectId, user.uid),
        ])
        if (cancelled) return
        setExpenses(exps)
        setRevenues(revs)
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          console.error('Erreur chargement finance:', err)
          setLoadError('Erreur lors du chargement des données financières.')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [projectId, user])

  // Calculs P&L
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0)
  const netProfit = totalRevenues - totalExpenses

  // P&L par mois
  const pnlByMonth: Record<string, { month: string; expenses: number; revenues: number; profit: number }> = {}
  const getMonth = (date: string) => date.slice(0, 7)
  expenses.forEach((e) => {
    const m = getMonth(e.date)
    if (!pnlByMonth[m]) pnlByMonth[m] = { month: m, expenses: 0, revenues: 0, profit: 0 }
    pnlByMonth[m].expenses += e.amount
    pnlByMonth[m].profit -= e.amount
  })
  revenues.forEach((r) => {
    const m = getMonth(r.date)
    if (!pnlByMonth[m]) pnlByMonth[m] = { month: m, expenses: 0, revenues: 0, profit: 0 }
    pnlByMonth[m].revenues += r.amount
    pnlByMonth[m].profit += r.amount
  })
  const pnlRows = Object.values(pnlByMonth).sort((a, b) => b.month.localeCompare(a.month))

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
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5"><TrendingUp size={12} /> Revenus totaux</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalRevenues, currency)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5"><TrendingDown size={12} /> Dépenses totales</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses, currency)}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5"><Wallet size={12} /> Profit net</p>
          <p className={cn('text-xl font-bold', netProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {formatCurrency(netProfit, currency)}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1 w-fit">
        {([
          ['pnl', 'P&L mensuel'],
          ['expenses', 'Dépenses'],
          ['revenues', 'Revenus / Payouts'],
        ] as [ActiveTab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              tab === key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
            {label}
          </button>
        ))}
      </div>

      {/* P&L Table */}
      {tab === 'pnl' && (
        <Card>
          <CardHeader title="P&L mensuel" />
          {pnlRows.length === 0 ? (
            <EmptyState title="Aucune donnée" description="Ajoutez des dépenses et revenus pour voir votre P&L." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {['Mois', 'Revenus', 'Dépenses', 'Profit net', 'Marge'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-zinc-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pnlRows.map((row) => (
                    <tr key={row.month} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="px-3 py-3 text-zinc-300 font-medium">{row.month}</td>
                      <td className="px-3 py-3 text-emerald-400">{formatCurrency(row.revenues, currency)}</td>
                      <td className="px-3 py-3 text-red-400">{formatCurrency(row.expenses, currency)}</td>
                      <td className={cn('px-3 py-3 font-bold', row.profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {formatCurrency(row.profit, currency)}
                      </td>
                      <td className="px-3 py-3 text-zinc-400">
                        {row.revenues > 0 ? `${((row.profit / row.revenues) * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <Card>
          <CardHeader
            title="Dépenses"
            action={
              <Button size="sm" icon={<Plus size={12} />} onClick={() => { setEditExpense(null); setShowExpenseModal(true) }}>
                Ajouter
              </Button>
            }
          />
          {expenses.length === 0 ? (
            <EmptyState title="Aucune dépense" action={{ label: '+ Ajouter', onClick: () => setShowExpenseModal(true) }} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {['Date', 'Catégorie', 'Description', 'Type', 'Montant', ''].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-zinc-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 group">
                      <td className="px-3 py-3 text-zinc-400">{formatDate(exp.date)}</td>
                      <td className="px-3 py-3"><Badge>{EXPENSE_CATEGORY_LABELS[exp.category]}</Badge></td>
                      <td className="px-3 py-3 text-zinc-300">{exp.description}</td>
                      <td className="px-3 py-3 text-zinc-500">{exp.type}</td>
                      <td className="px-3 py-3 text-red-400 font-medium">{formatCurrency(exp.amount, currency)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button onClick={() => { setEditExpense(exp); setShowExpenseModal(true) }}
                            className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700">
                            <Pencil size={11} />
                          </button>
                          <button onClick={() => setDeleteTarget({ type: 'expense', id: exp.id })}
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
      )}

      {/* Revenues */}
      {tab === 'revenues' && (
        <Card>
          <CardHeader
            title="Revenus / Payouts"
            action={
              <Button size="sm" icon={<Plus size={12} />} onClick={() => { setEditRevenue(null); setShowRevenueModal(true) }}>
                Ajouter
              </Button>
            }
          />
          {revenues.length === 0 ? (
            <EmptyState title="Aucun revenu" action={{ label: '+ Ajouter', onClick: () => setShowRevenueModal(true) }} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {['Date', 'Source', 'Description', 'Type', 'Montant', ''].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-zinc-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {revenues.map((rev) => (
                    <tr key={rev.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 group">
                      <td className="px-3 py-3 text-zinc-400">{formatDate(rev.date)}</td>
                      <td className="px-3 py-3"><Badge variant="success">{rev.source}</Badge></td>
                      <td className="px-3 py-3 text-zinc-300">{rev.description}</td>
                      <td className="px-3 py-3 text-zinc-500">{rev.type}</td>
                      <td className="px-3 py-3 text-emerald-400 font-medium">{formatCurrency(rev.amount, currency)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button onClick={() => { setEditRevenue(rev); setShowRevenueModal(true) }}
                            className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700">
                            <Pencil size={11} />
                          </button>
                          <button onClick={() => setDeleteTarget({ type: 'revenue', id: rev.id })}
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
      )}

      {/* Modals */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        editItem={editExpense}
        loading={saving}
        onSubmit={async (data) => {
          setSaving(true)
          setSaveError(null)
          try {
            if (editExpense) {
              await updateExpense(editExpense.id, data)
              setExpenses((prev) => prev.map((e) => e.id === editExpense.id ? { ...e, ...data } : e))
            } else {
              const newExp = await addExpense(projectId, user!.uid, data)
              setExpenses((prev) => [newExp, ...prev])
            }
            setShowExpenseModal(false)
            setEditExpense(null)
          } catch (err) {
            console.error('Erreur sauvegarde dépense:', err)
            setSaveError('Erreur lors de l\'enregistrement de la dépense.')
          } finally { setSaving(false) }
        }}
      />

      <RevenueModal
        isOpen={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        editItem={editRevenue}
        loading={saving}
        onSubmit={async (data) => {
          setSaving(true)
          setSaveError(null)
          try {
            if (editRevenue) {
              await updateRevenue(editRevenue.id, data)
              setRevenues((prev) => prev.map((r) => r.id === editRevenue.id ? { ...r, ...data } : r))
            } else {
              const newRev = await addRevenue(projectId, user!.uid, data)
              setRevenues((prev) => [newRev, ...prev])
            }
            setShowRevenueModal(false)
            setEditRevenue(null)
          } catch (err) {
            console.error('Erreur sauvegarde revenu:', err)
            setSaveError('Erreur lors de l\'enregistrement du revenu.')
          } finally { setSaving(false) }
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        message="Supprimer cette entrée ? Cette action est irréversible."
        loading={saving}
        onConfirm={async () => {
          if (!deleteTarget) return
          setSaving(true)
          setSaveError(null)
          try {
            if (deleteTarget.type === 'expense') {
              await deleteExpense(deleteTarget.id)
              setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget.id))
            } else {
              await deleteRevenue(deleteTarget.id)
              setRevenues((prev) => prev.filter((r) => r.id !== deleteTarget.id))
            }
            setDeleteTarget(null)
          } catch (err) {
            console.error('Erreur suppression:', err)
            setSaveError('Erreur lors de la suppression.')
          } finally { setSaving(false) }
        }}
      />
    </div>
  )
}

// --- Expense Modal ---
function ExpenseModal({ isOpen, onClose, editItem, loading, onSubmit }: {
  isOpen: boolean; onClose: () => void; editItem: Expense | null; loading: boolean
  onSubmit: (data: ExpenseFormData) => Promise<void>
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: editItem ? {
      date: editItem.date, category: editItem.category,
      description: editItem.description, amount: editItem.amount, type: editItem.type,
    } : { date: new Date().toISOString().split('T')[0], category: 'ads', type: 'cash' },
  })
  useEffect(() => { if (isOpen) reset(editItem ? { date: editItem.date, category: editItem.category, description: editItem.description, amount: editItem.amount, type: editItem.type } : { date: new Date().toISOString().split('T')[0], category: 'ads', type: 'cash' }) }, [isOpen, editItem]) // eslint-disable-line
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Modifier la dépense' : 'Nouvelle dépense'} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input label="Date" type="date" required {...register('date', { required: true })} />
        <Select label="Catégorie" options={CATEGORY_OPTIONS} required {...register('category', { required: true })} />
        <Input label="Description" placeholder="ex: Meta Ads Juillet" required {...register('description', { required: true })} />
        <Input label="Montant" type="number" step="0.01" required {...register('amount', { valueAsNumber: true, required: true, min: 0 })} />
        <Select label="Type" options={TYPE_OPTIONS} {...register('type')} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Annuler</Button>
          <Button type="submit" fullWidth loading={loading}>Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

// --- Revenue Modal ---
function RevenueModal({ isOpen, onClose, editItem, loading, onSubmit }: {
  isOpen: boolean; onClose: () => void; editItem: Revenue | null; loading: boolean
  onSubmit: (data: RevenueFormData) => Promise<void>
}) {
  const { register, handleSubmit, reset } = useForm<RevenueFormData>({
    defaultValues: editItem ? {
      date: editItem.date, description: editItem.description,
      amount: editItem.amount, source: editItem.source, type: editItem.type,
    } : { date: new Date().toISOString().split('T')[0], source: 'shopify', type: 'cash' },
  })
  useEffect(() => { if (isOpen) reset(editItem ? { date: editItem.date, description: editItem.description, amount: editItem.amount, source: editItem.source, type: editItem.type } : { date: new Date().toISOString().split('T')[0], source: 'shopify', type: 'cash' }) }, [isOpen, editItem]) // eslint-disable-line
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? 'Modifier le revenu' : 'Nouveau revenu / payout'} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input label="Date" type="date" required {...register('date', { required: true })} />
        <Select label="Source" options={SOURCE_OPTIONS} required {...register('source', { required: true })} />
        <Input label="Description" placeholder="ex: Payout Shopify #124" required {...register('description', { required: true })} />
        <Input label="Montant" type="number" step="0.01" required {...register('amount', { valueAsNumber: true, required: true, min: 0 })} />
        <Select label="Type" options={TYPE_OPTIONS} {...register('type')} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Annuler</Button>
          <Button type="submit" fullWidth loading={loading}>Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}
