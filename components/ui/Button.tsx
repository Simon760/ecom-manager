'use client'
// ============================================================
// BUTTON — Composant bouton réutilisable
// ============================================================
import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-violet-600 hover:bg-violet-500 text-white border-transparent shadow-lg shadow-violet-900/30',
  secondary: 'bg-[#171B23] hover:bg-[#1F242D] text-zinc-100 border-[#2F3541]',
  ghost: 'bg-transparent hover:bg-[#171B23] text-zinc-400 hover:text-zinc-100 border-transparent',
  danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30',
  success: 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-medium',
        'transition-all duration-150 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  )
}
