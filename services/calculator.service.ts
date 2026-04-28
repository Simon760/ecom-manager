// ============================================================
// CALCULATOR SERVICE — CRUD des offres sauvegardées
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
  writeBatch,
  Timestamp,
} from 'firebase/firestore'
import { db, COLLECTIONS } from '@/lib/firebase'
import { CalculatorOffer, CalculatorInputs, CalculatorOutputs } from '@/types'

function toOffer(id: string, data: Record<string, unknown>): CalculatorOffer {
  return {
    id,
    projectId: data.projectId as string,
    userId: data.userId as string,
    name: data.name as string,
    productId: typeof data.productId === 'string' ? (data.productId as string) : undefined,
    inputs: data.inputs as CalculatorInputs,
    outputs: data.outputs as CalculatorOutputs,
    order: typeof data.order === 'number' ? (data.order as number) : undefined,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

export async function getOffers(userId: string, projectId: string): Promise<CalculatorOffer[]> {
  const q = query(
    collection(db, COLLECTIONS.CALCULATOR_OFFERS),
    where('userId', '==', userId),
    where('projectId', '==', projectId)
  )
  const snap = await getDocs(q)
  const offers = snap.docs.map((d) => toOffer(d.id, d.data() as Record<string, unknown>))
  // Tri : `order` ASC en priorité ; fallback sur createdAt DESC pour les offres legacy sans order
  return offers.sort((a, b) => {
    const ao = a.order
    const bo = b.order
    if (ao !== undefined && bo !== undefined) return ao - bo
    if (ao !== undefined) return -1
    if (bo !== undefined) return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

export async function saveOffer(
  userId: string,
  projectId: string,
  name: string,
  inputs: CalculatorInputs,
  outputs: CalculatorOutputs,
  order: number = 0,
  productId?: string | null
): Promise<CalculatorOffer> {
  const trimmedName = name.trim()
  const cleanProductId = productId && productId.length > 0 ? productId : null
  const payload = {
    userId,
    projectId,
    name: trimmedName,
    productId: cleanProductId,
    inputs,
    outputs,
    order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTIONS.CALCULATOR_OFFERS), payload)
  return {
    id: ref.id,
    userId,
    projectId,
    name: trimmedName,
    productId: cleanProductId ?? undefined,
    inputs,
    outputs,
    order,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateOffer(
  offerId: string,
  name: string,
  inputs: CalculatorInputs,
  outputs: CalculatorOutputs,
  productId?: string | null
): Promise<void> {
  const cleanProductId = productId && productId.length > 0 ? productId : null
  await updateDoc(doc(db, COLLECTIONS.CALCULATOR_OFFERS, offerId), {
    name: name.trim(),
    productId: cleanProductId,
    inputs,
    outputs,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteOffer(offerId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CALCULATOR_OFFERS, offerId))
}

// Batch update des positions après drag & drop
export async function updateOffersOrder(orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, COLLECTIONS.CALCULATOR_OFFERS, id), { order: index })
  })
  await batch.commit()
}
