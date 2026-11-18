import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip as LTooltip } from 'react-leaflet'
import { AlertTriangle, X } from 'lucide-react'
import { BAND_COLORS, COS, readinessBand } from '@/data/cos'
import { SEGMENTS, STICKY_LABELS, type CentralOffice, type StickyKey } from '@/data/types'
import { Badge, Button, Card, CardBody, PageHeader, Select } from '@/components/ui/ui'
import { annualSavings, buildPlan, DEFAULT_PARAMS, migrationCost } from '@/lib/planner'
import { fmtInt, fmtMoney } from '@/lib/format'
import { useNavigate } from 'react-router-dom'

function risksFor(c: CentralOffice): string[] {
  const out: { score: number; text: string }[] = []
  if (c.support === 'End of Support') out.push({ score: c.sparePartsRisk, text: `Vendor end-of-support; spare-parts risk ${c.sparePartsRisk}/100` })
  c.hidden.forEach((h) => out.push({ score: 80 + h.count / 10, text: `${h.title} (${h.count})` }))
  if (c.sticky.psap > 6) out.push({ score: 70, text: `${c.sticky.psap} 911 PSAP trunks must move to NG9-1-1 first` })
  if (c.rural) out.push({ score: 65, text: `Rural: ${fmtInt(c.sticky.ruralNoWireless)} lines with no wireless coverage; 12-month notice` })
  if (!c.ng911Ready) out.push({ score: 60, text: 'NG9-1-1 interconnect not yet verified' })
  out.push({ score: 40, text: `${fmtInt(c.sticky.alarm)} alarm panels and ${fmtInt(c.sticky.fire)} fire panels need re-homing` })
  out.push({ score: 35, text: `${100 - c.migratablePct}% of lines need assisted or special handling` })
  return out.sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.text)
}

