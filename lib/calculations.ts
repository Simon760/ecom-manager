// ============================================================
// CALCULS MÉTIER — Toute la logique de calcul e-commerce
// ============================================================
import { safeDivide } from './utils'
import {
  DailyStatFormData,
  DailyStat,
  CalculatorInputs,
  CalculatorOutputs,
  ForecastInputs,
  ForecastOutputs,
} from '@/types'

// ============================================================
// TRACKER — Calculs des métriques journalières
// ============================================================

/**
 * CPA — Cost Per Acquisition
 * = Dépense publicitaire / Nombre de commandes
 */
export function calcCPA(adSpend: number, orders: number): number {
  return safeDivide(adSpend, orders)
}

/**
 * AOV — Average Order Value
 * = Revenus / Nombre de commandes
 */
export function calcAOV(revenue: number, orders: number): number {
  return safeDivide(revenue, orders)
}

/**
 * CVR — Conversion Rate
 * Si sessions disponibles : orders / sessions * 100
 * Sinon : orders / addToCart * 100 (proxy)
 */
export function calcCVR(orders: number, sessions?: number, addToCart?: number): number {
  if (sessions && sessions > 0) {
    return safeDivide(orders * 100, sessions)
  }
  if (addToCart && addToCart > 0) {
    return safeDivide(orders * 100, addToCart)
  }
  return 0
}

/**
 * ROAS — Return On Ad Spend
 * = Revenus / Dépense publicitaire
 */
export function calcROAS(revenue: number, adSpend: number): number {
  return safeDivide(revenue, adSpend)
}

/**
 * MER — Marketing Efficiency Ratio
 * = Revenus totaux / Total dépenses publicitaires
 * (identique au ROAS dans un contexte mono-canal)
 */
export function calcMER(totalRevenue: number, totalAdSpend: number): number {
  return safeDivide(totalRevenue, totalAdSpend)
}

/**
 * Profit journalier
 * = Revenus - Dépense publicitaire - Remboursements
 */
export function calcDailyProfit(revenue: number, adSpend: number, refunds: number): number {
  return revenue - adSpend - refunds
}

/**
 * Calcule toutes les métriques d'une stat journalière
 */
export function computeDailyMetrics(
  data: DailyStatFormData
): Pick<DailyStat, 'cpa' | 'aov' | 'cvr' | 'roas' | 'mer' | 'dailyProfit'> {
  return {
    cpa: calcCPA(data.adSpend, data.orders),
    aov: calcAOV(data.revenue, data.orders),
    cvr: calcCVR(data.orders, data.sessions, data.addToCart),
    roas: calcROAS(data.revenue, data.adSpend),
    mer: calcMER(data.revenue, data.adSpend),
    dailyProfit: calcDailyProfit(data.revenue, data.adSpend, data.refunds),
  }
}

/**
 * Calcule le profit cumulé sur une liste de stats triées par date (ASC)
 */
export function calcCumulativeProfit(stats: DailyStat[]): number[] {
  let cumulative = 0
  return stats.map((s) => {
    cumulative += s.dailyProfit
    return cumulative
  })
}

/**
 * Calcule les moyennes sur 7 jours pour comparaison
 */
export function calcSevenDayAverages(stats: DailyStat[]): {
  avgRevenue: number
  avgOrders: number
  avgAdSpend: number
  avgROAS: number
  avgCPA: number
  avgCVR: number
  avgProfit: number
} {
  if (stats.length === 0) {
    return { avgRevenue: 0, avgOrders: 0, avgAdSpend: 0, avgROAS: 0, avgCPA: 0, avgCVR: 0, avgProfit: 0 }
  }
  const n = stats.length
  return {
    avgRevenue: safeDivide(stats.reduce((s, d) => s + d.revenue, 0), n),
    avgOrders: safeDivide(stats.reduce((s, d) => s + d.orders, 0), n),
    avgAdSpend: safeDivide(stats.reduce((s, d) => s + d.adSpend, 0), n),
    avgROAS: safeDivide(stats.reduce((s, d) => s + d.roas, 0), n),
    avgCPA: safeDivide(stats.reduce((s, d) => s + d.cpa, 0), n),
    avgCVR: safeDivide(stats.reduce((s, d) => s + d.cvr, 0), n),
    avgProfit: safeDivide(stats.reduce((s, d) => s + d.dailyProfit, 0), n),
  }
}

// ============================================================
// CALCULATEUR DE RENTABILITÉ
// ============================================================

/**
 * Calcule tous les indicateurs de rentabilité
 *
 * Hypothèse : productPrice inclut la TVA.
 * Prix HT = productPrice / (1 + vatRate/100)
 *
 * Frais PSP et plateforme = % du prix TTC (appliqué sur le prix réel encaissé).
 * Tax (impôts) = % du profit brut avant pub. À break-even le profit = 0 donc tax = 0.
 * Pour la marge cible : on résout en tenant compte des impôts.
 */
