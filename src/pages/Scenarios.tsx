import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, Circle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui/ui'
import { useChartTheme } from '@/components/Kpi'
import { SCENARIOS, type Visual } from '@/data/scenarios'
import { COS, CO_BY_ID, REMAINING_COS, HIDDEN_DEPENDENCIES, readinessBand } from '@/data/cos'
import { MILESTONES } from '@/data/regulatory'
import { SEGMENTS } from '@/data/types'
import { buildBusinessCase, DEFAULT_INPUTS, RAMPS } from '@/lib/finance'
import { fmtInt, fmtMoney, fmtMonths } from '@/lib/format'
import { cn } from '@/lib/utils'

const CUTOVER_ITEMS = [
  'Switch health telemetry nominal (no active major alarms)',
  'All 911 / PSAP trunks re-homed and test-called (5 of 5)',
  'Number-port files validated for 5,000 numbers',
  'Alarm and elevator circuits remediated (217 of 217)',
  'Rollback path rehearsed; T+90 min decision point set',
  'Customer notifications delivered and on-site crews on standby',
]

function Ranking() {
  const top = [...REMAINING_COS].sort((a, b) => a.rank - b.rank).slice(0, 8)
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-slate-500"><tr><th>#</th><th>Central office</th><th>Switch</th><th className="text-right">Maint.</th><th className="text-right">Readiness</th><th className="text-right">AI score</th></tr></thead>
      <tbody>
        {top.map((c) => (
          <tr key={c.id} className={cn('border-t border-slate-100 dark:border-white/5', c.rank === top[0].rank && 'bg-teal-50 font-semibold dark:bg-teal-500/10')}>
            <td className="py-1.5">{c.rank}</td><td>{c.name}</td><td>{c.switchType} · {c.support}</td><td className="text-right">{fmtMoney(c.maintenanceCost)}</td>
            <td className="text-right">{c.readiness.toFixed(0)} <Badge tone={readinessBand(c.readiness) === 'High' ? 'teal' : readinessBand(c.readiness) === 'Medium' ? 'amber' : 'red'}>{readinessBand(c.readiness)}</Badge></td><td className="text-right">{c.aiScore.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Hidden() {
  const list = HIDDEN_DEPENDENCIES.filter((h) => CO_BY_ID[h.coId]?.city === 'Kingston')
  return (
    <div className="space-y-2">
      {list.map((h) => (
        <div key={h.id} className="rounded-lg border border-amber-400/50 bg-amber-50 p-3 text-sm dark:bg-amber-500/10">
          <div className="font-semibold">{h.title} <Badge tone="amber">{fmtInt(h.count)}</Badge></div>
          <div className="text-slate-700 dark:text-slate-300">{h.detail}</div>
          <div className="mt-1 text-xs text-slate-500">Discovered by {h.discoveredBy} · Remediation: {h.remediation}</div>
        </div>
      ))}
    </div>
  )
}

function Segments() {
  const t = useChartTheme()
  const data = SEGMENTS.map((s) => ({ name: s.label, lines: COS.reduce((a, c) => a + c.lines[s.key], 0) }))
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey="name" stroke={t.axis} fontSize={11} interval={0} />
          <YAxis stroke={t.axis} fontSize={11} tickFormatter={(v) => fmtInt(v / 1000) + 'k'} />
          <Tooltip contentStyle={t.tooltip} formatter={(v: number) => fmtInt(v)} />
          <Bar dataKey="lines" fill="#14b8a6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Regulatory() {
  return (
    <ul className="space-y-1.5 text-sm">
      {MILESTONES.slice(0, 6).map((m) => (
        <li key={m.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-1.5 dark:border-white/5">
          <span><strong>{m.title}</strong><br /><span className="text-xs text-slate-500">{m.authority} · due {m.due} · {m.note}</span></span>
          <Badge tone={m.status === 'Complete' || m.status === 'On track' ? 'teal' : m.status === 'At risk' ? 'red' : 'slate'}>{m.status}</Badge>
        </li>
      ))}
    </ul>
  )
}

function Cases() {
  const t = useChartTheme()
  const data = (Object.keys(RAMPS) as (keyof typeof RAMPS)[]).map((k) => {
    const bc = buildBusinessCase({ ...DEFAULT_INPUTS, ramp: [...RAMPS[k]] })
    return { name: k[0].toUpperCase() + k.slice(1), npv: bc.npv, payback: bc.paybackMonths, irr: bc.irr }
  })
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis dataKey="name" stroke={t.axis} fontSize={12} />
            <YAxis stroke={t.axis} fontSize={11} tickFormatter={(v) => fmtMoney(v, 0)} />
            <Tooltip contentStyle={t.tooltip} formatter={(v: number) => fmtMoney(v)} />
            <Bar dataKey="npv" name="5-yr NPV" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="self-center text-sm">
        <thead className="text-left text-slate-500"><tr><th>Case</th><th>NPV</th><th>IRR</th><th>Payback</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.name} className="border-t border-slate-100 dark:border-white/5"><td className="py-1.5 font-medium">{d.name}</td><td>{fmtMoney(d.npv)}</td><td>{(d.irr * 100).toFixed(0)}%</td><td>{fmtMonths(d.payback)}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function Cutover() {
  const [done, setDone] = useState<boolean[]>(CUTOVER_ITEMS.map(() => false))
  const n = done.filter(Boolean).length
  const go = n === CUTOVER_ITEMS.length
  return (
    <div>
      <ul className="space-y-1.5">
        {CUTOVER_ITEMS.map((it, i) => (
          <li key={it}>
            <button onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} aria-pressed={done[i]} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-left text-sm hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
              {done[i] ? <CheckCircle2 className="h-5 w-5 text-teal-500" aria-hidden /> : <Circle className="h-5 w-5 text-slate-400" aria-hidden />}
              {it}
            </button>
          </li>
        ))}
      </ul>
      <div className={cn('mt-3 rounded-lg p-3 text-center text-lg font-bold', go ? 'bg-teal-600 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200')}>
        {go ? 'GO – all checks passed' : `NO-GO – ${CUTOVER_ITEMS.length - n} check(s) outstanding`}
      </div>
    </div>
  )
}

const VISUALS: Record<Visual, React.ReactNode> = {
  ranking: <Ranking />, hidden: <Hidden />, segments: <Segments />, regulatory: <Regulatory />, cases: <Cases />, cutover: <Cutover />, none: null,
}

function Runner({ id }: { id: string }) {
  const s = SCENARIOS.find((x) => x.id === id)
  const [i, setI] = useState(0)
  const step = useMemo(() => s?.steps[i], [s, i])
  if (!s || !step) return <PageHeader title="Scenario not found" />
  const last = i === s.steps.length - 1
  return (
    <div>
      <PageHeader title={`Scenario ${s.id}: ${s.title}`} subtitle={`${s.persona} · ${s.role}`} actions={<Link to="/scenarios"><Button variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden /> All scenarios</Button></Link>} />
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card className="border-red-300/50"><CardBody className="text-sm"><Badge tone="red">Before</Badge><p className="mt-2">{s.before.process}</p><p className="mt-1 font-semibold">{s.before.time} · {s.before.cost}</p></CardBody></Card>
        <Card className="border-teal-400/60"><CardBody className="text-sm"><Badge tone="teal">After</Badge><p className="mt-2">{s.after.process}</p><p className="mt-1 font-semibold">{s.after.time} · {s.after.cost}</p></CardBody></Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Step {i + 1} of {s.steps.length}: {step.title}</CardTitle>
          {step.agent && <Badge tone="blue"><Bot className="h-3.5 w-3.5" aria-hidden /> {step.agent}</Badge>}
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-slate-700 dark:text-slate-300">{step.body}</p>
          {VISUALS[step.visual]}
          <div className="mt-4 flex justify-between">
            <Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft className="h-4 w-4" aria-hidden /> Back</Button>
            <Button disabled={last} onClick={() => setI(i + 1)}>Next <ArrowRight className="h-4 w-4" aria-hidden /></Button>
          </div>
        </CardBody>
      </Card>
      {last && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {s.kpis.map((k) => (
            <Card key={k.label}><CardBody><div className="text-sm text-slate-500">{k.label}</div><div className="text-sm text-slate-500 line-through">{k.before}</div><div className="text-3xl font-bold text-teal-700 dark:text-teal-300">{k.after}</div></CardBody></Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Scenarios() {
  const { id } = useParams()
  if (id) return <Runner id={id.toUpperCase()} />
  return (
    <div>
      <PageHeader title="Scenarios" subtitle="Six executive stories, each with a persona, a before/after and a measurable result." />
      <div className="grid grid-cols-3 gap-4">
        {SCENARIOS.map((s) => (
          <Link key={s.id} to={`/scenarios/${s.id}`}>
            <Card className="h-full transition hover:border-teal-500">
              <CardBody>
                <Badge tone="teal">Scenario {s.id}</Badge>
                <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.persona} · {s.role}</p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{s.before.time} → <strong>{s.after.time}</strong></p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
