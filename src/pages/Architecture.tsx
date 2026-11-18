import { useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from 'reactflow'
import { Card, CardBody, PageHeader } from '@/components/ui/ui'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

interface Box { id: string; label: string; layer: number; col: number; tip: string; existing?: boolean }

const LAYERS = ['Experience', 'Agent orchestration', 'Intelligence & grounding', 'Data platform', 'Sources of record']
const BOXES: Box[] = [
  { id: 'ui', label: 'LegacyLift web app', layer: 0, col: 1, tip: 'React SPA hosted on Azure Static Web Apps; Entra ID for sign-in.' },
  { id: 'teams', label: 'Teams / M365 Copilot', layer: 0, col: 3, tip: 'Optional entry point for the Copilot experience.', existing: true },
  { id: 'orch', label: 'Agent orchestrator', layer: 1, col: 0, tip: 'Routes tasks to the seven agents, enforces autonomy levels and writes the audit trail.' },
  { id: 'hitl', label: 'Human approval gateway', layer: 1, col: 2, tip: 'Every Act-with-approval step waits for a named approver.' },
  { id: 'agents', label: '7 specialist agents', layer: 1, col: 4, tip: 'Discovery, Risk, Sequencing, Regulatory, Customer Migration, Cutover, Finance.' },
  { id: 'aoai', label: 'Azure OpenAI', layer: 2, col: 0, tip: 'Reasoning and drafting. Calls are stubbed in this demo (src/services/ai.ts).' },
  { id: 'search', label: 'Azure AI Search (RAG)', layer: 2, col: 2, tip: 'Grounds answers in CRTC decisions, tariffs, vendor bulletins and MOPs.' },
  { id: 'rai', label: 'Content Safety & guardrails', layer: 2, col: 4, tip: 'Policy checks, PII redaction and prompt-injection defence.' },
  { id: 'fabric', label: 'Microsoft Fabric OneLake', layer: 3, col: 1, tip: 'Bronze/silver/gold lakehouse for inventory, billing and CDR data.' },
  { id: 'eh', label: 'Event Hubs (CDR stream)', layer: 3, col: 3, tip: 'Streams call detail records for hidden-dependency discovery.' },
  { id: 'oss', label: 'OSS / inventory', layer: 4, col: 0, tip: 'Switch and network inventory.', existing: true },
  { id: 'bss', label: 'BSS / billing', layer: 4, col: 1.5, tip: 'Customer, product and billing records.', existing: true },
  { id: 'prov', label: 'Provisioning', layer: 4, col: 3, tip: 'Order and provisioning systems, including legacy gateways.', existing: true },
  { id: 'gis', label: 'GIS & facilities', layer: 4, col: 4.5, tip: 'Site, coverage and facilities data.', existing: true },
]
const LINKS: [string, string][] = [
  ['ui', 'orch'], ['teams', 'orch'], ['orch', 'hitl'], ['orch', 'agents'], ['agents', 'aoai'], ['agents', 'search'], ['agents', 'rai'],
  ['aoai', 'fabric'], ['search', 'fabric'], ['search', 'eh'], ['fabric', 'oss'], ['fabric', 'bss'], ['eh', 'prov'], ['fabric', 'gis'],
]

export default function Architecture() {
  const dark = useStore((s) => s.theme) === 'dark'
  const [existing, setExisting] = useState(false)
  const [hover, setHover] = useState<Box | null>(null)

  const nodes: Node[] = useMemo(() => BOXES.map((b) => {
    const hi = existing && b.existing
    return {
      id: b.id, position: { x: b.col * 220, y: b.layer * 120 }, data: { label: b.label }, draggable: false,
      style: { width: 190, fontSize: 13, fontWeight: 600, borderRadius: 10, padding: 8, color: dark ? '#e2e8f0' : '#0f172a',
        background: hi ? '#0d9488' : dark ? '#10294f' : '#fff', border: `2px solid ${hi ? '#5eead4' : dark ? '#334e7a' : '#94a3b8'}`, ...(hi ? { color: '#fff' } : {}) },
    }
  }), [existing, dark])
  const edges: Edge[] = useMemo(() => LINKS.map(([s, t]) => ({ id: `${s}-${t}`, source: s, target: t, animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: dark ? '#64748b' : '#94a3b8' } })), [dark])

  return (
    <div>
      <PageHeader title="Architecture" subtitle="Azure-native reference architecture. Hover a component for details." />
      <div className="mb-3 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={existing} onChange={(e) => setExisting(e.target.checked)} className="h-4 w-4 accent-teal-600" />
          Integrates with existing platform (highlight systems you already own)
        </label>
        <div className="flex gap-3 text-xs text-slate-500">{LAYERS.map((l, i) => <span key={l}>{i + 1}. {l}</span>)}</div>
      </div>
      <div className="grid grid-cols-[1fr_300px] gap-4">
        <Card><CardBody className="h-[640px] p-0">
          <ReactFlow nodes={nodes} edges={edges} fitView nodesConnectable={false} onNodeMouseEnter={(_, n) => setHover(BOXES.find((b) => b.id === n.id) ?? null)} onNodeMouseLeave={() => setHover(null)} proOptions={{ hideAttribution: true }}>
            <Background /><Controls showInteractive={false} />
          </ReactFlow>
        </CardBody></Card>
        <Card><CardBody className="text-sm">
          <h3 className="mb-2 font-semibold">{hover?.label ?? 'Component details'}</h3>
          <p className={cn(hover ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500')}>{hover?.tip ?? 'Hover over a node.'}</p>
          <h3 className="mb-1 mt-6 font-semibold">Design principles</h3>
          <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
            <li>Read-only integration with systems of record</li>
            <li>Humans approve every consequential action</li>
            <li>Every agent step is logged and explainable</li>
            <li>Canadian data residency (Azure Canada Central/East)</li>
          </ul>
        </CardBody></Card>
      </div>
    </div>
  )
}
