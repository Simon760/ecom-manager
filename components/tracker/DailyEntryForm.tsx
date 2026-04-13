'use client'
// ============================================================
// DAILY ENTRY FORM — Formulaire de saisie journalière
// ============================================================
import React from 'react'
import { useForm } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { DailyStatFormData } from '@/types'
import { todayStr } from '@/lib/utils'
import { Textarea } from '@/components/ui/Input'

interface DailyEntryFormProps {
  defaultValues?: Partial<DailyStatFormData>
  onSubmit: (data: DailyStatFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  currencySymbol?: string
}

export default function DailyEntryForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
  currencySymbol = '€',
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

  const numericField = (name: keyof DailyStatFormData, required = true) => ({
    valueAsNumber: true,
    required: required ? 'Requis' : false,
    min: { value: 0, message: 'Doit être ≥ 0' },
  })

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
          type="number"
          step="0.01"
          required
          prefix={currencySymbol}
          error={errors.revenue?.message}
          {...register('revenue', numericField('revenue'))}
        />
        <Input
          label="Commandes"
          type="number"
          step="1"
          required
          error={errors.orders?.message}
          {...register('orders', numericField('orders'))}
        />
      </div>

      {/* Ad Spend + Refunds */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Dépense pub"
          type="number"
          step="0.01"
          required
          prefix={currencySymbol}
          error={errors.adSpend?.message}
          {...register('adSpend', numericField('adSpend'))}
        />
        <Input
          label="Remboursements"
          type="number"
          step="0.01"
          prefix={currencySymbol}
          error={errors.refunds?.message}
          {...register('refunds', numericField('refunds'))}
        />
      </div>

      {/* Add to Cart + Checkout */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Ajouts panier"
          type="number"
          step="1"
          required
          error={errors.addToCart?.message}
          {...register('addToCart', numericField('addToCart'))}
        />
        <Input
          label="Checkouts"
          type="number"
          step="1"
          required
          error={errors.checkout?.message}
          {...register('checkout', numericField('checkout'))}
        />
      </div>

      {/* Sessions (optionnel) */}
      <Input
        label="Sessions (optionnel)"
        type="number"
        step="1"
        hint="Pour calculer le CVR réel. Laissez vide pour utiliser les ajouts panier."
        error={errors.sessions?.message}
        {...register('sessions', { valueAsNumber: true, min: { value: 0, message: '≥ 0' } })}
      />

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
