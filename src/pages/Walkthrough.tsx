import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MessageSquare, StickyNote } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '@/components/ui/ui'
import { AnimatedNumber, useChartTheme } from '@/components/Kpi'
import { AGENTS } from '@/data/agents'
import { dashboardData } from '@/lib/dashboard'
import { buildBusinessCase } from '@/lib/finance'
import { fmtInt, fmtMoney, fmtMonths } from '@/lib/format'
import { useStore } from '@/store/useStore'

const STEPS = [
  { title: 'The problem', notes: ['Roughly 1.2M copper lines still ride on 42 end-of-life TDM switches.', 'Vendors are exiting support; spare parts are running out.', 'Every month of delay costs maintenance, power and real estate – and raises outage risk.'] },
  { title: 'The programme today', notes: ['Illustrative programme status: 6 of 42 switches retired, 2 in migration.', 'Savings are tracking about 5% behind plan; on-time delivery is 92%.', 'All numbers are synthetic demo data.'] },
  { title: 'Meet the agents', notes: ['Seven specialised agents, each with bounded autonomy.', 'Only “Act-with-approval” agents change anything, and only after a human signs off.', 'Open the Agents page to run any trace live.'] },
  { title: 'Which switch first?', notes: ['Scenario A: AI ranks every remaining site and explains why.', 'Thunder Bay – Red River wins: end-of-support DMS-100, $2.1M/yr to maintain.', 'Engineers can always override the ranking.'] },
  { title: 'How it fits your platform', notes: ['Read-only integration with OSS, BSS, provisioning and GIS.', 'Azure OpenAI, AI Search and Fabric – Canadian data residency.', 'Human approval gateway and full audit trail.'] },
  { title: 'The business case', notes: ['Computed live from the same data as the plan.', 'Cost-out, power, real estate and carbon vs. migration and churn.', 'Move any assumption on the Business Case page and watch NPV update.'] },
  { title: 'Roadmap', notes: ['30 days: discovery on a read-only data extract.', 'Next 90 days: pilot on 3 central offices.', 'Then scale wave by wave with the same agents and approvals.'] },
]

