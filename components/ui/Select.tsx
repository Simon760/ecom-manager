'use client'
// ============================================================
// SELECT — Menu déroulant stylisé
// ============================================================
import React from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-zinc-400">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-lg border bg-[#12151C] text-sm text-zinc-100',
          'transition-colors duration-150 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
          error
            ? 'border-red-500/50'
            : 'border-[#2F3541] hover:border-[#3A414E]',
          'px-3 py-2',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#12151C] text-zinc-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
