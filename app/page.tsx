'use client'
// ============================================================
// HOME — Redirige vers /dashboard ou /auth selon l'état auth
// ============================================================
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Spinner from '@/components/ui/Spinner'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (user) {
      router.replace('/dashboard')
    } else {
      router.replace('/auth')
    }
  }, [user, loading, router])

  return <Spinner fullPage size="lg" text="Démarrage…" />
}
