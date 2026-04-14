'use client'
// ============================================================
// PROFITABILITY CALCULATOR — Calculateur ROAS BE + offres
// ============================================================
import React, { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import Card, { CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CalculatorInputs, CalculatorOffer, Currency } from '@/types'
import { calcProfitability } from '@/lib/calculations'
import { formatCurrency, formatPercent, formatMultiplier } from '@/lib/utils'
import { saveOffer, updateOffer, deleteOffer } from '@/services/calculator.service'
import { Calculator, Save, Trash2, Pencil, Plus, Info } from 'lucide-react'
import { cn, safeDivide } from '@/lib/utils'

interface ProfitabilityCalculatorProps {
  currency: Currency
  userId: string
  projectId: string
  savedOffers: CalculatorOffer[]
  onOffersChange: (offers: CalculatorOffer[]) => void
}

const ZERO_INPUTS: CalculatorInputs = {
  productPrice: 0, vatRate: 20, aov: 0,
  cogsProduct: 0, cogsPackaging: 0, cogsOther: 0,
  shippingCost: 0, pspFeeRate: 0, platformFeeRate: 0, otherCosts: 0,
  refundRate: 0, chargebackRate: 0, taxRate: 25, targetMargin: 20,
}

const sym = (c: Currency) => ({ EUR: '€', USD: '$', GBP: '£', CAD: 'CA$', AUD: 'AU$', CHF: 'CHF' }[c])
const n = { valueAsNumber: true, min: 0 }

export default function ProfitabilityCalculator({
  currency, userId, projectId, savedOffers, onOffersChange,
}: ProfitabilityCalculatorProps) {
  const [saving, setSaving] = useState(false)
  const [offerName, setOfferName] = useState('')
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const cs = sym(currency)

  const { register, control, reset } = useForm<CalculatorInputs>({
    defaultValues: ZERO_INPUTS,
    mode: 'onChange',
  })

  const raw = useWatch({ control })
  const inputs: CalculatorInputs = {
    productPrice: Number(raw.productPrice) || 0,
    vatRate: Number(raw.vatRate) || 0,
    aov: Number(raw.aov) || 0,
    cogsProduct: Number(raw.cogsProduct) || 0,
    cogsPackaging: Number(raw.cogsPackaging) || 0,
    cogsOther: Number(raw.cogsOther) || 0,
    shippingCost: Number(raw.shippingCost) || 0,
    pspFeeRate: Number(raw.pspFeeRate) || 0,
    platformFeeRate: Number(raw.platformFeeRate) || 0,
    otherCosts: Number(raw.otherCosts) || 0,
    refundRate: Number(raw.refundRate) || 0,
    chargebackRate: Number(raw.chargebackRate) || 0,
    taxRate: Number(raw.taxRate) || 0,
    targetMargin: Number(raw.targetMargin) || 0,
  }

  const results = calcProfitability(inputs)
  const isViable = results.grossProfitPerOrder > 0

  const handleNewOffer = () => {
    setActiveOfferId(null)
    setOfferName('')
    setSaveError(null)
    reset(ZERO_INPUTS)
  }

  const handleEditOffer = (offer: CalculatorOffer) => {
    reset(offer.inputs)
    setActiveOfferId(offer.id)
    setOfferName(offer.name)
    setSaveError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!offerName.trim()) { setSaveError('Donnez un nom à cette offre.'); return }
    setSaving(true); setSaveError(null)
    try {
      if (activeOfferId) {
        await updateOffer(activeOfferId, offerName, inputs, results)
        onOffersChange(savedOffers.map((o) =>
          o.id === activeOfferId
            ? { ...o, name: offerName.trim(), inputs, outputs: results, updatedAt: new Date() }
            : o
        ))
      } else {
        const offer = await saveOffer(userId, projectId, offerName, inputs, results)
        onOffersChange([offer, ...savedOffers])
        setActiveOfferId(offer.id)
      }
    } catch (err) {
      console.error('Erreur sauvegarde offre:', err)
      setSaveError('Erreur lors de la sauvegarde.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (offerId: string) => {
    setDeletingId(offerId)
    try {
      await deleteOffer(offerId)
      onOffersChange(savedOffers.filter((o) => o.id !== offerId))
      if (activeOfferId === offerId) handleNewOffer()
    } catch (err) {
      console.error('Erreur suppression offre:', err)
    } finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-5">
      {/* ── Barre d'action offre ── */}
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-xl border',
        activeOfferId
          ? 'border-violet-500/40 bg-violet-600/10'
          : 'border-zinc-700 bg-zinc-800/40'
      )}>
        {activeOfferId ? (
          <>
            <Pencil size={13} className="text-violet-400 shrink-0" />
            <span className="text-xs font-semibold text-violet-300 truncate flex-1">
              Modification : {offerName}
            </span>
            <Button size="sm" variant="ghost" icon={<Plus size={12} />} onClick={handleNewOffer}>
              Nouvelle offre
            </Button>
            <Button size="sm" loading={saving} icon={<Save size={12} />} onClick={handleSave}>
              Mettre à jour
            </Button>
          </>
        ) : (
          <>
            <Save size={13} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Nom de la nouvelle offre…"
              value={offerName}
              onChange={(e) => setOfferName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            {saveError && <p className="text-xs text-red-400 shrink-0">{saveError}</p>}
            <Button size="sm" loading={saving} icon={<Save size={12} />} onClick={handleSave}>
              Enregistrer
            </Button>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── INPUTS ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Prix & TVA" icon={<Calculator size={14} />} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prix de vente (TTC)" type="number" step="0.01" prefix={cs} {...register('productPrice', n)} />
              <Input label="TVA" type="number" step="0.1" suffix="%" hint="0 si prix HT" {...register('vatRate', n)} />
              <Input label="AOV réel" type="number" step="0.01" prefix={cs} hint="Pour calcul ROAS" {...register('aov', n)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="COGS (coût de revient)" icon={<Calculator size={14} />} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Produit" type="number" step="0.01" prefix={cs} {...register('cogsProduct', n)} />
              <Input label="Emballage" type="number" step="0.01" prefix={cs} {...register('cogsPackaging', n)} />
              <Input label="Autres COGS" type="number" step="0.01" prefix={cs} {...register('cogsOther', n)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Frais variables" icon={<Calculator size={14} />} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Frais de port" type="number" step="0.01" prefix={cs} {...register('shippingCost', n)} />
              <Input label="Frais PSP" type="number" step="0.01" suffix="%" hint="Stripe, PayPal…" {...register('pspFeeRate', n)} />
              <Input label="Frais plateforme" type="number" step="0.01" suffix="%" hint="Shopify…" {...register('platformFeeRate', n)} />
              <Input label="Autres frais / commande" type="number" step="0.01" prefix={cs} {...register('otherCosts', n)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Déductions & impôts" icon={<Calculator size={14} />} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Remboursements" type="number" step="0.1" suffix="%" {...register('refundRate', n)} />
              <Input label="Chargebacks" type="number" step="0.1" suffix="%" {...register('chargebackRate', n)} />
              <Input label="Impôts" type="number" step="1" suffix="%" hint="Sur bénéfices" {...register('taxRate', n)} />
            </div>
          </Card>
        </div>

        {/* ── OUTPUTS ── */}
        <div className="space-y-4">
          {/* Multiplicateurs */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-semibold text-white">Multiplicateurs</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/60 p-3">
                <p className="text-[10px] text-zinc-500 mb-1">Multiplicateur prix</p>
                <p className={cn(
                  'text-2xl font-bold',
                  results.priceMultiple >= 5 ? 'text-emerald-400' : results.priceMultiple >= 3 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {results.priceMultiple > 0 ? `${results.priceMultiple.toFixed(2)}x` : '—'}
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  {formatCurrency(inputs.productPrice, currency)} ÷ {formatCurrency(inputs.cogsProduct || results.totalCOGS, currency)} COGS
                </p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3">
                <p className="text-[10px] text-zinc-500 mb-1">Coverage ratio</p>
                <p className={cn(
                  'text-2xl font-bold',
                  results.revenueMultiple >= 2 ? 'text-emerald-400' : results.revenueMultiple >= 1.5 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {results.revenueMultiple > 0 ? `${results.revenueMultiple.toFixed(2)}x` : '—'}
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">Revenu HT net ÷ coûts variables</p>
              </div>
            </div>
          </Card>

          {/* Décomposition */}
          <Card>
            <CardHeader title="Décomposition" icon={<Calculator size={14} />} />
            <div className="space-y-2">
              <Row label="Revenu net / commande (HT)" value={formatCurrency(results.netRevenuePerOrder, currency)} hint="Prix HT × (1 − remb. − chargebacks)" />
              <div className="pl-2 space-y-1 border-l border-zinc-800">
                <Row label="COGS total" value={`− ${formatCurrency(results.totalCOGS, currency)}`} small valueClass="text-red-400/80" />
                <Row label="Frais variables (port + PSP + plateforme)" value={`− ${formatCurrency(results.totalFees, currency)}`} small valueClass="text-red-400/80" />
              </div>
              <div className="border-t border-zinc-800 pt-2">
                <Row label="Profit brut / commande (avant pub)" value={formatCurrency(results.grossProfitPerOrder, currency)}
                  valueClass={isViable ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'} />
                <Row label="Marge brute" value={formatPercent(results.grossMargin)} valueClass="text-zinc-300" />
              </div>
              {inputs.taxRate > 0 && (
                <div className="pl-2 space-y-1 border-l border-zinc-800">
                  <Row label={`Impôts (${inputs.taxRate}%)`} value={`− ${formatCurrency(results.taxAmount, currency)}`} small valueClass="text-amber-400/80" hint="Estimatif avant pub" />
                  <Row label="Profit net / commande (avant pub)" value={formatCurrency(results.netProfitPerOrder, currency)} small valueClass="text-zinc-300" />
                  <Row label="Marge nette (avant pub)" value={formatPercent(results.netMargin)} small valueClass="text-zinc-400" />
                </div>
              )}
            </div>
          </Card>

          {/* ROAS BE */}
          <Card className={cn('border-2', isViable ? 'border-violet-500/30 bg-violet-500/5' : 'border-red-500/30 bg-red-500/5')}>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">ROAS Break-Even & Objectif</h3>
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <span className="text-xs text-zinc-500">Marge visée</span>
                <div className="relative flex items-center">
                  <input type="number" step="1" min={0}
                    className="w-16 rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 py-1 pl-2 pr-6 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                    {...register('targetMargin', n)}
                  />
                  <span className="absolute right-2 text-xs text-zinc-500 pointer-events-none">%</span>
                </div>
              </div>
            </div>
            {!isViable && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-2">
                <Info size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">Coûts variables supérieurs au revenu net. Vérifiez votre pricing.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <MetricBox label="CPA Break-Even" value={formatCurrency(results.breakEvenCPA, currency)} hint="0% marge" color="violet" />
              <MetricBox label="ROAS Break-Even" value={formatMultiplier(results.breakEvenROAS)} hint="ROAS minimum absolu" color="violet" />
              <MetricBox label={`CPA cible (${inputs.targetMargin}%)`} value={formatCurrency(results.targetCPA, currency)} hint="Pour la marge visée" color="emerald" />
              <MetricBox label={`ROAS cible (${inputs.targetMargin}%)`} value={formatMultiplier(results.targetROAS)} hint="Pour la marge visée" color="emerald" />
            </div>
            {isViable && results.breakEvenROAS > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Scénarios ROAS</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'BE', roas: results.breakEvenROAS, cpa: results.breakEvenCPA },
                    { label: '+10%', roas: results.breakEvenROAS * 1.1, cpa: safeDivide(inputs.aov, results.breakEvenROAS * 1.1) },
                    { label: '+20%', roas: results.breakEvenROAS * 1.2, cpa: safeDivide(inputs.aov, results.breakEvenROAS * 1.2) },
                    { label: '+50%', roas: results.breakEvenROAS * 1.5, cpa: safeDivide(inputs.aov, results.breakEvenROAS * 1.5) },
                  ].map(({ label, roas, cpa }) => (
                    <div key={label} className="rounded-lg bg-zinc-800/60 p-2 text-center">
                      <p className="text-[10px] text-zinc-500 mb-1">ROAS {label}</p>
                      <p className="text-xs font-bold text-zinc-200">{formatMultiplier(roas)}</p>
                      <p className="text-[10px] text-zinc-500">CPA {formatCurrency(cpa, currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Récap des offres sauvegardées ── */}
      {savedOffers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">
            Offres sauvegardées ({savedOffers.length})
          </h3>
          <div className="space-y-2">
            {savedOffers.map((offer) => {
              const isActive = activeOfferId === offer.id
              return (
                <div
                  key={offer.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all',
                    isActive
                      ? 'border-violet-500/50 bg-violet-600/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                      <span className={cn('text-sm font-semibold', isActive ? 'text-violet-300' : 'text-white')}>
                        {offer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditOffer(offer)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        <Pencil size={11} /> Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        disabled={deletingId === offer.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={11} /> {deletingId === offer.id ? '…' : 'Supprimer'}
                      </button>
                    </div>
                  </div>

                  {/* Métriques clés */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <OfferStat label="Prix TTC" value={formatCurrency(offer.inputs.productPrice, currency)} />
                    <OfferStat label="Multiplicateur" value={offer.outputs.priceMultiple > 0 ? `${offer.outputs.priceMultiple.toFixed(2)}x` : '—'}
                      color={offer.outputs.priceMultiple >= 5 ? 'emerald' : offer.outputs.priceMultiple >= 3 ? 'amber' : 'red'} />
                    <OfferStat label="Marge brute" value={formatPercent(offer.outputs.grossMargin)}
                      color={offer.outputs.grossMargin >= 30 ? 'emerald' : offer.outputs.grossMargin >= 15 ? 'amber' : 'red'} />
                    <OfferStat label="ROAS BE" value={formatMultiplier(offer.outputs.breakEvenROAS)} color="violet" />
                    <OfferStat label="CPA BE" value={formatCurrency(offer.outputs.breakEvenCPA, currency)} color="violet" />
                    <OfferStat label="Profit brut/cmd" value={formatCurrency(offer.outputs.grossProfitPerOrder, currency)}
                      color={offer.outputs.grossProfitPerOrder > 0 ? 'emerald' : 'red'} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──

function Row({ label, value, hint, valueClass, small }: {
  label: string; value: string; hint?: string; valueClass?: string; small?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className={cn('text-zinc-400', small ? 'text-[10px]' : 'text-xs')}>{label}</p>
        {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
      </div>
      <span className={cn('font-semibold text-zinc-100 shrink-0', small ? 'text-xs' : 'text-sm', valueClass)}>{value}</span>
    </div>
  )
}

function MetricBox({ label, value, hint, color }: {
  label: string; value: string; hint?: string; color: 'violet' | 'emerald'
}) {
  return (
    <div className={cn(
      'rounded-lg p-3 border',
      color === 'violet' ? 'bg-violet-500/10 border-violet-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
    )}>
      <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
      <p className={cn('text-base font-bold', color === 'violet' ? 'text-violet-300' : 'text-emerald-300')}>{value}</p>
      {hint && <p className="text-[10px] text-zinc-600 mt-0.5">{hint}</p>}
    </div>
  )
}

function OfferStat({ label, value, color }: {
  label: string; value: string; color?: 'emerald' | 'amber' | 'red' | 'violet'
}) {
  const colorClass = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    violet: 'text-violet-400',
  }[color ?? ''] ?? 'text-zinc-200'

  return (
    <div className="rounded-lg bg-zinc-800/50 px-2.5 py-2">
      <p className="text-[10px] text-zinc-500 mb-0.5">{label}</p>
      <p className={cn('text-xs font-bold', colorClass)}>{value}</p>
    </div>
  )
}
