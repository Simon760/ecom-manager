// ============================================================
// TYPES GLOBAUX — ecom-manager
// ============================================================

// --- Devises supportées ---
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CAD' | 'AUD' | 'CHF'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  CHF: 'CHF',
}

// --- Utilisateur ---
export interface AppUser {
  id: string
  email: string
  displayName?: string
  createdAt: Date
}

// --- Projet (marque e-commerce) ---
export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  currency: Currency
  createdAt: Date
  updatedAt: Date
}

// Formulaire de création/édition projet
export interface ProjectFormData {
  name: string
  description?: string
  currency: Currency
}

// --- Stats journalières (Tracker) ---
export interface DailyStat {
  id: string
  projectId: string
  userId: string
  date: string         // format YYYY-MM-DD
  revenue: number
  orders: number
  adSpend: number
  addToCart: number
  checkout: number
  sessions?: number
  refunds: number
  notes?: string
  // COGS multi-offres (optionnel)
  offerBreakdowns?: OfferBreakdownItem[]
  cogsTotal?: number
  // Métriques calculées (stockées pour perf)
  cpa: number
  aov: number
  cvr: number
  roas: number
  mer: number
  dailyProfit: number
  createdAt: Date
  updatedAt: Date
}

export interface OfferBreakdownItem {
  offerId: string
  offerName: string
  orders: number
  cogsPerOrder: number  // totalVariableCosts de l'offre
  cogsTotal: number     // cogsPerOrder × orders
}

export interface DailyStatFormData {
  date: string
  revenue: number
  orders: number
  adSpend: number
  addToCart: number
  checkout: number
  sessions?: number
  refunds: number
  notes?: string
  offerBreakdowns?: OfferBreakdownItem[]  // détail COGS par offre
  cogsTotal?: number                       // somme des cogsTotal des lignes
}

// --- Dépenses (Finance) ---
export type ExpenseCategory = 'ads' | 'tools' | 'freelance' | 'logistics' | 'other'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ads: 'Publicité',
  tools: 'Outils SaaS',
  freelance: 'Freelance',
  logistics: 'Logistique',
  other: 'Autre',
}

export interface Expense {
  id: string
  projectId: string
  userId: string
  date: string          // format YYYY-MM-DD
  category: ExpenseCategory
  description: string
  amount: number
  type: 'cash' | 'accrual'
  createdAt: Date
}

export interface ExpenseFormData {
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  type: 'cash' | 'accrual'
}

// --- Revenus / Payouts (Finance) ---
export interface Revenue {
  id: string
  projectId: string
  userId: string
  date: string          // format YYYY-MM-DD
  description: string
  amount: number
  source: string
  type: 'cash' | 'accrual'
  createdAt: Date
}

export interface RevenueFormData {
  date: string
  description: string
  amount: number
  source: string
  type: 'cash' | 'accrual'
}

// --- Créatives publicitaires ---
export type CreativeStatus = 'winner' | 'loser' | 'testing'

export interface Creative {
  id: string
  projectId: string
  userId: string
  name: string
  spend: number
  revenue: number
  impressions?: number
  clicks?: number
  // Calculé
  roas: number
  status: CreativeStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreativeFormData {
  name: string
  spend: number
  revenue: number
  impressions?: number
  clicks?: number
  status: CreativeStatus
}

// --- Produits ---
export interface Product {
  id: string
  projectId: string
  userId: string
  name: string
  revenue: number
  orders: number
  cogs: number          // Cost of Goods Sold par unité
  refundRate: number    // en %
  // Calculé
  aov: number           // revenue / orders
  margin: number        // marge en %
  createdAt: Date
  updatedAt: Date
}

export interface ProductFormData {
  name: string
  revenue: number
  orders: number
  cogs: number
  refundRate: number
}

// --- Calculateur de rentabilité ---
export interface CalculatorInputs {
  // Pricing
  productPrice: number       // Prix de vente (TVA incluse)
  vatRate: number            // TVA %
  aov: number                // AOV réel (pour calcul ROAS)
  // COGS détaillé
  cogsProduct: number        // Coût produit
  cogsPackaging: number      // Emballage
  cogsOther: number          // Autres COGS
  // Frais
  shippingCost: number       // Frais de port (par commande)
  pspFeeRate: number         // Frais PSP en % (Stripe, PayPal…)
  platformFeeRate: number    // Frais plateforme en % (Shopify…)
  otherCosts: number         // Autres frais fixes par commande
  // Déductions
  refundRate: number         // Taux remboursement %
  chargebackRate: number     // Taux chargeback %
  taxRate: number            // Impôts sur les bénéfices %
  // Objectif (toujours visible)
  targetMargin: number       // Marge nette visée %
}

export interface CalculatorOutputs {
  netRevenuePerOrder: number   // Revenue net (après TVA + déductions)
  totalCOGS: number            // COGS total
  totalFees: number            // Frais variables total (PSP + plateforme + autre + port)
  totalVariableCosts: number   // Coûts variables totaux
  grossProfitPerOrder: number  // Profit brut avant pub et impôts
  grossMargin: number          // Marge brute %
  taxAmount: number            // Montant impôts estimé
  netProfitPerOrder: number    // Profit net avant pub
  netMargin: number            // Marge nette avant pub %
  breakEvenCPA: number         // CPA max pour être à l'équilibre (0% marge)
  breakEvenROAS: number        // ROAS min pour être à l'équilibre
  targetCPA: number            // CPA max pour atteindre la marge visée
  targetROAS: number           // ROAS pour atteindre la marge visée
}

export interface CalculatorOffer {
  id: string
  projectId: string
  userId: string
  name: string
  inputs: CalculatorInputs
  outputs: CalculatorOutputs
  createdAt: Date
  updatedAt: Date
}

// --- Forecast ---
export interface ForecastInputs {
  budget: number         // Budget publicitaire
  targetCPA: number      // CPA visé
  aov: number            // AOV estimé
  marginPercent: number  // Marge nette %
}

export interface ForecastOutputs {
  estimatedOrders: number
  estimatedRevenue: number
  estimatedProfit: number
  estimatedROAS: number
  // Scénarios pessimiste / optimiste
  scenarios: {
    pessimistic: { orders: number; revenue: number; profit: number }
    base: { orders: number; revenue: number; profit: number }
    optimistic: { orders: number; revenue: number; profit: number }
  }
}

// --- Dashboard global ---
export interface GlobalStats {
  totalRevenue: number
  totalAdSpend: number
  totalProfit: number
  totalOrders: number
  overallROAS: number
  projectCount: number
}

// --- Métriques projet (agrégées) ---
export interface ProjectMetrics {
  projectId: string
  projectName: string
  currency: Currency
  totalRevenue: number
  totalAdSpend: number
  totalProfit: number
  totalOrders: number
  avgROAS: number
  avgCPA: number
}