export default function Walkthrough() {
  const { walkthroughStep: step, setStep, presenterNotes, setPresenterNotes, carrier, setCopilotOpen } = useStore()
  const t = useChartTheme()
  const d = useMemo(() => dashboardData(), [])
  const bc = useMemo(() => buildBusinessCase(useStore.getState().business), [step])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowRight') setStep(Math.min(STEPS.length - 1, useStore.getState().walkthroughStep + 1))
      if (e.key === 'ArrowLeft') setStep(Math.max(0, useStore.getState().walkthroughStep - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setStep])

  const wf = (() => {
    let run = 0
    return bc.waterfall.map((w) => { const s = run; run += w.value; return { name: w.name, range: [Math.min(s, run), Math.max(s, run)], value: w.value } })
  })()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-500">Step {step + 1} of {STEPS.length}</div>
        <Button variant="secondary" size="sm" onClick={() => setPresenterNotes(!presenterNotes)} aria-pressed={presenterNotes}><StickyNote className="h-4 w-4" aria-hidden /> Presenter notes</Button>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuenow={step + 1} aria-valuemax={STEPS.length}>
        <div className="h-full bg-teal-500 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <h1 className="mb-1 text-4xl font-bold">{STEPS[step].title}</h1>
      <p className="mb-6 text-lg text-slate-600 dark:text-slate-300">{carrier} · PSTN / TDM decommissioning</p>

      <div className="min-h-[380px]">
        {step === 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[{ v: 1_200_000, f: (n: number) => fmtInt(n), l: 'Legacy lines still in service' }, { v: 42, f: (n: number) => fmtInt(n), l: 'TDM central-office switches' }, { v: 36, f: (n: number) => `${fmtInt(n)} / 42`, l: 'Switches still to retire' }].map((k) => (
              <Card key={k.l}><CardBody><div className="text-6xl font-bold text-teal-600 dark:text-teal-300"><AnimatedNumber value={k.v} format={k.f} /></div><div className="mt-2 text-slate-600 dark:text-slate-300">{k.l}</div></CardBody></Card>
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { v: d.migratedPct, f: (n: number) => `${n.toFixed(1)}%`, l: 'Lines migrated' },
              { v: d.switches.done, f: (n: number) => `${Math.round(n)} / ${d.switches.total}`, l: 'Switches retired' },
              { v: d.savingsRealized, f: fmtMoney, l: 'Savings realised to date' },
              { v: d.onTimePct, f: (n: number) => `${n.toFixed(1)}%`, l: 'On-time delivery' },
            ].map((k) => (
              <Card key={k.l}><CardBody><div className="text-5xl font-bold text-teal-600 dark:text-teal-300"><AnimatedNumber value={k.v} format={k.f} /></div><div className="mt-2 text-slate-600 dark:text-slate-300">{k.l}</div></CardBody></Card>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-4 gap-3">
            {AGENTS.map((a) => (
              <Card key={a.id}><CardBody className="text-sm"><div className="mb-1 flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-full" style={{ background: a.color }} />{a.name}</div><Badge tone={a.autonomy === 'Act-with-approval' ? 'amber' : a.autonomy === 'Recommend' ? 'teal' : 'blue'}>{a.autonomy}</Badge><p className="mt-2 line-clamp-4 text-slate-600 dark:text-slate-300">{a.role}</p></CardBody></Card>
            ))}
            <Link to="/agents" className="flex items-center justify-center"><Button variant="secondary">Open Agents <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link>
          </div>
        )}
        {step === 3 && (
          <Card><CardBody className="space-y-3">
            <p className="text-lg">“Rank our remaining central offices for retirement.”</p>
            <p className="text-slate-600 dark:text-slate-300">Priya Raman, VP Network Engineering, gets a ranked, explainable answer in seconds instead of six weeks.</p>
            <div className="flex gap-3"><Link to="/scenarios/A"><Button>Run Scenario A <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link><Button variant="secondary" onClick={() => setCopilotOpen(true)}><MessageSquare className="h-4 w-4" aria-hidden /> Ask the Copilot</Button></div>
          </CardBody></Card>
        )}
        {step === 4 && (
          <Card><CardBody className="space-y-3">
            <p className="text-lg">Azure OpenAI + AI Search + Fabric, wrapped in a human approval gateway. Read-only integration with the systems you already run.</p>
            <Link to="/architecture"><Button>View the architecture <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link>
          </CardBody></Card>
        )}
        {step === 5 && (
          <div className="grid grid-cols-[1fr_280px] gap-4">
            <Card><CardHeader><CardTitle>5-year value waterfall</CardTitle></CardHeader><CardBody className="h-72">
              <ResponsiveContainer><BarChart data={wf}><CartesianGrid stroke={t.grid} vertical={false} /><XAxis dataKey="name" stroke={t.axis} fontSize={11} interval={0} /><YAxis stroke={t.axis} fontSize={11} tickFormatter={(v) => fmtMoney(v, 0)} /><Tooltip contentStyle={t.tooltip} formatter={(_v, _n, p) => fmtMoney((p.payload as { value: number }).value)} /><Bar dataKey="range">{wf.map((w, i) => <Cell key={i} fill={w.value >= 0 ? '#14b8a6' : '#ef4444'} />)}</Bar></BarChart></ResponsiveContainer>
            </CardBody></Card>
            <Card><CardBody className="space-y-2"><div className="text-sm text-slate-500">5-yr NPV</div><div className="text-4xl font-bold text-teal-600 dark:text-teal-300">{fmtMoney(bc.npv)}</div><div className="text-sm text-slate-500">Payback</div><div className="text-2xl font-bold">{fmtMonths(bc.paybackMonths)}</div><Link to="/business-case"><Button variant="secondary" size="sm">Open model</Button></Link></CardBody></Card>
          </div>
        )}
        {step === 6 && (
          <div className="grid grid-cols-3 gap-4">
            {[{ h: 'Days 0–30', t: 'Discovery', b: 'Read-only extracts from OSS, BSS and CDRs. Reconcile and find hidden dependencies.' }, { h: 'Days 31–120', t: 'Pilot · 3 central offices', b: 'Thunder Bay, Kingston and one rural site. Measure planning time, incidents and churn.' }, { h: 'Months 5+', t: 'Scale', b: 'Roll out wave by wave with the same agents, approvals and audit trail.' }].map((p) => (
              <Card key={p.h}><CardBody><Badge tone="teal">{p.h}</Badge><h3 className="mt-2 text-xl font-bold">{p.t}</h3><p className="mt-1 text-slate-600 dark:text-slate-300">{p.b}</p></CardBody></Card>
            ))}
          </div>
        )}
      </div>

      {presenterNotes && (
        <Card className="mt-4 border-amber-400/60"><CardBody>
          <div className="mb-1 text-sm font-semibold">Presenter notes</div>
          <ul className="list-disc pl-5 text-slate-700 dark:text-slate-300">{STEPS[step].notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </CardBody></Card>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" size="lg" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" aria-hidden /> Back</Button>
        <Button size="lg" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Next <ArrowRight className="h-4 w-4" aria-hidden /></Button>
      </div>
    </div>
  )
}
