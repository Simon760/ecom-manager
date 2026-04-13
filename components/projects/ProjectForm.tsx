'use client'
// ============================================================
// PROJECT FORM — Création / édition d'un projet
// ============================================================
import React from 'react'
import { useForm } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { ProjectFormData, Currency } from '@/types'
import { Textarea } from '@/components/ui/Input'

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: '€ EUR — Euro' },
  { value: 'USD', label: '$ USD — Dollar US' },
  { value: 'GBP', label: '£ GBP — Livre sterling' },
  { value: 'CAD', label: 'CA$ CAD — Dollar canadien' },
  { value: 'AUD', label: 'AU$ AUD — Dollar australien' },
  { value: 'CHF', label: 'CHF — Franc suisse' },
]

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormData>
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function ProjectForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
      currency: 'EUR',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nom du projet"
        placeholder="ex: Ma Boutique Paris"
        required
        error={errors.name?.message}
        {...register('name', {
          required: 'Le nom est requis',
          minLength: { value: 2, message: 'Minimum 2 caractères' },
          maxLength: { value: 50, message: 'Maximum 50 caractères' },
        })}
      />

      <Textarea
        label="Description (optionnel)"
        placeholder="ex: Dropshipping mode femme — marché FR/BE"
        {...register('description')}
      />

      <Select
        label="Devise"
        options={CURRENCY_OPTIONS}
        required
        {...register('currency', { required: true })}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {defaultValues?.name ? 'Enregistrer' : 'Créer le projet'}
        </Button>
      </div>
    </form>
  )
}
