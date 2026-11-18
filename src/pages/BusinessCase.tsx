import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, Card, CardBody, CardHeader, CardTitle, PageHeader, Tabs } from '@/components/ui/ui'
import { Kpi, useChartTheme } from '@/components/Kpi'
import { buildBusinessCase, DEFAULT_INPUTS, RAMPS, tornado, type BusinessInputs } from '@/lib/finance'
import { fmtInt, fmtMoney, fmtMonths, fmtNum, fmtPct } from '@/lib/format'
import { useStore } from '@/store/useStore'

type RampKey = keyof typeof RAMPS

function Field({ label, value, onChange, step = 1, suffix }: { label: string; value: number; onChange: (v: number) => void; step?: number; suffix?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex items-center gap-2">
        <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 tabular-nums dark:border-white/20" />
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
      </div>
    </label>
  )
}

export default function BusinessCase() {
  const { business, setBusiness } = useStore()
  const t = useChartTheme()
  const bc = useMemo(() => buildBusinessCase(business), [business])
  const tor = useMemo(() => tornado(business), [business])
  const rampKey = (Object.keys(RAMPS) as RampKey[]).find((k) => RAMPS[k].every((v, i) => v === business.ramp[i])) ?? 'balanced'
  const set = (p: Partial<BusinessInputs>) => setBusiness(p)

  const wf = useMemo(() => {
    let run = 0
    return bc.waterfall.map((w) => {
      const start = run
      run += w.value
      return { name: w.name, range: [Math.min(start, run), Math.max(start, run)], value: w.value }
    })
  }, [bc])

  return (
    <div>
      <PageHeader title="Business Case" subtitle="Live 5-year model. All inputs are editable and are synthetic assumptions."
        actions={<Button variant="secondary" onClick={() => setBusiness({ ...DEFAULT_INPUTS })}>Reset assumptions</Button>} />
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="5-yr NPV" value={fmtMoney(bc.npv)} tone={bc.npv > 0 ? 'good' : 'bad'} animated={{ value: bc.npv, format: fmtMoney }} sub={`at ${fmtPct(business.discountRate * 100, 1)} discount rate`} />
        <Kpi label="IRR" value={fmtPct(bc.irr * 100)} animated={{ value: bc.irr * 100, format: (n) => fmtPct(n) }} />
        <Kpi label="Payback" value={fmtMonths(bc.paybackMonths)} animated={{ value: Number.isFinite(bc.paybackMonths) ? bc.paybackMonths : 0, format: fmtMonths }} />
        <Kpi label="Power avoided (5 yr)" value={`${fmtNum(bc.powerAvoidedGWh, 0)} GWh`} sub={`${fmtInt(bc.co2Tonnes)} t CO₂e · ${fmtInt(bc.sqFtFreed)} sq ft freed`} />
      </div>
      <div className="mt-4 grid grid-cols-[340px_1fr] gap-4">
        <Card>
          <CardHeader><CardTitle>Assumptions</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <div>
              <div className="mb-1 text-sm font-medium">Scenario ramp</div>
              <Tabs value={rampKey} onChange={(k) => set({ ramp: [...RAMPS[k]] })} items={[{ value: 'aggressive', label: 'Aggressive' }, { value: 'balanced', label: 'Balanced' }, { value: 'conservative', label: 'Conservative' }]} />
            </div>
            <Field label="Maintenance per switch" suffix="$/yr" step={50000} value={business.maintenancePerSwitch} onChange={(v) => set({ maintenancePerSwitch: v })} />
            <Field label="Site opex per switch" suffix="$/yr" step={50000} value={business.siteOpexPerSwitch} onChange={(v) => set({ siteOpexPerSwitch: v })} />
            <Field label="Power cost" suffix="$/kWh" step={0.01} value={business.powerCostPerKwh} onChange={(v) => set({ powerCostPerKwh: v })} />
            <Field label="Real estate" suffix="$/sq ft" value={business.realEstatePerSqFt} onChange={(v) => set({ realEstatePerSqFt: v })} />
            <Field label="Migration cost" suffix="$/line" value={business.migrationCostPerLine} onChange={(v) => set({ migrationCostPerLine: v })} />
            <Field label="Decommission cost" suffix="$/switch" step={50000} value={business.decomCostPerSwitch} onChange={(v) => set({ decomCostPerSwitch: v })} />
            <Field label="Churn on migrated lines" suffix="fraction" step={0.005} value={business.churnRate} onChange={(v) => set({ churnRate: v })} />
            <Field label="Discount rate" suffix="fraction" step={0.01} value={business.discountRate} onChange={(v) => set({ discountRate: v })} />
          </CardBody>
        </Card>
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Value waterfall (5 yr)</CardTitle></CardHeader>
              <CardBody className="h-72">
                <ResponsiveContainer>
                  <BarChart data={wf}>
                    <CartesianGrid stroke={t.grid} vertical={false} />
                    <XAxis dataKey="name" stroke={t.axis} fontSize={11} interval={0} />
                    <YAxis stroke={t.axis} fontSize={11} tickFormatter={(v) => fmtMoney(v, 0)} />
                    <Tooltip contentStyle={t.tooltip} formatter={(_v, _n, p) => fmtMoney((p.payload as { value: number }).value)} />
                    <ReferenceLine y={0} stroke={t.axis} />
                    <Bar dataKey="range">{wf.map((w, i) => <Cell key={i} fill={w.value >= 0 ? '#14b8a6' : '#ef4444'} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Sensitivity · NPV impact of ±20%</CardTitle></CardHeader>
              <CardBody className="h-72">
                <ResponsiveContainer>
                  <BarChart data={tor} layout="vertical" stackOffset="sign">
                    <CartesianGrid stroke={t.grid} horizontal={false} />
                    <XAxis type="number" stroke={t.axis} fontSize={11} tickFormatter={(v) => fmtMoney(v, 0)} />
                    <YAxis type="category" dataKey="label" stroke={t.axis} fontSize={11} width={130} />
                    <Tooltip contentStyle={t.tooltip} formatter={(v: number) => fmtMoney(v)} />
                    <ReferenceLine x={0} stroke={t.axis} />
                    <Bar dataKey="low" stackId="s" fill="#ef4444" name="Downside" />
                    <Bar dataKey="high" stackId="s" fill="#14b8a6" name="Upside" />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Annual cash flow</CardTitle></CardHeader>
            <CardBody>
              <table className="w-full text-right text-sm tabular-nums">
                <thead className="text-slate-500"><tr><th className="text-left">Year</th><th>Run-rate reached</th><th>Opex savings</th><th>Power</th><th>Real estate</th><th>Churn loss</th><th>Capex</th><th>Net</th><th>Cumulative</th></tr></thead>
                <tbody>
                  {bc.rows.map((r) => (
                    <tr key={r.year} className="border-t border-slate-100 dark:border-white/5">
                      <td className="py-1 text-left">{r.year === 0 ? 'Year 0' : `Year ${r.year}`}</td><td>{fmtPct(r.fraction * 100, 0)}</td><td>{fmtMoney(r.opexSavings)}</td><td>{fmtMoney(r.powerSavings)}</td>
                      <td>{fmtMoney(r.realEstate)}</td><td>{fmtMoney(-r.churnLoss)}</td><td>{fmtMoney(-r.capex)}</td><td className="font-semibold">{fmtMoney(r.net)}</td><td>{fmtMoney(r.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
