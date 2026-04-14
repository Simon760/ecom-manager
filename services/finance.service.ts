// ============================================================
// FINANCE SERVICE — Dépenses & Revenus (P&L)
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
import { Expense, ExpenseFormData, Revenue, RevenueFormData } from '@/types'

// --- Expenses ---

function toExpense(id: string, data: Record<string, unknown>): Expense {
  return {
    id,
    projectId: data.projectId as string,
    userId: data.userId as string,
    date: data.date as string,
    category: data.category as Expense['category'],
    description: data.description as string,
    amount: (data.amount as number) ?? 0,
    type: (data.type as Expense['type']) ?? 'cash',
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
  }
}

export async function getExpenses(
  projectId: string,
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<Expense[]> {
  const q = query(
    collection(db, COLLECTIONS.EXPENSES),
    where('projectId', '==', projectId),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  let items = snap.docs.map((d) => toExpense(d.id, d.data() as Record<string, unknown>))
  if (startDate) items = items.filter((i) => i.date >= startDate)
  if (endDate) items = items.filter((i) => i.date <= endDate)
  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

export async function addExpense(
  projectId: string,
  userId: string,
  data: ExpenseFormData
): Promise<Expense> {
  const payload = { projectId, userId, ...data, createdAt: serverTimestamp() }
  const ref = await addDoc(collection(db, COLLECTIONS.EXPENSES), payload)
  return { id: ref.id, projectId, userId, ...data, createdAt: new Date() }
}

export async function updateExpense(id: string, data: ExpenseFormData): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EXPENSES, id), { ...data })
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id))
}

// --- Revenues ---

function toRevenue(id: string, data: Record<string, unknown>): Revenue {
  return {
    id,
    projectId: data.projectId as string,
    userId: data.userId as string,
    date: data.date as string,
    description: data.description as string,
    amount: (data.amount as number) ?? 0,
    source: (data.source as string) ?? '',
    type: (data.type as Revenue['type']) ?? 'cash',
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
  }
}

export async function getRevenues(
  projectId: string,
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<Revenue[]> {
  const q = query(
    collection(db, COLLECTIONS.REVENUES),
    where('projectId', '==', projectId),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  let items = snap.docs.map((d) => toRevenue(d.id, d.data() as Record<string, unknown>))
  if (startDate) items = items.filter((i) => i.date >= startDate)
  if (endDate) items = items.filter((i) => i.date <= endDate)
  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

export async function addRevenue(
  projectId: string,
  userId: string,
  data: RevenueFormData
): Promise<Revenue> {
  const payload = { projectId, userId, ...data, createdAt: serverTimestamp() }
  const ref = await addDoc(collection(db, COLLECTIONS.REVENUES), payload)
  return { id: ref.id, projectId, userId, ...data, createdAt: new Date() }
}

export async function updateRevenue(id: string, data: RevenueFormData): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.REVENUES, id), { ...data })
}

export async function deleteRevenue(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.REVENUES, id))
}
