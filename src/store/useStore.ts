import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_PARAMS, type PlanParams } from '@/lib/planner'
import { DEFAULT_INPUTS, type BusinessInputs } from '@/lib/finance'

export interface SavedScenario { id: string; name: string; params: PlanParams }

export interface Approval {
  id: string
  agent: string
  title: string
  detail: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface AuditEntry { ts: string; actor: string; action: string; target: string }

const INITIAL_APPROVALS: Approval[] = [
  { id: 'A-1', agent: 'Regulatory Agent', title: 'File CRTC notice – Thunder Bay Red River', detail: 'Draft notice and 911 continuity plan ready; 12-month rural notice period applies.', status: 'pending' },
  { id: 'A-2', agent: 'Cutover Agent', title: 'Approve MOP v3 – Kingston DMS-100', detail: 'Includes 214 alarm-circuit remediation step and rollback at T+90 min.', status: 'pending' },
  { id: 'A-3', agent: 'Customer Migration Agent', title: 'Send outreach wave – 1,150 assisted-migration customers', detail: 'Phone-first outreach with in-home installer booking; large-print and TTY options.', status: 'pending' },
  { id: 'A-4', agent: 'Sequencing Agent', title: 'Adopt re-sequenced Wave 2', detail: 'Moves Regina ahead of Windsor; +$1.4M NPV, no added crew demand.', status: 'pending' },
]

interface State {
  carrier: string
  theme: 'dark' | 'light'
  presenterNotes: boolean
  copilotOpen: boolean
  walkthroughStep: number
  plan: PlanParams
  previousPlan: PlanParams | null
  planOptimized: boolean
  saved: SavedScenario[]
  business: BusinessInputs
  approvals: Approval[]
  audit: AuditEntry[]
  setCarrier: (n: string) => void
  toggleTheme: () => void
  setPresenterNotes: (v: boolean) => void
  setCopilotOpen: (v: boolean) => void
  setStep: (n: number) => void
  setPlan: (p: Partial<PlanParams>) => void
  markOptimized: () => void
  saveScenario: (name: string) => void
  removeScenario: (id: string) => void
  setBusiness: (b: Partial<BusinessInputs>) => void
  decide: (id: string, status: 'approved' | 'rejected', note?: string) => void
  editApproval: (id: string, detail: string) => void
  logAudit: (actor: string, action: string, target: string) => void
  reset: () => void
}

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

const initial = () => ({
  carrier: import.meta.env.VITE_CARRIER_NAME || 'Maple Telecom',
  presenterNotes: false,
  copilotOpen: false,
  walkthroughStep: 0,
  plan: { ...DEFAULT_PARAMS, priority: 'manual' as PlanParams['priority'] },
  previousPlan: null as PlanParams | null,
  planOptimized: false,
  saved: [] as SavedScenario[],
  business: { ...DEFAULT_INPUTS },
  approvals: INITIAL_APPROVALS.map((a) => ({ ...a })),
  audit: [{ ts: now(), actor: 'System', action: 'Demo session started', target: 'LegacyLift' }] as AuditEntry[],
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      theme: 'dark',
      setCarrier: (carrier) => set({ carrier }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setPresenterNotes: (presenterNotes) => set({ presenterNotes }),
      setCopilotOpen: (copilotOpen) => set({ copilotOpen }),
      setStep: (walkthroughStep) => set({ walkthroughStep }),
      setPlan: (p) => set((s) => ({ previousPlan: s.plan, plan: { ...s.plan, ...p } })),
      markOptimized: () => set({ planOptimized: true }),
      saveScenario: (name) =>
        set((s) => ({ saved: [...s.saved, { id: `S-${Date.now()}`, name, params: { ...s.plan } }].slice(-3) })),
      removeScenario: (id) => set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),
      setBusiness: (b) => set((s) => ({ business: { ...s.business, ...b } })),
      decide: (id, status, note) =>
        set((s) => {
          const a = s.approvals.find((x) => x.id === id)
          if (!a) return s
          return {
            approvals: s.approvals.map((x) => (x.id === id ? { ...x, status } : x)),
            audit: [{ ts: now(), actor: 'Demo user (Network Eng.)', action: `${status === 'approved' ? 'Approved' : 'Rejected'}${note ? ` – ${note}` : ''}`, target: a.title }, ...s.audit],
          }
        }),
      editApproval: (id, detail) =>
        set((s) => {
          const a = s.approvals.find((x) => x.id === id)
          return {
            approvals: s.approvals.map((x) => (x.id === id ? { ...x, detail } : x)),
            audit: [{ ts: now(), actor: 'Demo user (Network Eng.)', action: 'Edited agent output', target: a?.title ?? id }, ...s.audit],
          }
        }),
      logAudit: (actor, action, target) => set((s) => ({ audit: [{ ts: now(), actor, action, target }, ...s.audit] })),
      reset: () => {
        const keep = { theme: get().theme, carrier: get().carrier }
        set({ ...initial(), ...keep })
      },
    }),
    {
      name: 'legacylift-demo',
      partialize: (s) => ({ carrier: s.carrier, theme: s.theme }),
    },
  ),
)
