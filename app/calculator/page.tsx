'use client'
// ============================================================
// CALCULATOR PAGE — Calculateur de rentabilité
// ============================================================
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import TopBar from '@/components/layout/TopBar'
import ProfitabilityCalculator from '@/components/calculator/ProfitabilityCalculator'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { getProjects } from '@/services/projects.service'
import { Project, CURRENCY_SYMBOLS } from '@/types'

function CalculatorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = searchParams.get('projectId')
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) { router.replace('/projects'); return }
    if (!user) return
    getProjects(user.uid).then((ps) => {
      const p = ps.find((x) => x.id === projectId)
      if (!p) { router.replace('/projects'); return }
      setProject(p)
      setLoading(false)
    })
  }, [user, projectId]) // eslint-disable-line

  if (loading) return <Spinner size="md" className="mt-16 mx-auto" />
  if (!project) return null

  return (
    <div>
      <TopBar
        title={project.name}
        subtitle="Calculateur de rentabilité"
        badge={<Badge variant="violet">{CURRENCY_SYMBOLS[project.currency]} {project.currency}</Badge>}
      />
      <ProfitabilityCalculator currency={project.currency} />
    </div>
  )
}

export default function CalculatorPage() {
  return (
    <AppLayout>
      <Suspense fallback={<Spinner size="md" className="mt-16 mx-auto" />}>
        <CalculatorContent />
      </Suspense>
    </AppLayout>
  )
}
