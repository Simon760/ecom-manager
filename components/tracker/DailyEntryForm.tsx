'use client'
// ============================================================
// DAILY ENTRY FORM — Formulaire de saisie journalière
// ============================================================
import React, { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { DailyStatFormData, CalculatorOffer } from '@/types'
import { todayStr, formatCurrency } from '@/lib/utils'
import { Textarea } from '@/components/ui/Input'

interface DailyEntryFormProps {
  defaultValues?: Partial<DailyStatFormData>
  onSubmit: (data: DailyStatFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  currencySymbol?: string
  currency?: string
  offers?: CalculatorOffer[]  // offres calculateur disponibles
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
    control,
    setValue,
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
      offerId: '',
      cogsTotal: undefined,
      ...defaultValues,
    },
  })

  const orders = useWatch({ control, name: 'orders' })
  const selectedOfferId = useWatch({ control, name: 'offerId' })

  const selectedOffer = offers.find((o) => o.id === selectedOfferId)

  // Recalcule cogsTotal quand l'offre ou les commandes changent
  useEffect(() => {
    if (!selectedOffer || !orders) {
      setValue('cogsTotal', undefined)
      setValue('offerName', '')
      return
    }
    const cogsPerOrder = selectedOffer.outputs.totalVariableCosts
    setValue('cogsTotal', Math.round(cogsPerOrder * Number(orders) * 100) / 100)
    setValue('offerName', selectedOffer.name)
  }, [selectedOfferId, orders, selectedOffer, setValue])

  const numericField = (name: keyof DailyStatFormData, required = true) => ({
    valueAsNumber: true,
    required: required ? 'Requis' : false,
    min: { value: 0, message: 'Doit être ≥ 0' },
  })

  const cogsTotal = selectedOffer ? selectedOffer.outputs.totalVariableCosts * Number(orders || 0) : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Date */}
      <Input
        label="Date"
        type="date"
        required
        error={errors.date?.message}
        {...register('date', { required: 'Date requise' })}
      />

      {/* Revenue + Orders */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Revenue"
          type="number" step="0.01" required
          prefix={currencySymbol}
          error={errors.revenue?.message}
          {...register('revenue', numericField('revenue'))}
        />
        <Input
          label="Commandes"
          type="number" step="1" required
          error={errors.orders?.message}
          {...register('orders', numericField('orders'))}
        />
      </div>

      {/* Ad Spend + Refunds */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Dépense pub"
          type="number" step="0.01" required
          prefix={currencySymbol}
          error={errors.adSpend?.message}
          {...register('adSpend', numericField('adSpend'))}
        />
        <Input
          label="Remboursements"
          type="number" step="0.01"
          prefix={currencySymbol}
          error={errors.refunds?.message}
          {...register('refunds', numericField('refunds'))}
        />
      </div>

      {/* Add to Cart + Checkout */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Ajouts panier"
          type="number" step="1" required
          error={errors.addToCart?.message}
          {...register('addToCart', numericField('addToCart'))}
        />
        <Input
          label="Checkouts"
          type="number" step="1" required
          error={errors.checkout?.message}
          {...register('checkout', numericField('checkout'))}
        />
      </div>

      {/* Sessions */}
      <Input
        label="Sessions (optionnel)"
        type="number" step="1"
        hint="Pour calculer le CVR réel. Laissez vide pour utiliser les ajouts panier."
        error={errors.sessions?.message}
        {...register('sessions', { valueAsNumber: true, min: { value: 0, message: '≥ 0' } })}
      />

      {/* COGS — sélection offre calculateur */}
      {offers.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-1.5">
              Offre produit (pour P&L réel)
            </p>
            <select
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              {...register('offerId')}
            >
              <option value="">— Aucune (P&L sans COGS) —</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          {selectedOffer && cogsTotal !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                COGS estimé ({formatCurrency(selectedOffer.outputs.totalVariableCosts, currency as 'EUR')} × {orders || 0} cmd)
              </span>
              <span className="text-amber-400 font-semibold">
                − {formatCurrency(cogsTotal, currency as 'EUR')}
              </span>
            </div>
          )}
          {!selectedOffer && (
            <p className="text-[10px] text-zinc-600">
              Sélectionnez une offre pour intégrer les coûts variables dans le P&L journalier.
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      <Textarea
        label="Notes (optionnel)"
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
