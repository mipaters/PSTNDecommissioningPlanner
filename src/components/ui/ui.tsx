import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-navy-800/60', className)} {...p} />
}
export function CardHeader({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)} {...p} />
}
export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-slate-900 dark:text-white', className)} {...p} />
}
export function CardBody({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...p} />
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }
>(({ className, variant = 'primary', size = 'md', ...p }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50',
      size === 'sm' && 'px-3 py-1.5 text-sm',
      size === 'md' && 'px-4 py-2 text-sm',
      size === 'lg' && 'px-6 py-3 text-base',
      variant === 'primary' && 'bg-teal-600 text-white hover:bg-teal-700',
      variant === 'secondary' && 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10',
      variant === 'ghost' && 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
      className,
    )}
    {...p}
  />
))
Button.displayName = 'Button'

const tones = {
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
}
export function Badge({ tone = 'slate', className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)} {...p} />
}

export function Slider({
  label, value, min, max, step = 1, onChange, display,
}: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; display: string }) {
  const id = React.useId()
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium text-slate-700 dark:text-slate-200">{label}</label>
        <span className="tabular-nums font-semibold text-teal-700 dark:text-teal-300">{display}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-teal-600" />
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[] }) {
  return (
    <div role="tablist" className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-white/10">
      {items.map((i) => (
        <button
          key={i.value}
          role="tab"
          aria-selected={value === i.value}
          onClick={() => onChange(i.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition',
            value === i.value ? 'bg-white text-slate-900 shadow dark:bg-teal-600 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  )
}

export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-white/15 dark:bg-navy-900 dark:text-slate-100', className)}
      {...p}
    />
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-slate-600 dark:text-slate-300">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}