export function calcProfitability(inputs: CalculatorInputs): CalculatorOutputs {
  const {
    productPrice, vatRate, aov,
    cogsProduct, cogsPackaging, cogsOther,
    shippingCost, pspFeeRate, platformFeeRate, otherCosts,
    refundRate, chargebackRate, taxRate,
    targetMargin,
  } = inputs

  // 1. Revenu net par commande (après TVA et déductions)
  const priceExVAT = safeDivide(productPrice, 1 + vatRate / 100)
  const deductionRate = (refundRate + chargebackRate) / 100
  const netRevenuePerOrder = priceExVAT * (1 - deductionRate)

  // 2. COGS total
  const totalCOGS = cogsProduct + cogsPackaging + cogsOther

  // 3. Frais variables (PSP + plateforme en % du prix TTC + port + autres)
  const feeAmount = productPrice * (pspFeeRate + platformFeeRate) / 100
  const totalFees = feeAmount + shippingCost + otherCosts

  // 4. Coûts variables totaux
  const totalVariableCosts = totalCOGS + totalFees

  // 5. Profit brut (avant pub, avant impôts)
  const grossProfitPerOrder = netRevenuePerOrder - totalVariableCosts
  const grossMargin = safeDivide(grossProfitPerOrder * 100, netRevenuePerOrder)

  // 6. Impôts estimés (sur profit brut avant pub — indicatif)
  const taxAmount = Math.max(0, grossProfitPerOrder * taxRate / 100)
  const netProfitPerOrder = grossProfitPerOrder - taxAmount
  const netMargin = safeDivide(netProfitPerOrder * 100, netRevenuePerOrder)

  // 7. Break-even CPA (à ce CPA, profit avant impôt = 0 → impôt = 0)
  //    breakEvenCPA = grossProfitPerOrder (tout le profit brut part en pub)
  const breakEvenCPA = Math.max(0, grossProfitPerOrder)
  const breakEvenROAS = safeDivide(aov, breakEvenCPA)

  // 8. CPA pour atteindre la marge visée (après impôts)
  //    On veut : (grossProfit - CPA) * (1 - taxRate/100) / netRevenue = targetMargin/100
  //    => CPA = grossProfit - netRevenue * targetMargin/100 / (1 - taxRate/100)
  //    Si taxRate = 0 : CPA = grossProfit - netRevenue * targetMargin/100
  const taxFactor = Math.max(0.01, 1 - taxRate / 100)
  const targetCPA = Math.max(0, grossProfitPerOrder - netRevenuePerOrder * (targetMargin / 100) / taxFactor)
  const targetROAS = safeDivide(aov, targetCPA)

  return {
    netRevenuePerOrder,
    totalCOGS,
    totalFees,
    totalVariableCosts,
    grossProfitPerOrder,
    grossMargin,
    taxAmount,
    netProfitPerOrder,
    netMargin,
    breakEvenCPA,
    breakEvenROAS,
    targetCPA,
    targetROAS,
  }
}

// ============================================================
// FORECAST
// ============================================================

/**
 * Calcule les projections de performance basées sur un budget
 */
export function calcForecast(inputs: ForecastInputs): ForecastOutputs {
  const { budget, targetCPA, aov, marginPercent } = inputs

  // Scénario de base
  const baseOrders = safeDivide(budget, targetCPA)
  const baseRevenue = baseOrders * aov
  const baseProfit = baseRevenue * (marginPercent / 100) - budget

  // Scénario pessimiste : CPA +25%
  const pessimisticCPA = targetCPA * 1.25
  const pessimisticOrders = safeDivide(budget, pessimisticCPA)
  const pessimisticRevenue = pessimisticOrders * aov
  const pessimisticProfit = pessimisticRevenue * (marginPercent / 100) - budget

  // Scénario optimiste : CPA -20%
  const optimisticCPA = targetCPA * 0.8
  const optimisticOrders = safeDivide(budget, optimisticCPA)
  const optimisticRevenue = optimisticOrders * aov
  const optimisticProfit = optimisticRevenue * (marginPercent / 100) - budget

  return {
    estimatedOrders: baseOrders,
    estimatedRevenue: baseRevenue,
    estimatedProfit: baseProfit,
    estimatedROAS: safeDivide(baseRevenue, budget),
    scenarios: {
      pessimistic: {
        orders: pessimisticOrders,
        revenue: pessimisticRevenue,
        profit: pessimisticProfit,
      },
      base: {
        orders: baseOrders,
        revenue: baseRevenue,
        profit: baseProfit,
      },
      optimistic: {
        orders: optimisticOrders,
        revenue: optimisticRevenue,
        profit: optimisticProfit,
      },
    },
  }
}

// ============================================================
// UTILITAIRES AGRÉGATION
// ============================================================

/** Agrège une liste de stats journalières en métriques globales */
export function aggregateStats(stats: DailyStat[]) {
  const totalRevenue = stats.reduce((s, d) => s + d.revenue, 0)
  const totalAdSpend = stats.reduce((s, d) => s + d.adSpend, 0)
  const totalOrders = stats.reduce((s, d) => s + d.orders, 0)
  const totalProfit = stats.reduce((s, d) => s + d.dailyProfit, 0)
  const totalRefunds = stats.reduce((s, d) => s + d.refunds, 0)

  return {
    totalRevenue,
    totalAdSpend,
    totalOrders,
    totalProfit,
    totalRefunds,
    avgROAS: calcROAS(totalRevenue, totalAdSpend),
    avgCPA: calcCPA(totalAdSpend, totalOrders),
    avgAOV: calcAOV(totalRevenue, totalOrders),
  }
}
