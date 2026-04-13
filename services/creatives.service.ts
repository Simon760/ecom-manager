// ============================================================
// CREATIVES SERVICE — Suivi des créatives publicitaires
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
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db, COLLECTIONS } from '@/lib/firebase'
import { Creative, CreativeFormData } from '@/types'
import { safeDivide } from '@/lib/utils'

function toCreative(id: string, data: Record<string, unknown>): Creative {
  return {
    id,
    projectId: data.projectId as string,
    userId: data.userId as string,
    name: data.name as string,
    spend: (data.spend as number) ?? 0,
    revenue: (data.revenue as number) ?? 0,
    impressions: (data.impressions as number) ?? undefined,
    clicks: (data.clicks as number) ?? undefined,
    roas: (data.roas as number) ?? 0,
    status: (data.status as Creative['status']) ?? 'testing',
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

export async function getCreatives(projectId: string, userId: string): Promise<Creative[]> {
  const q = query(
    collection(db, COLLECTIONS.CREATIVES),
    where('projectId', '==', projectId),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toCreative(d.id, d.data() as Record<string, unknown>))
}

export async function addCreative(
  projectId: string,
  userId: string,
  data: CreativeFormData
): Promise<Creative> {
  const roas = safeDivide(data.revenue, data.spend)
  const payload = {
    projectId,
    userId,
    ...data,
    roas,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTIONS.CREATIVES), payload)
  return { id: ref.id, projectId, userId, ...data, roas, createdAt: new Date(), updatedAt: new Date() }
}

export async function updateCreative(id: string, data: CreativeFormData): Promise<void> {
  const roas = safeDivide(data.revenue, data.spend)
  await updateDoc(doc(db, COLLECTIONS.CREATIVES, id), {
    ...data,
    roas,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCreative(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CREATIVES, id))
}
