'use client'
// ============================================================
// AUTH CONTEXT — Gestion de l'état d'authentification global
// ============================================================
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  AuthError,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, COLLECTIONS } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

// --- Types ---
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  error: string | null
  clearError: () => void
}

// --- Création du contexte ---
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// --- Provider ---
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Écoute les changements d'état Firebase Auth
  useEffect(() => {
    if (typeof window === 'undefined') return
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Connexion
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(parseAuthError(err as AuthError))
      throw err
    }
  }

  // Inscription
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null)
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
      // Met à jour le displayName
      await updateProfile(newUser, { displayName })
      // Crée le document utilisateur dans Firestore
      await setDoc(doc(db, COLLECTIONS.USERS, newUser.uid), {
        email: newUser.email,
        displayName,
        createdAt: serverTimestamp(),
      })
      router.push('/dashboard')
    } catch (err) {
      setError(parseAuthError(err as AuthError))
      throw err
    }
  }

  // Déconnexion
  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      router.push('/auth')
    } catch (err) {
      setError(parseAuthError(err as AuthError))
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, error, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

// --- Hook ---
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}

// --- Traduction des erreurs Firebase ---
function parseAuthError(error: AuthError): string {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Adresse email invalide.'
    case 'auth/user-not-found':
      return 'Aucun compte trouvé avec cet email.'
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.'
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email.'
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez dans quelques minutes.'
    case 'auth/network-request-failed':
      return 'Erreur réseau. Vérifiez votre connexion.'
    case 'auth/invalid-credential':
      return 'Identifiants invalides. Vérifiez votre email et mot de passe.'
    default:
      return `Erreur d'authentification (${error.code}).`
  }
}
