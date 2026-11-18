import { useMemo, useRef, useState } from 'react'
import { Bot, Loader2, Save, Sparkles, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader, Slider, Tabs } from '@/components/ui/ui'
import { buildPlan, DEFAULT_PARAMS, HORIZON, type PlanParams, type Plan, type Priority } from '@/lib/planner'
import { fmtInt, fmtMoney, fmtMonths, fmtSigned } from '@/lib/format'
import { streamLines } from '@/services/ai'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const WAVE_COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
const PRIORITIES: { value: Exclude<Priority, 'manual'>; label: string }[] = [
  { value: 'savings', label: 'Savings' }, { value: 'risk', label: 'Risk' }, { value: 'realEstate', label: 'Real estate' }, { value: 'carbon', label: 'Carbon' },
]

function Delta({ now, prev, fmt, goodWhenUp = true }: { now: number; prev?: number; fmt: (n: number) => string; goodWhenUp?: boolean }) {
  if (prev === undefined || !Number.isFinite(prev) || !Number.isFinite(now) || Math.abs(now - prev) < 1e-9) return <span className="text-xs text-slate-400">no change</span>
  const up = now > prev
  const good = up === goodWhenUp
  return <span className={cn('text-xs font-medium', good ? 'text-teal-600 dark:text-teal-300' : 'text-red-600 dark:text-red-400')}>{fmtSigned(now - prev, fmt)} vs. previous</span>
}

function Metric({ label, value, delta }: { label: string; value: string; delta?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      {delta}
    </div>
  )
}

