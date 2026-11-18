import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Card } from '@/components/ui/ui'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

export function useChartTheme() {
  const dark = useStore((s) => s.theme) === 'dark'
  return {
    axis: dark ? '#94a3b8' : '#475569',
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.1)',
    tooltip: { backgroundColor: dark ? '#0f2447' : '#fff', border: '1px solid rgba(148,163,184,0.4)', borderRadius: 8, color: dark ? '#e2e8f0' : '#0f172a' },
  }
}

export function AnimatedNumber({ value, format, duration = 1.2 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const c = animate(prev.current, value, { duration, ease: 'easeOut', onUpdate: (v) => setShown(v) })
    prev.current = value
    return () => c.stop()
  }, [value, duration])
  return <span className="tabular-nums">{format(shown)}</span>
}

export function Kpi({
  label, value, sub, trend, target, tone = 'default', animated,
}: {
  label: string
  value: string
  sub?: string
  trend?: { dir: 'up' | 'down' | 'flat'; good: boolean; text: string }
  target?: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
  animated?: { value: number; format: (n: number) => string }
}) {
  return (
    <Card className="p-5">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
      <div className={cn('mt-1 text-4xl font-bold tracking-tight', tone === 'bad' ? 'text-red-600 dark:text-red-400' : tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : tone === 'good' ? 'text-teal-700 dark:text-teal-300' : 'text-slate-900 dark:text-white')}>
        {animated ? <AnimatedNumber value={animated.value} format={animated.format} /> : value}
      </div>
      {sub && <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{sub}</div>}
      <div className="mt-2 flex items-center justify-between text-xs">
        {trend && (
          <span className={cn('inline-flex items-center gap-1 font-medium', trend.good ? 'text-teal-700 dark:text-teal-300' : 'text-red-600 dark:text-red-400')}>
            {trend.dir === 'up' ? <ArrowUp className="h-3.5 w-3.5" aria-hidden /> : trend.dir === 'down' ? <ArrowDown className="h-3.5 w-3.5" aria-hidden /> : <Minus className="h-3.5 w-3.5" aria-hidden />}
            {trend.text}
          </span>
        )}
        {target && <span className="text-slate-500 dark:text-slate-400">Target: {target}</span>}
      </div>
    </Card>
  )
}
