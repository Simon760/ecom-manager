'use client'
// ============================================================
// PROFITABILITY CALCULATOR — Calculateur de rentabilité
// ============================================================
import React, { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import Card, { CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CalculatorInputs, CalculatorOutputs, Currency } from '@/types'
import { calcProfitability, calcMaxCPAForTargetMargin } from '@/lib/calculations'
import { formatCurrency, formatPercent, formatMultiplier } from '@/lib/utils'
import { Calculator, Target, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'simulation' | 'objectif'

interface ProfitabilityCalculatorProps {
  currency: Currency
}

const DEFAULT_INPUTS: CalculatorInputs = {
  productPrice: 49.99,
  cogs: 8,
  shippingCost: 4,
  fees: 2.5,
  vat: 20,
  aov: 49.99,
  refundRate: 3,
  chargebackRate: 0.5,
}

export default function ProfitabilityCalculator({ currency }: ProfitabilityCalculatorProps) {
  const [mode, setMode] = useState<Mode>('simulation')
  const [targetMargin, setTargetMargin] = useState(20)
  const sym = currency

  const { register, control } = useForm<CalculatorInputs>({
    defaultValues: DEFAULT_INPUTS,
    mode: 'onChange',
  })

  // Réactivité en temps réel
  const values = useWatch({ control })
  const inputs: CalculatorInputs = {
    productPrice: Number(values.productPrice) || 0,
    cogs: Number(values.cogs) || 0,
    shippingCost: Number(values.shippingCost) || 0,
    fees: Number(values.fees) || 0,
    vat: Number(values.vat) || 0,
    aov: Number(values.aov) || 0,
    refundRate: Number(values.refundRate) || 0,
    chargebackRate: Number(values.chargebackRate) || 0,
  }

  const results: CalculatorOutputs = calcProfitability(inputs)
  const maxCPAForTarget = mode === 'objectif'
    ? calcMaxCPAForTargetMargin(inputs, targetMargin)
    : null

  const isRentable = results.profitPerOrder > 0
  const numericField = { valueAsNumber: true, min: 0 }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
          <ModeBtn active={mode === 'simulation'} onClick={() => setMode('simulation')} icon={<Calculator size={12} />}>
            Simulation
          </ModeBtn>
          <ModeBtn active={mode === 'objectif'} onClick={() => setMode('objectif')} icon={<Target size={12} />}>
            Mode objectif
          </ModeBtn>
        </div>
        {mode === 'objectif' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Marge cible :</span>
            <Input
              type="number"
              step="1"
              suffix="%"
              className="w-20 py-1 text-xs"
              value={targetMargin}
              onChange={(e) => setTargetMargin(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* INPUTS */}
        <Card>
          <CardHeader title="Paramètres" icon={<Calculator size={14} />} />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prix de vente (TVA incluse)"
                type="number" step="0.01"
                prefix={sym === 'EUR' ? '€' : '$'}
                {...register('productPrice', numericField)}
              />
              <Input
                label="Coût d'achat (COGS)"
                type="number" step="0.01"
                prefix={sym === 'EUR' ? '€' : '$'}
                {...register('cogs', numericField)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Frais de port"
                type="number" step="0.01"
                prefix={sym === 'EUR' ? '€' : '$'}
                {...register('shippingCost', numericField)}
              />
              <Input
                label="Frais plateforme (Shopify…)"
                type="number" step="0.01"
                prefix={sym === 'EUR' ? '€' : '$'}
                {...register('fees', numericField)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="TVA (%)"
                type="number" step="0.1"
                suffix="%"
                hint="0 si prix HT"
                {...register('vat', numericField)}
              />
              <Input
                label="AOV réel"
                type="number" step="0.01"
                prefix={sym === 'EUR' ? '€' : '$'}
                hint="Pour calcul ROAS break-even"
                {...register('aov', numericField)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Taux remboursement"
                type="number" step="0.1"
                suffix="%"
                {...register('refundRate', numericField)}
              />
              <Input
                label="Taux chargeback"
                type="number" step="0.1"
                suffix="%"
                {...register('chargebackRate', numericField)}
              />
            </div>
          </div>
        </Card>

        {/* OUTPUTS */}
        <div className="space-y-4">
          {/* Résultats principaux */}
          <Card>
            <CardHeader title="Résultats" icon={<ArrowRight size={14} />} />
            <div className="space-y-3">
              <ResultRow
                label="Revenue net / commande"
                value={formatCurrency(results.netRevenuePerOrder, currency)}
                hint="Après TVA, remboursements et chargebacks"
              />
              <ResultRow
                label="Coûts variables"
                value={formatCurrency(results.totalVariableCosts, currency)}
                hint="COGS + livraison + frais"
                valueClass="text-red-400"
              />
              <Divider />
              <ResultRow
                label="Profit / commande (hors pub)"
                value={formatCurrency(results.profitPerOrder, currency)}
                valueClass={isRentable ? 'text-emerald-400 font-bold text-lg' : 'text-red-400 font-bold text-lg'}
              />
              <ResultRow
                label="Marge nette"
                value={formatPercent(results.margin)}
                valueClass={results.margin >= 20 ? 'text-emerald-400' : results.margin >= 10 ? 'text-amber-400' : 'text-red-400'}
              />
            </div>
          </Card>

          {/* Break-even */}
          <Card className={cn(
            'border-2',
            isRentable ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
          )}>
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">
              {mode === 'simulation' ? '📊 Break-even' : `🎯 Objectif — ${targetMargin}% marge`}
            </h3>
            <div className="space-y-3">
              <ResultRow
                label="CPA break-even"
                value={formatCurrency(mode === 'objectif' ? (maxCPAForTarget ?? 0) : results.breakEvenCPA, currency)}
                hint="CPA maximum pour être rentable"
                valueClass="text-violet-400 font-bold text-lg"
              />
              <ResultRow
                label="ROAS break-even"
                value={formatMultiplier(
                  mode === 'objectif'
                    ? (inputs.aov > 0 && maxCPAForTarget ? inputs.aov / maxCPAForTarget : 0)
                    : results.breakEvenROAS
                )}
                hint="ROAS minimum requis"
                valueClass="text-violet-400 font-bold text-lg"
              />
            </div>

            {!isRentable && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-2">
                <Info size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">
                  Vos coûts variables dépassent votre revenue net. Vérifiez votre pricing ou réduisez vos coûts.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// Sous-composants
function ResultRow({ label, value, hint, valueClass }: {
  label: string; value: string; hint?: string; valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
      </div>
      <span className={cn('text-sm font-semibold text-zinc-100', valueClass)}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-zinc-800 my-1" />
}

function ModeBtn({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
        active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {icon}
      {children}
    </button>
  )
}
