// ============================================================
// PRODUCTS SERVICE — Suivi des produits
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
import { Product, ProductFormData } from '@/types'
import { safeDivide } from '@/lib/utils'

function toProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    projectId: data.projectId as string,
    userId: data.userId as string,
    name: data.name as string,
    revenue: (data.revenue as number) ?? 0,
    orders: (data.orders as number) ?? 0,
    cogs: (data.cogs as number) ?? 0,
    refundRate: (data.refundRate as number) ?? 0,
    aov: (data.aov as number) ?? 0,
    margin: (data.margin as number) ?? 0,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

/** Calcule AOV et marge d'un produit */
function computeProductMetrics(data: ProductFormData) {
  const aov = safeDivide(data.revenue, data.orders)
  // Revenu net par commande (déduction remboursements)
  const netRevenue = aov * (1 - data.refundRate / 100)
  const margin = safeDivide((netRevenue - data.cogs) * 100, netRevenue)
  return { aov, margin }
}

export async function getProducts(projectId: string, userId: string): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTIONS.PRODUCTS),
    where('projectId', '==', projectId),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const items = snap.docs.map((d) => toProduct(d.id, d.data() as Record<string, unknown>))
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function addProduct(
  projectId: string,
  userId: string,
  data: ProductFormData
): Promise<Product> {
  const { aov, margin } = computeProductMetrics(data)
  const payload = {
    projectId,
    userId,
    ...data,
    aov,
    margin,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTIONS.PRODUCTS), payload)
  return {
    id: ref.id,
    projectId,
    userId,
    ...data,
    aov,
    margin,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateProduct(id: string, data: ProductFormData): Promise<void> {
  const { aov, margin } = computeProductMetrics(data)
  await updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), {
    ...data,
    aov,
    margin,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id))
}
