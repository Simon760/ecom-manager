'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import TopBar from '@/components/layout/TopBar'
import ProfitabilityCalculator from '@/components/calculator/ProfitabilityCalculator'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { getProjects } from '@/services/projects.service'
import { getOffers } from '@/services/calculator.service'
import { Project, CalculatorOffer, CURRENCY_SYMBOLS } from '@/types'

function CalculatorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = searchParams.get('projectId')
  const [project, setProject] = useState<Project | null>(null)
  const [offers, setOffers] = useState<CalculatorOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) { router.replace('/projects'); return }
    if (!user) return
    let cancelled = false
    Promise.all([
      getProjects(user.uid),
      getOffers(user.uid, projectId),
    ])
      .then(([ps, os]) => {
        if (cancelled) return
        const p = ps.find((x) => x.id === projectId)
        if (!p) { router.replace('/projects'); return }
        setProject(p)
        setOffers(os)
        setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Erreur chargement calculateur:', err)
          setLoadError('Erreur lors du chargement.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [user, projectId]) // eslint-disable-line

  if (loading) return <Spinner size="md" className="mt-16 mx-auto" />
  if (loadError) return (
    <div className="mt-16 mx-auto max-w-md p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-center">
      {loadError}
    </div>
  )
  if (!project || !user) return null

  return (
    <div>
      <TopBar
        title={project.name}
        subtitle="Calculateur ROAS Break-Even"
        badge={<Badge variant="violet">{CURRENCY_SYMBOLS[project.currency]} {project.currency}</Badge>}
      />
      <ProfitabilityCalculator
        currency={project.currency}
        userId={user.uid}
        projectId={project.id}
        savedOffers={offers}
        onOffersChange={setOffers}
      />
    </div>
  )
}

export default function CalculatorPage() {
  return <Suspense fallback={<Spinner size="md" className="mt-16 mx-auto" />}><CalculatorContent /></Suspense>
}