function Gantt({ plan }: { plan: Plan }) {
  const done = plan.items.filter((i) => !i.deferred)
  const lanes = Math.round(plan.params.crews)
  const months = Array.from({ length: HORIZON }, (_, i) => i + 1)
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="ml-20 flex text-[10px] text-slate-500">
          {months.map((m) => <div key={m} className={cn('flex-1 border-l border-slate-200 pl-0.5 dark:border-white/10', m % 9 === 1 && 'font-bold text-slate-700 dark:text-slate-200')}>{m % 3 === 1 ? m : ''}</div>)}
        </div>
        {Array.from({ length: lanes }, (_, lane) => (
          <div key={lane} className="relative mt-1 flex h-9 items-center">
            <div className="w-20 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300">Crew {lane + 1}</div>
            <div className="relative h-8 flex-1 rounded bg-slate-100 dark:bg-white/5">
              {done.filter((i) => i.lane === lane).map((i) => (
                <div
                  key={i.co.id}
                  title={`${i.co.name}: months ${i.start}–${i.end}, ${fmtMoney(i.cost)}, saves ${fmtMoney(i.annualSavings)}/yr`}
                  className="absolute top-0.5 flex h-7 items-center overflow-hidden whitespace-nowrap rounded px-1.5 text-[11px] font-semibold text-white"
                  style={{ left: `${((i.start - 1) / HORIZON) * 100}%`, width: `${((i.end - i.start + 1) / HORIZON) * 100}%`, background: WAVE_COLORS[(i.wave - 1) % WAVE_COLORS.length] }}
                >
                  {i.co.city}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="ml-20 mt-3 flex flex-wrap gap-3 text-xs">
          {[1, 2, 3, 4].map((w) => <span key={w} className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: WAVE_COLORS[w - 1] }} />Wave {w} (months {(w - 1) * 9 + 1}–{w * 9})</span>)}
        </div>
      </div>
    </div>
  )
}

const REASONING = (plan: Plan, best: Priority, results: { p: Priority; npv: number; completed: number }[]) => [
  'Sequencing Agent: loading 36 candidate sites, crew capacity, budget cap and risk tolerance',
  'Applying regulatory notice windows (rural sites ≥ 12 months, urban 6–9 months)',
  `Evaluating strategies: ${results.map((r) => `${r.p} → NPV ${fmtMoney(r.npv)} (${r.completed} sites)`).join(' · ')}`,
  `Best strategy: "${best}". Balancing crew utilisation and removing idle gaps`,
  `Deferring ${plan.metrics.deferred} sites that exceed the 36-month horizon, budget cap or risk tolerance`,
  `Plan ready: ${plan.metrics.completed} sites retired · NPV ${fmtMoney(plan.metrics.npv)} · payback ${fmtMonths(plan.metrics.paybackMonths)}`,
]

export default function WavePlanner() {
  const { plan: params, previousPlan, setPlan, planOptimized, markOptimized, saved, saveScenario, removeScenario, logAudit } = useStore()
  const plan = useMemo(() => buildPlan(params), [params])
  const prev = useMemo(() => (previousPlan ? buildPlan(previousPlan) : undefined), [previousPlan])
  const [log, setLog] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [view, setView] = useState<'plan' | 'compare'>('plan')
  const abort = useRef<AbortController | null>(null)

  async function optimize() {
    setRunning(true)
    setLog([])
    abort.current = new AbortController()
    const results = PRIORITIES.map((p) => {
      const pl = buildPlan({ ...params, priority: p.value })
      return { p: p.value as Priority, npv: pl.metrics.npv - pl.metrics.exposureIndex * 20_000, completed: pl.metrics.completed }
    })
    const best = results.reduce((a, b) => (b.npv > a.npv ? b : a)).p
    const next = buildPlan({ ...params, priority: best })
    for await (const line of streamLines(REASONING(next, best, results), 450, abort.current.signal)) setLog((l) => [...l, line])
    setPlan({ priority: best })
    markOptimized()
    logAudit('Sequencing Agent', `Optimized wave plan (strategy: ${best})`, 'Wave Planner')
    setRunning(false)
  }

  const m = plan.metrics
  const pm = prev?.metrics
  const byWave = [1, 2, 3, 4].map((w) => ({ w, items: plan.items.filter((i) => !i.deferred && i.wave === w) }))
  const set = (p: Partial<PlanParams>) => setPlan(p)

  return (
    <div>
      <PageHeader
        title="Wave Planner"
        subtitle="Sequencing Agent plans migration waves across 36 months. Move any slider to re-plan live."
        actions={
          <div className="flex items-center gap-3">
            <Tabs value={view} onChange={setView} items={[{ value: 'plan', label: 'Plan' }, { value: 'compare', label: `Compare scenarios (${saved.length})` }]} />
            <Button size="lg" onClick={optimize} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />} Optimize waves
            </Button>
          </div>
        }
      />

      {(running || log.length > 0) && (
        <Card className="mb-4 border-teal-500/40">
          <CardBody className="font-mono text-sm">
            <div className="mb-2 flex items-center gap-2 font-sans font-semibold"><Bot className="h-4 w-4 text-teal-500" aria-hidden /> Agent reasoning log</div>
            {log.map((l, i) => <div key={i} className="text-slate-700 dark:text-slate-300"><span className="text-teal-500">▸</span> {l}</div>)}
            {running && <div className="caret text-slate-500">thinking</div>}
          </CardBody>
        </Card>
      )}

      {view === 'plan' ? (
        <div className="grid grid-cols-[320px_1fr] gap-4">
          <Card>
            <CardHeader><CardTitle>Plan levers</CardTitle></CardHeader>
            <CardBody className="space-y-5">
              <Slider label="Crew capacity" value={params.crews} min={2} max={8} onChange={(v) => set({ crews: v })} display={`${params.crews} crews`} />
              <Slider label="Budget cap" value={params.budgetCap / 1e6} min={20} max={120} step={5} onChange={(v) => set({ budgetCap: v * 1e6 })} display={`$${params.budgetCap / 1e6}M`} />
              <Slider label="Risk tolerance" value={params.riskTolerance} min={0} max={100} step={5} onChange={(v) => set({ riskTolerance: v })} display={params.riskTolerance < 35 ? 'Cautious' : params.riskTolerance < 70 ? 'Balanced' : 'Aggressive'} />
              <div>
                <div className="mb-1 text-sm font-medium">Prioritise</div>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map((p) => (
                    <button key={p.value} onClick={() => set({ priority: p.value })} aria-pressed={params.priority === p.value}
                      className={cn('rounded-lg border px-3 py-2 text-sm font-medium', params.priority === p.value ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-300 hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/10')}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {params.priority === 'manual' && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Showing the manual (inventory-order) baseline. Optimize to let the agent choose.</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => saveScenario(`Scenario ${saved.length + 1}: ${params.priority}, ${params.crews} crews`)}><Save className="h-4 w-4" aria-hidden /> Save scenario</Button>
                <Button variant="ghost" size="sm" onClick={() => set({ ...DEFAULT_PARAMS })}>Defaults</Button>
              </div>
            </CardBody>
          </Card>
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <Metric label="5-yr NPV" value={fmtMoney(m.npv)} delta={<Delta now={m.npv} prev={pm?.npv} fmt={fmtMoney} />} />
              <Metric label="Payback" value={fmtMonths(m.paybackMonths)} delta={<Delta now={m.paybackMonths} prev={pm?.paybackMonths} fmt={(n) => `${n.toFixed(1)} mo`} goodWhenUp={false} />} />
              <Metric label="Sites retired in 36 mo" value={`${m.completed} / ${m.completed + m.deferred}`} delta={<Delta now={m.completed} prev={pm?.completed} fmt={fmtInt} />} />
              <Metric label="Residual keep-risk index" value={m.exposureIndex.toFixed(1)} delta={<Delta now={m.exposureIndex} prev={pm?.exposureIndex} fmt={(n) => n.toFixed(1)} goodWhenUp={false} />} />
              <Metric label="Migration spend" value={fmtMoney(m.capex)} delta={<Delta now={m.capex} prev={pm?.capex} fmt={fmtMoney} goodWhenUp={false} />} />
              <Metric label="Steady-state savings" value={`${fmtMoney(m.steadySavings)}/yr`} delta={<Delta now={m.steadySavings} prev={pm?.steadySavings} fmt={fmtMoney} />} />
              <Metric label="Lines migrated" value={fmtInt(m.linesMigrated)} delta={<Delta now={m.linesMigrated} prev={pm?.linesMigrated} fmt={fmtInt} />} />
              <Metric label="Avg. migration risk" value={m.migrationRisk.toFixed(1)} delta={<Delta now={m.migrationRisk} prev={pm?.migrationRisk} fmt={(n) => n.toFixed(1)} goodWhenUp={false} />} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Migration waves · 36-month timeline</CardTitle>
                <Badge tone={planOptimized ? 'teal' : 'amber'}>{planOptimized ? 'AI-optimized plan' : 'Manual baseline'}</Badge>
              </CardHeader>
              <CardBody><Gantt plan={plan} /></CardBody>
            </Card>
            <div className="grid grid-cols-4 gap-3">
              {byWave.map(({ w, items }) => (
                <Card key={w}>
                  <CardBody>
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><span className="h-3 w-3 rounded" style={{ background: WAVE_COLORS[w - 1] }} /> Wave {w} · {items.length} sites</div>
                    <div className="text-xs text-slate-500">{fmtInt(items.reduce((a, i) => a + i.co.totalLines, 0))} lines · {fmtMoney(items.reduce((a, i) => a + i.annualSavings, 0))}/yr</div>
                    <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">{items.map((i) => i.co.city).join(', ') || '—'}</div>
                  </CardBody>
                </Card>
              ))}
            </div>
            {m.deferred > 0 && (
              <Card><CardBody className="text-sm"><strong>Deferred beyond month 36 ({m.deferred}):</strong> <span className="text-slate-600 dark:text-slate-300">{plan.items.filter((i) => i.deferred).map((i) => i.co.city).join(', ')}.</span> Add crews, raise the budget cap or increase risk tolerance to pull them in.</CardBody></Card>
            )}
          </div>
        </div>
      ) : (
        <div>
          {saved.length === 0 ? (
            <Card><CardBody className="text-slate-600 dark:text-slate-300">No saved scenarios yet. Go to the Plan tab, adjust the levers and click “Save scenario” (up to 3).</CardBody></Card>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {saved.map((s) => {
                const p = buildPlan(s.params)
                return (
                  <Card key={s.id}>
                    <CardHeader><CardTitle>{s.name}</CardTitle><Button variant="ghost" size="sm" onClick={() => removeScenario(s.id)} aria-label="Delete scenario"><Trash2 className="h-4 w-4" /></Button></CardHeader>
                    <CardBody className="space-y-2 text-sm">
                      <div className="text-xs text-slate-500">{s.params.crews} crews · {fmtMoney(s.params.budgetCap)} cap · risk {s.params.riskTolerance} · {s.params.priority}</div>
                      <Row l="5-yr NPV" v={fmtMoney(p.metrics.npv)} />
                      <Row l="Payback" v={fmtMonths(p.metrics.paybackMonths)} />
                      <Row l="Sites retired" v={`${p.metrics.completed} / ${p.metrics.completed + p.metrics.deferred}`} />
                      <Row l="Migration spend" v={fmtMoney(p.metrics.capex)} />
                      <Row l="Steady-state savings" v={`${fmtMoney(p.metrics.steadySavings)}/yr`} />
                      <Row l="Keep-risk index" v={p.metrics.exposureIndex.toFixed(1)} />
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between border-b border-slate-100 pb-1 dark:border-white/5"><span className="text-slate-500">{l}</span><strong>{v}</strong></div>
}
