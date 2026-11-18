import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Kpi, useChartTheme } from '@/components/Kpi'
import { Badge, Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui/ui'
import { dashboardData, MONTH_NOW } from '@/lib/dashboard'
import { MILESTONES } from '@/data/regulatory'
import { fmtInt, fmtMoney, fmtNum, fmtPct } from '@/lib/format'

const statusTone = { Complete: 'teal', 'On track': 'blue', 'At risk': 'amber', 'Not started': 'slate' } as const

export default function Dashboard() {
  const d = useMemo(dashboardData, [])
  const ct = useChartTheme()
  const planned = MONTH_NOW
  return (
    <div>
      <PageHeader title="Program Dashboard" subtitle={`Month ${planned} of 36 · tracking the PSTN/TDM decommissioning program against plan.`} />
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Switches decommissioned" value={`${d.switches.done} / ${d.switches.total}`} sub={`${fmtPct((d.switches.done / d.switches.total) * 100)} of footprint`} trend={{ dir: 'up', good: true, text: '+2 this quarter' }} target="8 by month 14" tone="warn" />
        <Kpi label="Lines migrated" value={fmtPct(d.migratedPct)} sub={`${fmtInt(d.migratedLines)} of ${fmtInt(d.totalLines)} lines`} trend={{ dir: 'up', good: true, text: '+1.8 pts vs. last month' }} target="21%" />
        <Kpi label="Annual opex savings (run-rate)" value={fmtMoney(d.savingsRealized)} sub={`Plan: ${fmtMoney(d.savingsPlan)}`} trend={{ dir: 'down', good: false, text: `${fmtPct((1 - d.savingsRealized / d.savingsPlan) * 100)} behind plan` }} target={fmtMoney(d.savingsPlanFull)} />
        <Kpi label="Power reduction" value={`${fmtInt(d.powerRemovedKw)} kW`} sub={`${fmtNum(d.powerMwhYr)} MWh/yr · ${fmtInt(d.co2Tonnes)} t CO₂e avoided`} trend={{ dir: 'up', good: true, text: 'On plan' }} target={`${fmtInt(d.powerPlanKw * 0.9)} kW`} />
        <Kpi label="Real estate freed" value={`${fmtNum(d.sqFtFreed)} sq ft`} sub={`Est. monetization ${fmtMoney(d.monetization)} (5 yr)`} trend={{ dir: 'up', good: true, text: '3 sites listed' }} target="500k sq ft" />
        <Card className="p-5">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Critical services at risk</div>
          <div className="mt-2 flex items-end gap-4">
            {[['Red', d.criticalAtRisk.red, 'text-red-500'], ['Amber', d.criticalAtRisk.amber, 'text-amber-500'], ['Green', d.criticalAtRisk.green, 'text-teal-500']].map(([l, v, c]) => (
              <div key={l as string}><div className={`text-4xl font-bold ${c}`}>{v as number}</div><div className="text-xs text-slate-500">{l}</div></div>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Red = life-safety dependency unresolved</div>
        </Card>
        <Kpi label="Churn on migrated lines" value={fmtPct(d.churnMigrated)} sub={`Baseline ${fmtPct(d.churnBaseline)}`} trend={{ dir: 'down', good: true, text: `−${fmtPct(d.churnBaseline - d.churnMigrated)} vs. baseline` }} target="≤ 4.0%" tone="good" />
        <Kpi label="Migration waves on time" value={fmtPct(d.onTimePct)} sub="11 of 12 wave milestones" trend={{ dir: 'flat', good: true, text: 'Steady' }} target="≥ 90%" tone="good" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader><CardTitle>Legacy line burndown – plan vs. actual vs. AI forecast</CardTitle></CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer>
              <LineChart data={d.burndown} margin={{ left: 10, right: 10 }}>
                <CartesianGrid stroke={ct.grid} />
                <XAxis dataKey="month" stroke={ct.axis} label={{ value: 'Month', position: 'insideBottom', offset: -2, fill: ct.axis }} />
                <YAxis stroke={ct.axis} tickFormatter={(v) => fmtNum(v)} />
                <Tooltip contentStyle={ct.tooltip} formatter={(v: number) => fmtInt(v)} labelFormatter={(m) => `Month ${m}`} />
                <Legend />
                <ReferenceLine x={MONTH_NOW} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Today', fill: '#f59e0b' }} />
                <Line name="Plan" dataKey="plan" stroke="#94a3b8" strokeDasharray="6 4" dot={false} strokeWidth={2} />
                <Line name="Actual" dataKey="actual" stroke="#14b8a6" dot={false} strokeWidth={3} />
                <Line name="AI forecast" dataKey="forecast" stroke="#3b82f6" dot={false} strokeWidth={3} strokeDasharray="2 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Savings ramp (run-rate, $M/yr)</CardTitle></CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer>
              <AreaChart data={d.savingsRamp}>
                <CartesianGrid stroke={ct.grid} />
                <XAxis dataKey="month" stroke={ct.axis} />
                <YAxis stroke={ct.axis} />
                <Tooltip contentStyle={ct.tooltip} formatter={(v: number) => `$${v.toFixed(1)}M`} />
                <Area name="Plan" dataKey="plan" stroke="#94a3b8" fill="#94a3b822" />
                <Area name="Actual" dataKey="actual" stroke="#14b8a6" fill="#14b8a655" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader><CardTitle>Segment mix – migrated vs. remaining lines</CardTitle></CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer>
              <BarChart data={d.segments} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke={ct.grid} horizontal={false} />
                <XAxis type="number" stroke={ct.axis} tickFormatter={(v) => fmtNum(v)} />
                <YAxis type="category" dataKey="name" stroke={ct.axis} width={130} />
                <Tooltip contentStyle={ct.tooltip} formatter={(v: number) => fmtInt(v)} />
                <Legend />
                <Bar name="Migrated" dataKey="migrated" stackId="a" fill="#14b8a6" />
                <Bar name="Remaining" dataKey="remaining" stackId="a" fill="#24457f" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Regulatory milestones</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {MILESTONES.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{m.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{m.authority} · due {m.due} · {m.note}</div>
                </div>
                <Badge tone={statusTone[m.status]}>{m.status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
