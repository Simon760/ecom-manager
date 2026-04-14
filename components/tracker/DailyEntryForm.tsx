'use client'
// ============================================================
// DAILY ENTRY FORM — Formulaire de saisie journalière
// ============================================================
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import {
  DailyStatFormData, CalculatorOffer, OfferBreakdownItem,
  ChannelBreakdownItem, CHANNEL_OPTIONS,
} from '@/types'
import { todayStr, formatCurrency } from '@/lib/utils'
import { Textarea } from '@/components/ui/Input'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
      ...defaultValues,
    },
  })

  // ── COGS multi-offres ──
  const [lines, setLines] = useState<OfferBreakdownItem[]>(() => {
    if (defaultValues?.offerBreakdowns?.length) return defaultValues.offerBreakdowns
    return []
  })

  const addLine = () => {
    if (offers.length === 0) return
    const first = offers[0]
    setLines((prev) => [
      ...prev,
      { offerId: first.id, offerName: first.name, orders: 0, cogsPerOrder: first.outputs.totalVariableCosts, cogsTotal: 0 },
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
          line.offerId = offer.id; line.offerName = offer.name
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

  // ── Canaux pub ──
  const [channelLines, setChannelLines] = useState<ChannelBreakdownItem[]>(() => {
    if (defaultValues?.channelBreakdowns?.length) return defaultValues.channelBreakdowns
    return []
  })
  const [showChannels, setShowChannels] = useState(() => !!(defaultValues?.channelBreakdowns?.length))

  const addChannelLine = () => {
    setChannelLines((prev) => [...prev, { channel: 'meta', label: 'Meta Ads', adSpend: 0 }])
  }
  const removeChannelLine = (idx: number) => setChannelLines((prev) => prev.filter((_, i) => i !== idx))
  const updateChannelLine = (idx: number, field: 'channel' | 'adSpend', value: string | number) => {
    setChannelLines((prev) => {
      const next = [...prev]
      if (field === 'channel') {
        const opt = CHANNEL_OPTIONS.find((c) => c.key === value)
        next[idx] = { ...next[idx], channel: value as ChannelBreakdownItem['channel'], label: opt?.label ?? 'Autre' }
      } else {
        next[idx] = { ...next[idx], adSpend: Number(value) || 0 }
      }
      return next
    })
  }
  const totalChannelSpend = channelLines.reduce((s, l) => s + l.adSpend, 0)

  // Sync adSpend field when channel lines change
  useEffect(() => {
    if (channelLines.length > 0) setValue('adSpend', Math.round(totalChannelSpend * 100) / 100)
  }, [channelLines, totalChannelSpend, setValue])

  const numericField = (name: keyof DailyStatFormData, required = true) => ({
    valueAsNumber: true,
    required: required ? 'Requis' : false,
    min: { value: 0, message: 'Doit être ≥ 0' },
  })

  const handleFormSubmit = async (data: DailyStatFormData) => {
    const payload: DailyStatFormData = {
      ...data,
      adSpend: channelLines.length > 0 ? Math.round(totalChannelSpend * 100) / 100 : data.adSpend,
      offerBreakdowns: lines.length > 0 ? lines : undefined,
      cogsTotal: lines.length > 0 ? Math.round(totalCOGS * 100) / 100 : undefined,
      channelBreakdowns: channelLines.length > 0 ? channelLines : undefined,
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
        <div>
          <Input label="Dépense pub" type="number" step="0.01" required
            prefix={currencySymbol} error={errors.adSpend?.message}
            readOnly={channelLines.length > 0}
            hint={channelLines.length > 0 ? `Total des canaux` : undefined}
            className={channelLines.length > 0 ? 'opacity-60 cursor-not-allowed' : ''}
            {...register('adSpend', numericField('adSpend'))}
          />
          {/* Toggle canaux */}
          <button
            type="button"
            onClick={() => { setShowChannels((v) => !v); if (!showChannels && channelLines.length === 0) addChannelLine() }}
            className="mt-1.5 flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
          >
            {showChannels ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {showChannels ? 'Masquer les canaux' : 'Détailler par canal'}
          </button>
        </div>
        <Input label="Remboursements" type="number" step="0.01"
          prefix={currencySymbol} error={errors.refunds?.message}
          {...register('refunds', numericField('refunds'))}
        />
      </div>

      {/* ── Canaux pub ── */}
      {showChannels && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-2 -mt-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-violet-300">Détail par canal</p>
            <button type="button" onClick={addChannelLine}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
              <Plus size={12} /> Ajouter
            </button>
          </div>

          {channelLines.length > 0 && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_100px_20px] gap-2 text-[10px] text-zinc-600 px-1">
                <span>Canal</span><span>Dépense</span><span />
              </div>
              {channelLines.map((ch, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_100px_20px] gap-2 items-center">
                  <select
                    value={ch.channel}
                    onChange={(e) => updateChannelLine(idx, 'channel', e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    {CHANNEL_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-xs text-zinc-500 pointer-events-none">{currencySymbol}</span>
                    <input type="number" min={0} step="0.01"
                      value={ch.adSpend || ''}
                      onChange={(e) => updateChannelLine(idx, 'adSpend', e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 py-1.5 pl-6 pr-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                  <button type="button" onClick={() => removeChannelLine(idx)}
                    className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="border-t border-violet-500/20 pt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Total pub</span>
                <span className="text-xs font-bold text-violet-300">
                  {currencySymbol}{totalChannelSpend.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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
            <button type="button" onClick={addLine}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
              <Plus size={12} /> Ajouter une offre
            </button>
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_80px_24px] gap-2 text-[10px] text-zinc-600 px-1">
              <span>Offre</span><span>Cmds</span><span>COGS</span><span />
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_80px_24px] gap-2 items-center">
                <select value={line.offerId}
                  onChange={(e) => updateLine(idx, 'offerId', e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50 truncate">
                  {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <input type="number" min={0} step={1}
                  value={line.orders || ''}
                  onChange={(e) => updateLine(idx, 'orders', e.target.value)}
                  placeholder="0"
                  className="rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50 w-full"
                />
                <div className={cn('text-xs font-medium text-right', line.cogsTotal > 0 ? 'text-amber-400' : 'text-zinc-600')}>
                  {line.cogsTotal > 0 ? `−${formatCurrency(line.cogsTotal, currency as 'EUR')}` : '—'}
                </div>
                <button type="button" onClick={() => removeLine(idx)}
                  className="text-zinc-600 hover:text-red-400 transition-colors flex items-center justify-center">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <div className="mt-1 space-y-0.5 pl-1">
              {lines.map((line, idx) => line.orders > 0 && (
                <p key={idx} className="text-[10px] text-zinc-600">
                  {line.offerName} : {line.orders} × {formatCurrency(line.cogsPerOrder, currency as 'EUR')} = {formatCurrency(line.cogsTotal, currency as 'EUR')}
                </p>
              ))}
            </div>
            <div className="border-t border-zinc-700 pt-2 flex items-center justify-between">
              <span className="text-xs text-zinc-400">COGS total ({totalCOGSOrders} commandes)</span>
              <span className="text-sm font-bold text-amber-400">− {formatCurrency(totalCOGS, currency as 'EUR')}</span>
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
        <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" fullWidth loading={loading}>
          {defaultValues?.date ? 'Mettre à jour' : 'Ajouter la journée'}
        </Button>
      </div>
    </form>
  )
}
