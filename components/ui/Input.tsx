'use client'
// ============================================================
// INPUT — Champ de saisie + Textarea + Label
// ============================================================
import React from 'react'
import { cn } from '@/lib/utils'

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: string   // ex: "€" ou "$"
  suffix?: string
}

// forwardRef est nécessaire pour que react-hook-form puisse attacher ses refs
const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix, suffix, className, id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-zinc-400">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-sm text-zinc-500 pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-zinc-900 text-sm text-zinc-100',
            'placeholder:text-zinc-600 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
            error
              ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500'
              : 'border-zinc-700 hover:border-zinc-600',
            prefix ? 'pl-8' : 'pl-3',
            suffix ? 'pr-8' : 'pr-3',
            'py-2',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-sm text-zinc-500 pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
})

export default Input

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...props },
  ref
) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-medium text-zinc-400">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          'w-full rounded-lg border bg-zinc-900 text-sm text-zinc-100',
          'placeholder:text-zinc-600 transition-colors duration-150 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
          error
            ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500'
            : 'border-zinc-700 hover:border-zinc-600',
          'px-3 py-2',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
})
