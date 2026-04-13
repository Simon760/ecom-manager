'use client'
// ============================================================
// AUTH PAGE — Connexion / Inscription
// ============================================================
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Zap, AlertCircle } from 'lucide-react'

type Mode = 'login' | 'register'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  displayName: string
  email: string
  password: string
  confirmPassword: string
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const { user, signIn, signUp, error, clearError, loading } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  // Redirige si déjà connecté
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  const loginForm = useForm<LoginData>({ mode: 'onChange' })
  const registerForm = useForm<RegisterData>({ mode: 'onChange' })

  const handleLogin = async (data: LoginData) => {
    setSubmitting(true)
    try { await signIn(data.email, data.password) }
    catch { /* error géré dans le contexte */ }
    finally { setSubmitting(false) }
  }

  const handleRegister = async (data: RegisterData) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', { message: 'Les mots de passe ne correspondent pas' })
      return
    }
    setSubmitting(true)
    try { await signUp(data.email, data.password, data.displayName) }
    catch { /* error géré dans le contexte */ }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-3 shadow-lg shadow-violet-900/50">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">EcomManager</h1>
          <p className="text-sm text-zinc-500 mt-1">Gérez vos marques e-commerce</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur p-6 shadow-2xl">
          {/* Tab toggle */}
          <div className="flex gap-1 p-1 bg-zinc-800 rounded-xl mb-6">
            <TabBtn active={mode === 'login'} onClick={() => { setMode('login'); clearError() }}>
              Connexion
            </TabBtn>
            <TabBtn active={mode === 'register'} onClick={() => { setMode('register'); clearError() }}>
              Inscription
            </TabBtn>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                error={loginForm.formState.errors.email?.message}
                {...loginForm.register('email', {
                  required: 'Email requis',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
                })}
              />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                error={loginForm.formState.errors.password?.message}
                {...loginForm.register('password', {
                  required: 'Mot de passe requis',
                  minLength: { value: 6, message: 'Minimum 6 caractères' },
                })}
              />
              <Button type="submit" fullWidth loading={submitting} className="mt-2">
                Se connecter
              </Button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <Input
                label="Prénom / Pseudo"
                placeholder="ex: Simon"
                required
                error={registerForm.formState.errors.displayName?.message}
                {...registerForm.register('displayName', {
                  required: 'Requis',
                  minLength: { value: 2, message: 'Minimum 2 caractères' },
                })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                error={registerForm.formState.errors.email?.message}
                {...registerForm.register('email', {
                  required: 'Email requis',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
                })}
              />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="Minimum 6 caractères"
                required
                autoComplete="new-password"
                error={registerForm.formState.errors.password?.message}
                {...registerForm.register('password', {
                  required: 'Requis',
                  minLength: { value: 6, message: 'Minimum 6 caractères' },
                })}
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                error={registerForm.formState.errors.confirmPassword?.message}
                {...registerForm.register('confirmPassword', { required: 'Requis' })}
              />
              <Button type="submit" fullWidth loading={submitting} className="mt-2">
                Créer mon compte
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Vos données sont stockées en sécurité sur Firebase.
        </p>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}
