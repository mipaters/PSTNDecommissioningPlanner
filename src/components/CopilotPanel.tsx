import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Send, Sparkles, X } from 'lucide-react'
import { askCopilot } from '@/services/ai'
import { SUGGESTED_PROMPTS, type Block } from '@/data/copilot'
import { Button } from '@/components/ui/ui'
import { fmtNum } from '@/lib/format'

interface Msg { role: 'user' | 'assistant'; blocks: Block[]; sources: string[]; streaming?: boolean }

function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </p>
  )
}

function BlockView({ block }: { block: Block }) {
  if (block.type === 'text') return <Rich text={block.text} />
  if (block.type === 'table')
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-white/10">
            <tr>{block.columns.map((c) => <th key={c} className="px-2 py-1.5 font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-200 dark:border-white/10">
                {r.map((c, j) => <td key={j} className="px-2 py-1.5 align-top">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <div className="mb-1 text-xs font-semibold">{block.title}</div>
      <div className="h-36">
        <ResponsiveContainer>
          <BarChart data={block.data} margin={{ left: -10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => fmtNum(v)} />
            <Tooltip formatter={(v: number) => (block.unit === '$' ? `$${fmtNum(v)}` : fmtNum(v))} />
            <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function CopilotPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus(); return () => abortRef.current?.abort() }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function send(prompt: string) {
    const q = prompt.trim()
    if (!q || busy) return
    setInput('')
    setBusy(true)
    const ac = new AbortController()
    abortRef.current = ac
    setMessages((m) => [...m, { role: 'user', blocks: [{ type: 'text', text: q }], sources: [] }, { role: 'assistant', blocks: [], sources: [], streaming: true }])
    try {
      for await (const chunk of askCopilot(q, ac.signal)) {
        setMessages((m) => [...m.slice(0, -1), { role: 'assistant', blocks: chunk.blocks, sources: chunk.sources, streaming: !chunk.done }])
      }
    } finally {
      setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, streaming: false } : x)))
      setBusy(false)
    }
  }

  return (
    <aside aria-label="AI Copilot" className="flex w-[440px] shrink-0 flex-col border-l border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900">
      <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-white/10">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Sparkles className="h-5 w-5 text-teal-500" aria-hidden /> AI Copilot
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close copilot"><X className="h-4 w-4" /></Button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <div>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Ask about sites, risks, regulation or the business case. Answers cite the data they used.</p>
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button key={p} onClick={() => send(p)} className="w-full rounded-lg border border-slate-200 p-3 text-left text-sm hover:border-teal-500 hover:bg-teal-50 dark:border-white/10 dark:hover:bg-white/5">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-8 rounded-2xl rounded-br-sm bg-teal-600 px-4 py-2 text-sm text-white">{(m.blocks[0] as { text: string }).text}</div>
          ) : (
            <div key={i} className="space-y-2 rounded-2xl rounded-bl-sm bg-slate-100 p-3 dark:bg-white/5">
              {m.blocks.length === 0 && <p className="caret text-sm text-slate-500">Analysing data</p>}
              {m.blocks.map((b, j) => <BlockView key={j} block={b} />)}
              {m.sources.length > 0 && <p className="border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">Source: {m.sources.join(', ')}</p>}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>
      <form className="flex gap-2 border-t border-slate-200 p-3 dark:border-white/10" onSubmit={(e) => { e.preventDefault(); send(input) }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the copilot…"
          aria-label="Message to copilot"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-navy-950"
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </aside>
  )
}
