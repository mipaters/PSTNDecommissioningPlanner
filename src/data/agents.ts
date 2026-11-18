export type Autonomy = 'Assist' | 'Recommend' | 'Act-with-approval'

export interface AgentDef {
  id: string
  name: string
  short: string
  role: string
  inputs: string[]
  outputs: string[]
  autonomy: Autonomy
  color: string
  trace: string[]
}

export const AGENTS: AgentDef[] = [
  {
    id: 'discovery', name: 'Discovery Agent', short: 'Discover', color: '#14b8a6',
    role: 'Reconciles inventory, billing, provisioning and CDRs to find every live service per switch – including undocumented ones.',
    inputs: ['Switch inventory (OSS)', 'Billing extract (BSS)', 'Provisioning records', '90 days of CDRs'],
    outputs: ['Reconciled service register', 'Orphan / undocumented circuits', 'Confidence-scored findings'],
    autonomy: 'Recommend',
    trace: [
      'Loading switch inventory for Kingston – Princess St (DMS-100)… 36,412 lines',
      'Joining billing extract: 35,101 billed lines matched, 1,311 unmatched',
      'Streaming 90 days of CDRs from Event Hubs → Fabric OneLake (silver)',
      'Clustering unmatched lines by call pattern… 214 lines show periodic 24-hour dial-out',
      'Pattern matches alarm-panel supervisory signalling (confidence 0.96)',
      'Cross-referencing facilities register: 3 lines terminate in elevator machine rooms',
      'Flagging 214 alarm circuits + 3 elevator lines as life-safety, not in inventory',
      'Result: 217 undocumented services · 2 legacy interfaces · report ready for review',
    ],
  },
  {
    id: 'risk', name: 'Dependency & Risk Agent', short: 'Risk', color: '#f59e0b',
    role: 'Builds the dependency graph and scores each service for migration risk across life safety, regulatory, revenue and customer vulnerability.',
    inputs: ['Reconciled service register', 'Trunk & interconnect data', 'GIS coverage', 'Customer vulnerability flags'],
    outputs: ['Dependency graph', 'Per-service risk scores', 'Blocking-condition list'],
    autonomy: 'Recommend',
    trace: [
      'Building graph: switch → trunks → services → customers → OSS/BSS (Cosmos DB for Gremlin)',
      'Scoring 41,208 services on 4 dimensions: life-safety, regulatory, revenue, vulnerability',
      'Sudbury: 640 copper-only 911 access lines → life-safety score 94 (BLOCKING)',
      'Thunder Bay: 1 legacy toll-ticket feed → revenue score 41 (non-blocking)',
      'Propagating risk across shared trunks: 3 sites share a DS3 to the same tandem',
      'Result: 11 blocking conditions · 7 sites with shared-trunk coupling',
    ],
  },
  {
    id: 'sequencing', name: 'Sequencing Agent', short: 'Sequence', color: '#3b82f6',
    role: 'Optimises migration waves for savings, risk, crew capacity and regulatory notice windows.',
    inputs: ['Risk scores', 'Crew capacity', 'Budget cap', 'CRTC notice periods'],
    outputs: ['36-month wave plan', 'NPV / payback / risk metrics', 'Trade-off scenarios'],
    autonomy: 'Act-with-approval',
    trace: [
      'Loading 36 candidate sites, 5 crews, $90M budget cap',
      'Applying regulatory constraints: rural sites require 12-month notice',
      'Evaluating 2,400 candidate sequences (greedy + local search)',
      'Re-ordering to remove crew idle time in months 9–12',
      'Result: 27 sites in 36 months · Pareto-optimal on NPV vs. risk · plan ready for approval',
    ],
  },
  {
    id: 'customer', name: 'Customer Migration Agent', short: 'Customers', color: '#a855f7',
    role: 'Segments customers, recommends the target product, drafts personalised outreach and predicts churn.',
    inputs: ['Customer & usage data', 'Product catalogue', 'Coverage maps', 'Care interaction history'],
    outputs: ['Target product per customer', 'Outreach drafts', 'Churn predictions', 'Assisted-migration list'],
    autonomy: 'Act-with-approval',
    trace: [
      'Segmenting 18,400 remaining POTS customers on usage, tenure, device and coverage',
      'Recommending: VoLTE home phone 9,820 · fixed wireless 3,950 · SIP trunk 2,410 · Operator Connect 2,220',
      'Predicting churn: baseline 9.0% → 3.5% with assisted outreach',
      'Flagging 1,150 vulnerable / elderly customers (medical alert, TTY, age 75+) for assisted migration',
      'Drafting personalised outreach in English and French (large-print variant included)',
      'Result: 4 outreach templates · 1,150 assisted-migration cases queued for approval',
    ],
  },
  {
    id: 'regulatory', name: 'Regulatory Agent', short: 'Regulatory', color: '#ef4444',
    role: 'Tracks CRTC obligations, drafts notices, and checks 911 / NG9-1-1 and rural service compliance.',
    inputs: ['CRTC decisions & tariffs', 'NG9-1-1 tracker', 'Rural obligations register', 'Wave plan'],
    outputs: ['Obligation checklist', 'Draft CRTC notices', '911 continuity plan', 'Compliance gaps'],
    autonomy: 'Assist',
    trace: [
      'Indexing 214 CRTC decisions and tariff notices in Azure AI Search',
      'Tracing obligations for Thunder Bay: rural notice, 911 continuity, accessibility, wholesale',
      'Checking NG9-1-1 readiness: 3 of 5 PSAPs ready, 2 pending interconnect',
      'Drafting notice and 911 continuity plan (v1)',
      'Result: 100% of 38 obligations traced · 2 compliance gaps flagged · draft ready for Legal',
    ],
  },
  {
    id: 'cutover', name: 'Cutover Agent', short: 'Cutover', color: '#0ea5e9',
    role: 'Generates MOPs, rollback plans and test checklists, and produces a go/no-go readiness report.',
    inputs: ['Wave plan', 'Vendor docs', 'MOP library', 'Pre-check telemetry'],
    outputs: ['Method of procedure', 'Rollback plan', 'Test checklist', 'Go / no-go report'],
    autonomy: 'Act-with-approval',
    trace: [
      'Retrieving 12 similar DMS-100 cutover MOPs from Azure AI Search',
      'Generating MOP v1: 7 steps, 3 rollback points',
      'Injecting Kingston-specific steps: alarm-circuit dual-path, elevator-line witness test',
      'Running pre-checks: IMS registration 99.7%, SBC headroom 38%, CDR baseline captured',
      'Result: MOP v3 · go/no-go report: GO (12 of 12 checks green)',
    ],
  },
]