export default function NetworkMap() {
  const [province, setProvince] = useState('All')
  const [sw, setSw] = useState('All')
  const [support, setSupport] = useState('All')
  const [band, setBand] = useState('All')
  const [sel, setSel] = useState<CentralOffice | null>(COS.find((c) => c.city === 'Thunder Bay') ?? null)
  const nav = useNavigate()
  const plan = useMemo(() => buildPlan(DEFAULT_PARAMS), [])

  const visible = COS.filter(
    (c) => (province === 'All' || c.province === province) && (sw === 'All' || c.switchType === sw) && (support === 'All' || c.support === support) && (band === 'All' || readinessBand(c.readiness) === band),
  )
  const item = sel ? plan.items.find((i) => i.co.id === sel.id) : undefined

  return (
    <div>
      <PageHeader title="Network Map" subtitle="Every central office coloured by the AI Decommission Readiness Score (0–100)." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select aria-label="Province" value={province} onChange={(e) => setProvince(e.target.value)}>
          {['All', 'ON', 'QC', 'BC', 'AB', 'SK', 'MB'].map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Select aria-label="Switch type" value={sw} onChange={(e) => setSw(e.target.value)}>
          {['All', 'Nortel DMS-100', 'Nortel DMS-250', 'Lucent 5ESS', 'Ericsson AXE-10'].map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Select aria-label="Vendor support" value={support} onChange={(e) => setSupport(e.target.value)}>
          {['All', 'Supported', 'Extended Support', 'End of Support'].map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Select aria-label="Readiness band" value={band} onChange={(e) => setBand(e.target.value)}>
          {['All', 'High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
        </Select>
        <span className="text-sm text-slate-500">{visible.length} of {COS.length} sites</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          {(['High', 'Medium', 'Low'] as const).map((b) => (
            <span key={b} className="flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ background: BAND_COLORS[b] }} />{b} (≥75 / 60–74 / &lt;60)</span>
          ))}
        </div>
      </div>
      <div className="flex gap-4" style={{ height: 'calc(100vh - 260px)', minHeight: 520 }}>
        <Card className="min-w-0 flex-1 overflow-hidden p-0">
          <MapContainer center={[50, -95]} zoom={4} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {visible.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lng]}
                radius={6 + Math.sqrt(c.totalLines / 1000) * 1.2}
                pathOptions={{ color: sel?.id === c.id ? '#fff' : '#0a1930', weight: sel?.id === c.id ? 3 : 1, fillColor: BAND_COLORS[readinessBand(c.readiness)], fillOpacity: c.status === 'Decommissioned' ? 0.35 : 0.85 }}
                eventHandlers={{ click: () => setSel(c) }}
              >
                <LTooltip>{c.city} · {c.readiness}/100{c.status === 'Decommissioned' ? ' · decommissioned' : ''}</LTooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </Card>
        {sel && (
          <Card className="w-[420px] shrink-0 overflow-y-auto">
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{sel.name}</h2>
                  <div className="text-sm text-slate-500">{sel.city}, {sel.province} · {sel.id}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSel(null)} aria-label="Close panel"><X className="h-4 w-4" /></Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-navy-950" style={{ background: BAND_COLORS[readinessBand(sel.readiness)] }}>{sel.readiness}</div>
                <div className="text-sm">
                  <div className="font-semibold">Readiness · {readinessBand(sel.readiness)}</div>
                  <div className="text-slate-500">AI rank #{sel.rank} of 42 · {sel.status}</div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Switch</dt><dd>{sel.switchType} ({sel.installYear})</dd>
                <dt className="text-slate-500">Vendor support</dt><dd><Badge tone={sel.support === 'End of Support' ? 'red' : sel.support === 'Extended Support' ? 'amber' : 'teal'}>{sel.support}</Badge></dd>
                <dt className="text-slate-500">Power / floor</dt><dd>{sel.powerKw} kW / {fmtInt(sel.floorSqFt)} sq ft</dd>
                <dt className="text-slate-500">Spare-parts risk</dt><dd>{sel.sparePartsRisk}/100</dd>
                <dt className="text-slate-500">Migratable lines</dt><dd>{sel.migratablePct}%</dd>
              </dl>
              <div>
                <h3 className="mb-1 text-sm font-semibold">Lines by segment · {fmtInt(sel.totalLines)} total</h3>
                {SEGMENTS.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-xs">
                    <span className="w-32 text-slate-500">{s.label}</span>
                    <div className="h-2 flex-1 rounded bg-slate-200 dark:bg-white/10"><div className="h-2 rounded bg-teal-500" style={{ width: `${(sel.lines[s.key] / sel.totalLines) * 100}%` }} /></div>
                    <span className="w-14 text-right tabular-nums">{fmtInt(sel.lines[s.key])}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold">Sticky / critical services</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(STICKY_LABELS) as StickyKey[]).filter((k) => sel.sticky[k] > 0).map((k) => (
                    <Badge key={k} tone={k === 'psap' || k === 'elevator' || k === 'fire' ? 'red' : 'slate'}>{STICKY_LABELS[k]}: {fmtInt(sel.sticky[k])}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-red-50 p-3 dark:bg-red-500/10"><div className="text-xs text-slate-500">Cost to keep (annual)</div><div className="text-xl font-bold">{fmtMoney(annualSavings(sel))}</div></div>
                <div className="rounded-xl bg-teal-50 p-3 dark:bg-teal-500/10"><div className="text-xs text-slate-500">Cost to migrate (one-time)</div><div className="text-xl font-bold">{fmtMoney(migrationCost(sel))}</div></div>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Recommended wave: </span>
                <strong>{sel.status === 'Decommissioned' ? 'Complete' : item && !item.deferred ? `Wave ${item.wave} (months ${item.start}–${item.end})` : 'Deferred beyond 36 months'}</strong>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold">Top 3 risks</h3>
                <ul className="space-y-1.5 text-sm">
                  {risksFor(sel).map((r) => <li key={r} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />{r}</li>)}
                </ul>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => nav(`/dependencies?co=${sel.id}`)}>Open dependency graph</Button>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
