import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from 'reactflow'
import { Sparkles } from 'lucide-react'
import { COS } from '@/data/cos'
import { STICKY_LABELS, type CentralOffice, type StickyKey } from '@/data/types'
import { Badge, Card, CardBody, PageHeader, Select } from '@/components/ui/ui'
import { fmtInt } from '@/lib/format'
import { useStore } from '@/store/useStore'

const COLX = [0, 300, 620, 940, 1240]

function nodeStyle(bg: string, border: string, glow?: boolean): React.CSSProperties {
  return { background: bg, color: '#0f172a', border: `2px solid ${border}`, borderRadius: 12, padding: 8, fontSize: 12, width: 220, textAlign: 'center', boxShadow: glow ? '0 0 16px 4px rgba(245,158,11,0.75)' : undefined }
}

function buildGraph(c: CentralOffice, dark: boolean) {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const edge = (a: string, b: string, hidden = false): Edge => ({
    id: `${a}-${b}`, source: a, target: b, animated: hidden,
    style: { stroke: hidden ? '#f59e0b' : dark ? '#64748b' : '#94a3b8', strokeWidth: hidden ? 2.5 : 1.5, strokeDasharray: hidden ? '6 4' : undefined },
    markerEnd: { type: MarkerType.ArrowClosed, color: hidden ? '#f59e0b' : '#64748b' },
  })
  const col = (list: { id: string; label: string; style: React.CSSProperties }[], x: number) => {
    const gap = 78
    const top = -((list.length - 1) * gap) / 2
    list.forEach((n, i) => nodes.push({ id: n.id, position: { x, y: top + i * gap }, data: { label: n.label }, style: n.style, draggable: true }))
  }

  col([{ id: 'sw', label: `${c.switchType}\n${c.name}\n${fmtInt(c.totalLines)} lines`, style: { ...nodeStyle('#14b8a6', '#0f766e'), whiteSpace: 'pre-line', fontWeight: 700 } }], COLX[0])
  const trunks = c.trunks.map((t, i) => ({ id: `tr${i}`, label: `${t.kind} trunks\n${t.partner} · ${t.ds1} DS1`, style: { ...nodeStyle('#dbeafe', '#3b82f6'), whiteSpace: 'pre-line' } }))
  col(trunks, COLX[1])
  trunks.forEach((t) => edges.push(edge('sw', t.id)))

  const stickyKeys = (Object.keys(STICKY_LABELS) as StickyKey[]).filter((k) => c.sticky[k] > 0 && k !== 'ruralNoWireless')
  const hiddenServices = c.hidden.filter((h) => h.kind !== 'billing' && h.kind !== 'provisioning')
  const services = [
    ...stickyKeys.map((k) => ({ id: `sv-${k}`, label: `${STICKY_LABELS[k]}\n${fmtInt(c.sticky[k])}`, style: { ...nodeStyle(k === 'psap' || k === 'elevator' || k === 'fire' ? '#fee2e2' : '#f1f5f9', k === 'psap' || k === 'elevator' || k === 'fire' ? '#ef4444' : '#94a3b8'), whiteSpace: 'pre-line' as const } })),
    ...hiddenServices.map((h) => ({ id: `h-${h.id}`, label: `⚠ ${h.title}\n${fmtInt(h.count)} · AI discovered`, style: { ...nodeStyle('#fef3c7', '#f59e0b', true), whiteSpace: 'pre-line' as const } })),
  ]
  col(services, COLX[2])
  const trunkFor: Partial<Record<StickyKey, string>> = { psap: 'tr1', gov: 'tr3', fax: 'tr0', atm: 'tr0', alarm: 'tr0', elevator: 'tr0', fire: 'tr0', tty: 'tr0' }
  stickyKeys.forEach((k) => edges.push(edge(trunkFor[k] ?? 'tr0', `sv-${k}`)))
  hiddenServices.forEach((h) => edges.push(edge('sw', `h-${h.id}`, true)))

  const customers = [
    { id: 'cu-res', label: 'Residential customers', style: nodeStyle('#ecfdf5', '#10b981') },
    { id: 'cu-bus', label: 'Business & Centrex', style: nodeStyle('#ecfdf5', '#10b981') },
    { id: 'cu-gov', label: 'Government & utilities', style: nodeStyle('#ecfdf5', '#10b981') },
    { id: 'cu-whl', label: 'Wholesale carriers', style: nodeStyle('#ecfdf5', '#10b981') },
    { id: 'cu-vul', label: 'Vulnerable customers\n(medical alert, TTY, 75+)', style: { ...nodeStyle('#fee2e2', '#ef4444'), whiteSpace: 'pre-line' as const } },
  ]
  col(customers, COLX[3])
  const link = (svc: string, cu: string) => nodes.some((n) => n.id === svc) && edges.push(edge(svc, cu))
  ;['alarm', 'fire', 'elevator', 'fax', 'atm'].forEach((k) => { link(`sv-${k}`, 'cu-bus') })
  link('sv-alarm', 'cu-res'); link('sv-psap', 'cu-res'); link('sv-psap', 'cu-vul'); link('sv-tty', 'cu-vul'); link('sv-gov', 'cu-gov'); link('sv-elevator', 'cu-gov')
  link('sv-ruralNoWireless', 'cu-vul')
  hiddenServices.forEach((h) => { link(`h-${h.id}`, h.kind === 'ruralNoWireless' ? 'cu-vul' : 'cu-bus') })
  edges.push(edge('tr2', 'cu-whl'))

  const hiddenSys = c.hidden.filter((h) => h.kind === 'billing' || h.kind === 'provisioning')
  const systems = [
    { id: 'sy-bill', label: 'Billing (BSS)', style: nodeStyle('#ede9fe', '#8b5cf6') },
    { id: 'sy-prov', label: 'Provisioning', style: nodeStyle('#ede9fe', '#8b5cf6') },
    { id: 'sy-lnp', label: 'Number portability', style: nodeStyle('#ede9fe', '#8b5cf6') },
    { id: 'sy-oss', label: 'Assurance / OSS', style: nodeStyle('#ede9fe', '#8b5cf6') },
    ...hiddenSys.map((h) => ({ id: `h-${h.id}`, label: `⚠ ${h.title}\nAI discovered`, style: { ...nodeStyle('#fef3c7', '#f59e0b', true), whiteSpace: 'pre-line' as const } })),
  ]
  col(systems, COLX[4])
  ;['cu-res', 'cu-bus', 'cu-gov', 'cu-whl'].forEach((cu) => edges.push(edge(cu, 'sy-bill')))
  edges.push(edge('cu-res', 'sy-prov'), edge('cu-bus', 'sy-prov'), edge('cu-res', 'sy-lnp'), edge('cu-bus', 'sy-lnp'), edge('cu-vul', 'sy-oss'), edge('cu-gov', 'sy-oss'))
  hiddenSys.forEach((h) => edges.push(edge('sw', `h-${h.id}`, true)))
  return { nodes, edges }
}

