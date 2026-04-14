// ============================================================
// FIREBASE — Initialisation client-side uniquement
// ============================================================
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Singleton — évite la double initialisation en hot-reload
// On initialise toujours l'app Firebase (côté client comme serveur pour le build statique)
// Les appels réels n'ont lieu que côté client grâce aux guards dans AuthContext et les services
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)

export { app, auth, db }

// --- Noms des collections Firestore ---
export const COLLECTIONS = {
  USERS: 'users',
  PROJECTS: 'projects',
  DAILY_STATS: 'daily_stats',
  EXPENSES: 'expenses',
  REVENUES: 'revenues',
  CREATIVES: 'creatives',
  PRODUCTS: 'products',
} as const
