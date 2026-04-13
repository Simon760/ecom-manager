// ============================================================
// UTILITAIRES GÉNÉRAUX
// ============================================================
import { type ClassValue, clsx } from 'clsx'
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Currency, CURRENCY_SYMBOLS } from '@/types'

// --- Fusion de classes Tailwind ---
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

// --- Formatage des nombres ---

/** Formate un nombre avec séparateurs de milliers */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Formate un montant avec symbole de devise */
export function formatCurrency(value: number, currency: Currency = 'EUR'): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const formatted = formatNumber(Math.abs(value), 2)
  const sign = value < 0 ? '-' : ''
  // Placement du symbole selon la devise
  if (currency === 'EUR' || currency === 'GBP' || currency === 'CHF') {
    return `${sign}${formatted} ${symbol}`
  }
  return `${sign}${symbol}${formatted}`
}

/** Formate un pourcentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)}%`
}

/** Formate un multiplicateur (ROAS) */
export function formatMultiplier(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)}x`
}

// --- Formatage des dates ---

/** YYYY-MM-DD → DD/MM/YYYY */
export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

/** Date courante au format YYYY-MM-DD */
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Génère un tableau de dates YYYY-MM-DD des N derniers jours */
export function getLastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'))
  }
  return days
}

/** Premier et dernier jour du mois courant */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

/** Formate une date pour affichage compact (ex: "12 jan") */
export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM', { locale: fr })
  } catch {
    return dateStr
  }
}

// --- Calculs utilitaires ---

/** Calcule la variation % entre deux valeurs */
export function calcVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

/** Retourne la couleur Tailwind selon une variation */
export function variationColor(value: number, inverse = false): string {
  if (value === 0) return 'text-zinc-400'
  const positive = inverse ? value < 0 : value > 0
  return positive ? 'text-emerald-400' : 'text-red-400'
}

/** Retourne une flèche selon la variation */
export function variationArrow(value: number): string {
  if (value > 0) return '▲'
  if (value < 0) return '▼'
  return '—'
}

/** Sécurise la division (évite NaN/Infinity) */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0 || isNaN(denominator)) return fallback
  const result = numerator / denominator
  return isFinite(result) ? result : fallback
}

/** Génère un ID unique simple */
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Tronque un texte */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

/** Couleur de badge selon le statut créative */
export function creativeStatusColor(status: string): string {
  switch (status) {
    case 'winner': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'loser':  return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:       return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
}

/** Couleur ROAS dynamique */
export function roasColor(roas: number): string {
  if (roas >= 3) return 'text-emerald-400'
  if (roas >= 2) return 'text-amber-400'
  return 'text-red-400'
}
