'use client'
// ============================================================
// FORECAST CALCULATOR — Projections de performance
// ============================================================
import React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import Card, { CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { ForecastInputs, Currency } from '@/types'
import { calcForecast } from '@/lib/calculations'
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from '@/lib/utils'
import { TrendingUp, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

interface ForecastCalculatorProps {
  currency: Currency
}

const DEFAULT: ForecastInputs = {
  budget: 1000,
  targetCPA: 25,
  aov: 65,
  marginPercent: 30,
}

export default function ForecastCalculator({ currency }: ForecastCalculatorProps) {
  const { register, control } = useForm<ForecastInputs>({
    defaultValues: DEFAULT,
    mode: 'onChange',
  })

  const values = useWatch({ control })
  const inputs: ForecastInputs = {
    budget: Number(values.budget) || 0,
    targetCPA: Number(values.targetCPA) || 1,
    aov: Number(values.aov) || 0,
    marginPercent: Number(values.marginPercent) || 0,
  }

  const results = calcForecast(inputs)
  const sym = currency

  const scenarioData = [
    {
      name: 'Pessimiste\n(CPA +25%)',
      revenue: Math.round(results.scenarios.pessimistic.revenue),
      profit: Math.round(results.scenarios.pessimistic.profit),
      orders: Math.round(results.scenarios.pessimistic.orders),
    },
    {
      name: 'Base',
      revenue: Math.round(results.scenarios.base.revenue),
      profit: Math.round(results.scenarios.base.profit),
      orders: Math.round(results.scenarios.base.orders),
    },
    {
      name: 'Optimiste\n(CPA -20%)',
      revenue: Math.round(results.scenarios.optimistic.revenue),
      profit: Math.round(results.scenarios.optimistic.profit),
      orders: Math.round(results.scenarios.optimistic.orders),
    },
  ]

  const numericField = { valueAsNumber: true, min: 0 }

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Inputs */}
        <Card>
          <CardHeader title="Paramètres" subtitle="Entrez vos estimations" />
          <div className="space-y-4">
            <Input
              label="Budget publicitaire"
              type="number" step="1"
              prefix={sym === 'EUR' ? '€' : '$'}
              hint="Budget total à dépenser"
              {...register('budget', numericField)}
            />
            <Input
              label="CPA cible"
              type="number" step="0.01"
              prefix={sym === 'EUR' ? '€' : '$'}
              hint="Coût par acquisition visé"
              {...register('targetCPA', numericField)}
            />
            <Input
              label="AOV estimé"
              type="number" step="0.01"
              prefix={sym === 'EUR' ? '€' : '$'}
              hint="Panier moyen estimé"
              {...register('aov', numericField)}
            />
            <Input
              label="Marge nette"
              type="number" step="0.1"
              suffix="%"
              hint="Marge après COGS + frais (hors pub)"
              {...register('marginPercent', numericField)}
            />
          </div>
        </Card>

        {/* Résultats scénario de base */}
        <Card className="lg:col-span-2">
          <CardHeader title="Projections — Scénario de base" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <ForecastMetric
              label="Commandes est."
              value={formatNumber(results.estimatedOrders, 0)}
              icon={<CheckCircle2 size={14} />}
            />
            <ForecastMetric
              label="Revenue est."
              value={formatCurrency(results.estimatedRevenue, currency)}
              icon={<TrendingUp size={14} />}
            />
            <ForecastMetric
              label="Profit est."
              value={formatCurrency(results.estimatedProfit, currency)}
              icon={results.estimatedProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              positive={results.estimatedProfit >= 0}
            />
            <ForecastMetric
              label="ROAS est."
              value={formatMultiplier(results.estimatedROAS)}
              icon={<TrendingUp size={14} />}
            />
          </div>

          {/* Info si non rentable */}
          {results.estimatedProfit < 0 && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-2">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">
                Ce scénario est déficitaire. Réduisez votre CPA cible ou augmentez votre marge.
              </p>
            </div>
          )}

          {/* Tableau des 3 scénarios */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-3 py-2 text-left text-zinc-500">Scénario</th>
                  <th className="px-3 py-2 text-right text-zinc-500">Commandes</th>
                  <th className="px-3 py-2 text-right text-zinc-500">Revenue</th>
                  <th className="px-3 py-2 text-right text-zinc-500">Profit</th>
                  <th className="px-3 py-2 text-right text-zinc-500">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ['Pessimiste (CPA +25%)', results.scenarios.pessimistic, 'text-red-400'],
                  ['Base', results.scenarios.base, 'text-violet-400 font-bold'],
                  ['Optimiste (CPA -20%)', results.scenarios.optimistic, 'text-emerald-400'],
                ] as [string, typeof results.scenarios.base, string][]).map(([label, s, cls]) => (
                  <tr key={label} className="border-b border-zinc-800/50">
                    <td className={cn('px-3 py-2.5', cls)}>{label}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{formatNumber(s.orders, 0)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{formatCurrency(s.revenue, currency)}</td>
                    <td className={cn('px-3 py-2.5 text-right font-medium', s.profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {formatCurrency(s.profit, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">
                      {formatMultiplier(inputs.budget > 0 ? s.revenue / inputs.budget : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Graphique comparatif */}
      <Card>
        <CardHeader title="Comparaison des scénarios" subtitle="Revenue vs Profit" />
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarioData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} width={55}
                tickFormatter={(v) => formatCurrency(v, currency)} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name) => [formatCurrency(v, currency), name === 'revenue' ? 'Revenue' : 'Profit']}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="profit" name="Profit" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

function ForecastMetric({ label, value, icon, positive }: {
  label: string; value: string; icon: React.ReactNode; positive?: boolean
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
      <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">{icon}<p className="text-[10px]">{label}</p></div>
      <p className={cn('text-sm font-bold', positive === false ? 'text-red-400' : positive === true ? 'text-emerald-400' : 'text-zinc-100')}>
        {value}
      </p>
    </div>
  )
}
