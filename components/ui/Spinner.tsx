'use client'
// ============================================================
// SPINNER — Indicateur de chargement
// ============================================================
import React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullPage?: boolean
  text?: string
}

const sizeStyles = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
}

export default function Spinner({ size = 'md', className, fullPage = false, text }: SpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-zinc-700 border-t-violet-500 animate-spin',
          sizeStyles[size]
        )}
      />
      {text && <p className="text-sm text-zinc-500">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950">
        {spinner}
      </div>
    )
  }

  return spinner
}
