'use client'
// ============================================================
// DAILY ENTRY FORM — Formulaire de saisie journalière
// ============================================================
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { DailyStatFormData, CalculatorOffer, OfferBreakdownItem } from '@/types'
import { todayStr, formatCurrency } from '@/lib/utils'
import { Textarea } from '@/components/ui/Input'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyEntryFormProps {
  defaultValues?: Partial<DailyStatFormData>
  onSubmit: (data: DailyStatFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  currencySymbol?: string
  currency?: string
  offers?: CalculatorOffer[]
}

export default function DailyEntryForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
  currencySymbol = '€',
  currency = 'EUR',
  offers = [],
}: DailyEntryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DailyStatFormData>({
    defaultValues: {
      date: todayStr(),
      revenue: 0,
      orders: 0,
      adSpend: 0,
      addToCart: 0,
      checkout: 0,
      sessions: undefined,
      refunds: 0,
      notes: '',
      ...defaultValues,
    },
  })

  // Lignes COGS multi-offres (gérées en dehors de react-hook-form)
  const [lines, setLines] = useState<OfferBreakdownItem[]>(() => {
    if (defaultValues?.offerBreakdowns?.length) return defaultValues.offerBreakdowns
    return []
  })

  const addLine = () => {
    if (offers.length === 0) return
    const first = offers[0]
    setLines((prev) => [
      ...prev,
      {
        offerId: first.id,
        offerName: first.name,
        orders: 0,
        cogsPerOrder: first.outputs.totalVariableCosts,
        cogsTotal: 0,
      },
    ])
  }

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))

  const updateLine = (idx: number, field: 'offerId' | 'orders', value: string | number) => {
    setLines((prev) => {
      const next = [...prev]
      const line = { ...next[idx] }
      if (field === 'offerId') {
        const offer = offers.find((o) => o.id === value)
        if (offer) {
          line.offerId = offer.id
          line.offerName = offer.name
          line.cogsPerOrder = offer.outputs.totalVariableCosts
          line.cogsTotal = Math.round(offer.outputs.totalVariableCosts * line.orders * 100) / 100
        }
      } else {
        const qty = Number(value) || 0
        line.orders = qty
        line.cogsTotal = Math.round(line.cogsPerOrder * qty * 100) / 100
      }
      next[idx] = line
      return next
    })
  }

  const totalCOGS = lines.reduce((s, l) => s + l.cogsTotal, 0)
  const totalCOGSOrders = lines.reduce((s, l) => s + l.orders, 0)

  const numericField = (name: keyof DailyStatFormData, required = true) => ({
    valueAsNumber: true,
    required: required ? 'Requis' : false,
    min: { value: 0, message: 'Doit être ≥ 0' },
  })

  const handleFormSubmit = async (data: DailyStatFormData) => {
    const payload: DailyStatFormData = {
      ...data,
      offerBreakdowns: lines.length > 0 ? lines : undefined,
      cogsTotal: lines.length > 0 ? Math.round(totalCOGS * 100) / 100 : undefined,
    }
    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Date */}
      <Input label="Date" type="date" required
        error={errors.date?.message}
        {...register('date', { required: 'Date requise' })}
      />

      {/* Revenue + Orders */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Revenue" type="number" step="0.01" required
          prefix={currencySymbol} error={errors.revenue?.message}
          {...register('revenue', numericField('revenue'))}
        />
        <Input label="Commandes (total)" type="number" step="1" required
          error={errors.orders?.message}
          hint={totalCOGSOrders > 0 ? `${totalCOGSOrders} cmd dans le détail COGS` : undefined}
          {...register('orders', numericField('orders'))}
        />
      </div>

      {/* Ad Spend + Refunds */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Dépense pub" type="number" step="0.01" required
          prefix={currencySymbol} error={errors.adSpend?.message}
          {...register('adSpend', numericField('adSpend'))}
        />
        <Input label="Remboursements" type="number" step="0.01"
          prefix={currencySymbol} error={errors.refunds?.message}
          {...register('refunds', numericField('refunds'))}
        />
      </div>

      {/* Add to Cart + Checkout */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Ajouts panier" type="number" step="1" required
          error={errors.addToCart?.message}
          {...register('addToCart', numericField('addToCart'))}
        />
        <Input label="Checkouts" type="number" step="1" required
          error={errors.checkout?.message}
          {...register('checkout', numericField('checkout'))}
        />
      </div>

      {/* Sessions */}
      <Input label="Sessions (optionnel)" type="number" step="1"
        hint="Pour le CVR réel. Laissez vide pour utiliser les ajouts panier."
        {...register('sessions', { valueAsNumber: true, min: { value: 0, message: '≥ 0' } })}
      />

      {/* ── COGS multi-offres ── */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-300">Coûts variables (COGS)</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {offers.length === 0
                ? 'Sauvegardez des offres dans le Calculateur pour activer cette section.'
                : 'Détaillez les commandes par offre pour un P&L précis.'}
            </p>
          </div>
          {offers.length > 0 && (
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Plus size={12} /> Ajouter une offre
            </button>
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px_24px] gap-2 text-[10px] text-zinc-600 px-1">
              <span>Offre</span>
              <span>Cmds</span>
              <span>COGS</span>
              <span />
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_80px_24px] gap-2 items-center">
                {/* Offre selector */}
                <select
                  value={line.offerId}
                  onChange={(e) => updateLine(idx, 'offerId', e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50 truncate"
                >
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>

                {/* Nombre de commandes */}
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={line.orders || ''}
                  onChange={(e) => updateLine(idx, 'orders', e.target.value)}
                  placeholder="0"
                  className="rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50 w-full"
                />

                {/* COGS calculé */}
                <div className={cn(
                  'text-xs font-medium text-right',
                  line.cogsTotal > 0 ? 'text-amber-400' : 'text-zinc-600'
                )}>
                  {line.cogsTotal > 0
                    ? `−${formatCurrency(line.cogsTotal, currency as 'EUR')}`
                    : '—'
                  }
                </div>

                {/* Supprimer */}
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  className="text-zinc-600 hover:text-red-400 transition-colors flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Sous-détail par ligne */}
            <div className="mt-1 space-y-0.5 pl-1">
              {lines.map((line, idx) => line.orders > 0 && (
                <p key={idx} className="text-[10px] text-zinc-600">
                  {line.offerName} : {line.orders} × {formatCurrency(line.cogsPerOrder, currency as 'EUR')} = {formatCurrency(line.cogsTotal, currency as 'EUR')}
                </p>
              ))}
            </div>

            {/* Total COGS */}
            <div className="border-t border-zinc-700 pt-2 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                COGS total ({totalCOGSOrders} commandes)
              </span>
              <span className="text-sm font-bold text-amber-400">
                − {formatCurrency(totalCOGS, currency as 'EUR')}
              </span>
            </div>
          </div>
        )}

        {lines.length === 0 && offers.length > 0 && (
          <p className="text-[10px] text-zinc-600 text-center py-1">
            Cliquez "+ Ajouter une offre" pour calculer le P&L précis de la journée.
          </p>
        )}
      </div>

      {/* Notes */}
      <Textarea label="Notes (optionnel)"
        placeholder="ex: Nouvelle creative lancée, promo -20%…"
        {...register('notes')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {defaultValues?.date ? 'Mettre à jour' : 'Ajouter la journée'}
        </Button>
      </div>
    </form>
  )
}
