// ============================================================
// AUTH SERVICE — Logique métier auth (hors contexte)
// ============================================================
// Note : la plupart des opérations auth sont dans AuthContext.
// Ce fichier expose des helpers supplémentaires si besoin.

import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'

/** Envoie un email de réinitialisation de mot de passe */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}