export default function Dependencies() {
  const [params, setParams] = useSearchParams()
  const dark = useStore((s) => s.theme) === 'dark'
  const [coId, setCoId] = useState(params.get('co') ?? COS.find((c) => c.city === 'Kingston')!.id)
  const [picked, setPicked] = useState<string | null>(null)
  const co = COS.find((c) => c.id === coId)!
  const { nodes, edges } = useMemo(() => buildGraph(co, dark), [co, dark])
  useEffect(() => { setPicked(null) }, [coId])
  const hidden = co.hidden.find((h) => `h-${h.id}` === picked)

  return (
    <div>
      <PageHeader
        title="Dependency Explorer"
        subtitle="Switch → trunks → services → customers → OSS/BSS. Glowing amber nodes are hidden dependencies the AI discovered."
        actions={
          <Select aria-label="Central office" value={coId} onChange={(e) => { setCoId(e.target.value); setParams({ co: e.target.value }) }}>
            {COS.map((c) => <option key={c.id} value={c.id}>{c.name}{c.hidden.length ? ` · ${c.hidden.length} hidden` : ''}</option>)}
          </Select>
        }
      />
      <div className="flex gap-4" style={{ height: 'calc(100vh - 230px)', minHeight: 520 }}>
        <Card className="min-w-0 flex-1 overflow-hidden p-0">
          <ReactFlow
            key={co.id}
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            nodesConnectable={false}
            onNodeClick={(_, n) => setPicked(n.id)}
            minZoom={0.2}
          >
            <Background color={dark ? '#24457f' : '#cbd5e1'} gap={20} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </Card>
        <Card className="w-[380px] shrink-0 overflow-y-auto">
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-amber-500" aria-hidden /> Hidden dependencies ({co.hidden.length})</div>
            {co.hidden.length === 0 && <p className="text-sm text-slate-500">No undocumented dependencies found at this site. Try Kingston, Sudbury, Thunder Bay or Windsor.</p>}
            {co.hidden.map((h) => (
              <button key={h.id} onClick={() => setPicked(`h-${h.id}`)} className={`w-full rounded-xl border p-3 text-left text-sm transition ${hidden?.id === h.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-slate-200 dark:border-white/10'}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">{h.title}</span><Badge tone="amber">{fmtInt(h.count)}</Badge></div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{h.detail}</p>
                {hidden?.id === h.id && (
                  <div className="mt-2 space-y-1 border-t border-amber-300/50 pt-2 text-xs">
                    <div><strong>Discovered by:</strong> {h.discoveredBy}</div>
                    <div><strong>Remediation:</strong> {h.remediation}</div>
                  </div>
                )}
              </button>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
