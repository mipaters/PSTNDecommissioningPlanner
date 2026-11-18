import { useRef, useState } from 'react'
import { Check, Loader2, Pencil, Play, ShieldCheck, X } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui/ui'
import { AGENTS, type Autonomy } from '@/data/agents'
import { streamLines } from '@/services/ai'
import { useStore } from '@/store/useStore'

const AUTONOMY_TONE: Record<Autonomy, 'blue' | 'amber' | 'teal'> = { Assist: 'blue', Recommend: 'teal', 'Act-with-approval': 'amber' }

export default function Agents() {
  const { approvals, audit, decide, editApproval, logAudit } = useStore()
  const [traces, setTraces] = useState<Record<string, string[]>>({})
  const [running, setRunning] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const abort = useRef<AbortController | null>(null)

  async function run(id: string) {
    const agent = AGENTS.find((a) => a.id === id)!
    abort.current?.abort()
    abort.current = new AbortController()
    setRunning(id)
    setTraces((t) => ({ ...t, [id]: [] }))
    for await (const line of streamLines(agent.trace, 380, abort.current.signal)) setTraces((t) => ({ ...t, [id]: [...(t[id] ?? []), line] }))
    logAudit(agent.name, 'Completed run', agent.outputs[0])
    setRunning(null)
  }

  const pending = approvals.filter((a) => a.status === 'pending').length

  return (
    <div>
      <PageHeader title="Agents" subtitle="Seven specialised agents. Autonomy is bounded: nothing consequential happens without a human decision." />
      <div className="grid grid-cols-[1fr_420px] gap-4">
        <div className="grid grid-cols-2 gap-4">
          {AGENTS.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: a.color }} />{a.name}</CardTitle>
                <Badge tone={AUTONOMY_TONE[a.autonomy]}>{a.autonomy}</Badge>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                <p className="text-slate-700 dark:text-slate-300">{a.role}</p>
                <div><strong>Inputs:</strong> <span className="text-slate-600 dark:text-slate-300">{a.inputs.join(' · ')}</span></div>
                <div><strong>Outputs:</strong> <span className="text-slate-600 dark:text-slate-300">{a.outputs.join(' · ')}</span></div>
                <Button size="sm" variant="secondary" onClick={() => run(a.id)} disabled={running !== null}>
                  {running === a.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />} Run agent
                </Button>
                {traces[a.id] && (
                  <div className="max-h-44 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
                    {traces[a.id].map((l, i) => <div key={i}><span className="text-teal-400">▸</span> {l}</div>)}
                    {running === a.id && <div className="caret text-slate-400">working</div>}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle><ShieldCheck className="mr-2 inline h-4 w-4 text-teal-500" aria-hidden />Approval queue</CardTitle><Badge tone={pending ? 'amber' : 'teal'}>{pending} pending</Badge></CardHeader>
            <CardBody className="space-y-3">
              {approvals.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold">{a.title}</div>
                    <Badge tone={a.status === 'approved' ? 'teal' : a.status === 'rejected' ? 'red' : 'amber'}>{a.status}</Badge>
                  </div>
                  <div className="text-xs text-slate-500">{a.agent}</div>
                  {editing === a.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Edit proposal" className="w-full rounded border border-slate-300 bg-transparent p-2 text-sm dark:border-white/20" rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { editApproval(a.id, draft); setEditing(null) }}>Save edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{a.detail}</p>
                  )}
                  {a.status === 'pending' && editing !== a.id && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => decide(a.id, 'approved')}><Check className="h-4 w-4" aria-hidden /> Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => decide(a.id, 'rejected')}><X className="h-4 w-4" aria-hidden /> Reject</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setEditing(a.id); setDraft(a.detail) }}><Pencil className="h-4 w-4" aria-hidden /> Edit</Button>
                    </div>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Audit trail</CardTitle></CardHeader>
            <CardBody className="max-h-72 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500"><tr><th className="pb-1">Time</th><th>Actor</th><th>Action</th></tr></thead>
                <tbody>
                  {audit.map((e, i) => (
                    <tr key={i} className="border-t border-slate-100 align-top dark:border-white/5"><td className="py-1 pr-2 tabular-nums">{e.ts.slice(11)}</td><td className="pr-2 font-medium">{e.actor}</td><td>{e.action} · <span className="text-slate-500">{e.target}</span></td></tr>
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
