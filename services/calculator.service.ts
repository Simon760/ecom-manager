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
    inputs: data.inputs as CalculatorInputs,
    outputs: data.outputs as CalculatorOutputs,
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
  return offers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function saveOffer(
  userId: string,
  projectId: string,
  name: string,
  inputs: CalculatorInputs,
  outputs: CalculatorOutputs
): Promise<CalculatorOffer> {
  const payload = {
    userId,
    projectId,
    name: name.trim(),
    inputs,
    outputs,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTIONS.CALCULATOR_OFFERS), payload)
  return {
    id: ref.id,
    userId,
    projectId,
    name: name.trim(),
    inputs,
    outputs,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateOffer(
  offerId: string,
  name: string,
  inputs: CalculatorInputs,
  outputs: CalculatorOutputs
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CALCULATOR_OFFERS, offerId), {
    name: name.trim(),
    inputs,
    outputs,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteOffer(offerId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CALCULATOR_OFFERS, offerId))
}
