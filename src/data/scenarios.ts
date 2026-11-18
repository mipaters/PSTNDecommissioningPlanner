export type Visual = 'ranking' | 'hidden' | 'segments' | 'regulatory' | 'cases' | 'cutover' | 'none'

export interface ScenarioStep {
  title: string
  body: string
  visual: Visual
  agent?: string
}

export interface Scenario {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  title: string
  persona: string
  role: string
  before: { process: string; time: string; cost: string }
  after: { process: string; time: string; cost: string }
  steps: ScenarioStep[]
  kpis: { label: string; before: string; after: string }[]
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'A', title: 'Which switch do we kill first?', persona: 'Priya Raman', role: 'VP Network Engineering',
    before: { process: 'Spreadsheet-driven ranking across inventory, billing and vendor data; weeks of reconciliation and debate.', time: '6 weeks', cost: '≈ $240k analyst + consulting' },
    after: { process: 'Agents reconcile data, score every site and explain the ranking – engineers review and adjust.', time: '2 days', cost: '≈ $15k' },
    steps: [
      { title: 'Ask the question', body: '“Rank our remaining central offices for retirement.” The Discovery and Risk Agents pull inventory, billing, vendor-support and GIS data.', visual: 'none', agent: 'Discovery Agent' },
      { title: 'AI ranks every site', body: 'Each site is scored on readiness, avoidable cost and keep-risk. Thunder Bay – Red River comes out on top.', visual: 'ranking', agent: 'Sequencing Agent' },
      { title: 'Understand why', body: 'Thunder Bay: $2.1M/yr maintenance on an end-of-support DMS-100, 92% of lines already migratable, 97% VoLTE coverage and one minor hidden dependency.', visual: 'none', agent: 'Dependency & Risk Agent' },
      { title: 'Plan and commit', body: 'The recommendation flows into the Wave Planner: NPV improves by 18% against the manual plan.', visual: 'none' },
    ],
    kpis: [
      { label: 'Planning time', before: '6 weeks', after: '2 days' },
      { label: 'Plan NPV vs. manual plan', before: 'Baseline', after: '+18%' },
    ],
  },
  {
    id: 'B', title: 'Hidden dependency found', persona: 'Marcus Okafor', role: 'Senior Voice Architect',
    before: { process: 'Inventory trusted at face value; undocumented circuits discovered as customer outages after cutover.', time: 'Found post-cutover', cost: '≈ $1.8M incident cost / site' },
    after: { process: 'Discovery Agent reconciles CDRs against billing and inventory before cutover and routes findings to remediation.', time: 'Found 6 weeks pre-cutover', cost: '≈ $90k remediation' },
    steps: [
      { title: 'Kingston looks ready', body: 'Inventory says Kingston – Princess St is 94% migratable and ready for Wave 1.', visual: 'none' },
      { title: 'Discovery Agent reconciles CDRs', body: 'Unmatched lines with 24-hour periodic dial-outs reveal 214 alarm-panel circuits and 3 elevator lines that are in no inventory.', visual: 'hidden', agent: 'Discovery Agent' },
      { title: 'Risk re-scored', body: 'Life-safety exposure moves Kingston from “go” to “go after remediation”. A legacy provisioning gateway is also flagged.', visual: 'none', agent: 'Dependency & Risk Agent' },
      { title: 'Remediation path', body: 'Move alarm panels to LTE communicators with 90-day dual-path monitoring; witness-test the elevator lines; then cut over.', visual: 'none', agent: 'Cutover Agent' },
    ],
    kpis: [
      { label: 'Post-cutover incidents', before: 'Baseline', after: '−85%' },
      { label: 'Life-safety service outages', before: '2 per 10 sites', after: 'Zero' },
    ],
  },
  {
    id: 'C', title: 'Migrate the sticky customers', persona: 'Camille Tremblay', role: 'Customer Migration Lead',
    before: { process: 'Generic mailers and call-centre campaigns; one-size-fits-all offer; no way to find vulnerable customers.', time: '41% conversion', cost: '9% churn on migrated lines' },
    after: { process: 'Customer Migration Agent segments, recommends the right product, drafts personalised outreach and flags vulnerable customers.', time: '68% conversion', cost: '3.5% churn on migrated lines' },
    steps: [
      { title: 'Segment 18,400 POTS customers', body: 'The agent clusters customers by usage, tenure, devices and coverage.', visual: 'none', agent: 'Customer Migration Agent' },
      { title: 'Recommend the target product', body: 'VoLTE home phone, fixed wireless, SIP trunking or Operator Connect – chosen per customer, not per campaign.', visual: 'segments', agent: 'Customer Migration Agent' },
      { title: 'Draft personalised outreach', body: '“Hi Margaret, we’re upgrading your home phone line. Your new phone will use the same number and works during power outages for 8 hours.” Available in English, French and large print.', visual: 'none' },
      { title: 'Protect the vulnerable', body: '1,150 vulnerable or elderly customers (medical alert, TTY, age 75+) are routed to assisted migration with an in-home installer.', visual: 'none', agent: 'Customer Migration Agent' },
    ],
    kpis: [
      { label: 'Migration conversion', before: '41%', after: '68%' },
      { label: 'Churn on migrated lines', before: '9.0%', after: '3.5%' },
    ],
  },
  {
    id: 'D', title: 'Regulatory sign-off', persona: 'Elena Kowalski', role: 'Regulatory Affairs Director',
    before: { process: 'Lawyers and engineers assemble notices, 911 plans and obligation checklists by hand across spreadsheets.', time: '3 weeks / filing', cost: 'Obligations traced manually' },
    after: { process: 'Regulatory Agent traces every obligation, drafts the notice and 911 continuity plan, and flags gaps for humans to resolve.', time: '3 days / filing', cost: '100% obligations traced' },
    steps: [
      { title: 'Trace obligations', body: 'The agent indexes CRTC decisions, tariffs and the rural obligations register against the Thunder Bay retirement.', visual: 'regulatory', agent: 'Regulatory Agent' },
      { title: 'Draft the CRTC notice', body: 'A complete draft is produced with cited decisions, timelines and customer-notice plan.', visual: 'none', agent: 'Regulatory Agent' },
      { title: '911 continuity check', body: 'Two PSAPs still await NG9-1-1 interconnect – flagged as a gating item before any 911-capable line migrates.', visual: 'none' },
      { title: 'Human approval', body: 'Draft lands in the approval queue. Legal edits, approves and files – with a complete audit trail.', visual: 'none' },
    ],
    kpis: [
      { label: 'Filing preparation', before: '3 weeks', after: '3 days' },
      { label: 'Obligations traced', before: 'Manual / partial', after: '100%' },
    ],
  },
  {
    id: 'E', title: 'CFO business case', persona: 'David Chen', role: 'Chief Financial Officer',
    before: { process: 'One static spreadsheet; scenario changes take days and are hard to audit.', time: '2 weeks / revision', cost: 'Single scenario' },
    after: { process: 'Live model driven by the same data as the plan: aggressive, balanced and conservative cases in seconds.', time: 'Seconds', cost: '3 scenarios, tornado sensitivities' },
    steps: [
      { title: 'Three scenarios', body: 'Aggressive, balanced and conservative ramps are modelled on the same cost base.', visual: 'cases' },
      { title: 'Read the economics', body: 'NPV, IRR, payback, capex vs. opex, real-estate monetisation and carbon are computed together.', visual: 'none' },
      { title: 'Stress-test', body: 'Open the Business Case page to move maintenance, power, real estate, migration cost and churn and watch the tornado chart update.', visual: 'none' },
    ],
    kpis: [
      { label: 'Payback (aggressive)', before: 'Not modelled', after: '< 24 months' },
      { label: 'Power avoided (run-rate)', before: 'Not modelled', after: '≈ 38 GWh / yr' },
    ],
  },
  {
    id: 'F', title: 'Cutover night', persona: 'Sam Nguyen', role: 'Cutover Manager',
    before: { process: 'Word-document MOPs, manual pre-checks and a conference-bridge go/no-go.', time: '6.5 hours', cost: '≈ 6% rollback rate' },
    after: { process: 'Cutover Agent generates the MOP, runs pre-checks, drives a live checklist and validates after cutover.', time: '3.9 hours', cost: '< 2% rollback rate' },
    steps: [
      { title: 'Generate the MOP', body: 'MOP v3 for Kingston is assembled from the library with site-specific steps and rollback points.', visual: 'none', agent: 'Cutover Agent' },
      { title: 'Pre-checks and go / no-go', body: 'Telemetry checks run automatically. Click each item to confirm; the readiness verdict updates live.', visual: 'cutover', agent: 'Cutover Agent' },
      { title: 'Cut over and validate', body: 'Post-cutover: call completion rate 99.6%, 911 test calls 5 of 5 passed, 5,000 numbers ported cleanly.', visual: 'none' },
    ],
    kpis: [
      { label: 'Cutover duration', before: '6.5 h', after: '3.9 h (−40%)' },
      { label: 'Rollback rate', before: '≈ 6%', after: '< 2%' },
    ],
  },
]
