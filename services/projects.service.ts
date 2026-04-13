// ============================================================
// PROJECTS SERVICE — CRUD des projets (marques e-commerce)
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
import { Project, ProjectFormData } from '@/types'

/** Convertit un document Firestore en objet Project */
function toProject(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    userId: data.userId as string,
    name: data.name as string,
    description: (data.description as string) || '',
    currency: data.currency as Project['currency'],
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

/** Récupère tous les projets de l'utilisateur */
export async function getProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(db, COLLECTIONS.PROJECTS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toProject(d.id, d.data() as Record<string, unknown>))
}

/** Crée un nouveau projet */
export async function createProject(
  userId: string,
  data: ProjectFormData
): Promise<Project> {
  const payload = {
    userId,
    name: data.name.trim(),
    description: data.description?.trim() || '',
    currency: data.currency,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTIONS.PROJECTS), payload)
  return {
    id: ref.id,
    userId,
    ...data,
    description: data.description || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/** Met à jour un projet */
export async function updateProject(
  projectId: string,
  data: Partial<ProjectFormData>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PROJECTS, projectId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/** Supprime un projet et toutes ses données associées */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  // Supprime le projet
  await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId))

  // Supprime toutes les données associées
  const collections = [
    COLLECTIONS.DAILY_STATS,
    COLLECTIONS.EXPENSES,
    COLLECTIONS.REVENUES,
    COLLECTIONS.CREATIVES,
    COLLECTIONS.PRODUCTS,
  ]

  for (const col of collections) {
    const q = query(
      collection(db, col),
      where('projectId', '==', projectId),
      where('userId', '==', userId)
    )
    const snap = await getDocs(q)
    const deletions = snap.docs.map((d) => deleteDoc(d.ref))
    await Promise.all(deletions)
  }
}
