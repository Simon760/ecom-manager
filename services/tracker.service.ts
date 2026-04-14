// ============================================================
// TRACKER SERVICE — Stats journalières
// ============================================================
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db, COLLECTIONS } from '@/lib/firebase'
import { DailyStat, DailyStatFormData } from '@/types'
import { computeDailyMetrics } from '@/lib/calculations'

/** Convertit un document Firestore en DailyStat */
function toDailyStat(id: string, data: Record<string, unknown>): DailyStat {
  return {
    id,
    projectId: data.projectId as string,
    userId: data.userId as string,
    date: data.date as string,
    revenue: (data.revenue as number) ?? 0,
    orders: (data.orders as number) ?? 0,
    adSpend: (data.adSpend as number) ?? 0,
    addToCart: (data.addToCart as number) ?? 0,
    checkout: (data.checkout as number) ?? 0,
    sessions: (data.sessions as number) ?? undefined,
    refunds: (data.refunds as number) ?? 0,
    notes: (data.notes as string) ?? '',
    cpa: (data.cpa as number) ?? 0,
    aov: (data.aov as number) ?? 0,
    cvr: (data.cvr as number) ?? 0,
    roas: (data.roas as number) ?? 0,
    mer: (data.mer as number) ?? 0,
    dailyProfit: (data.dailyProfit as number) ?? 0,
    offerBreakdowns: (data.offerBreakdowns as unknown) ?? undefined,
    cogsTotal: (data.cogsTotal as number) ?? undefined,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

/** Récupère les stats d'un projet avec filtre de dates optionnel */
export async function getDailyStats(
  projectId: string,
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<DailyStat[]> {
  const q = query(
    collection(db, COLLECTIONS.DAILY_STATS),
    where('projectId', '==', projectId),
    where('userId', '==', userId)
  )

  const snap = await getDocs(q)
  let stats = snap.docs.map((d) => toDailyStat(d.id, d.data() as Record<string, unknown>))

  // Tri et filtre client-side (évite les index composites Firestore)
  if (startDate) stats = stats.filter((s) => s.date >= startDate)
  if (endDate) stats = stats.filter((s) => s.date <= endDate)
  stats.sort((a, b) => b.date.localeCompare(a.date))

  return stats
}

/** Ajoute une stat journalière */
export async function addDailyStat(
  projectId: string,
  userId: string,
  data: DailyStatFormData
): Promise<DailyStat> {
  const metrics = computeDailyMetrics(data)
  const payload = {
    projectId,
    userId,
    ...data,
    ...metrics,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTIONS.DAILY_STATS), payload)
  return {
    id: ref.id,
    projectId,
    userId,
    ...data,
    ...metrics,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/** Met à jour une stat journalière (recalcule les métriques) */
export async function updateDailyStat(
  statId: string,
  data: DailyStatFormData
): Promise<void> {
  const metrics = computeDailyMetrics(data)
  await updateDoc(doc(db, COLLECTIONS.DAILY_STATS, statId), {
    ...data,
    ...metrics,
    updatedAt: serverTimestamp(),
  })
}

/** Supprime une stat journalière */
export async function deleteDailyStat(statId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.DAILY_STATS, statId))
}
