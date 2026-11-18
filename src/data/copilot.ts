import { COS, REMAINING_COS } from './cos'
import { STICKY_LABELS } from './types'
import { buildPlan, DEFAULT_PARAMS, annualSavings } from '@/lib/planner'
import { fmtInt, fmtMoney, fmtSigned } from '@/lib/format'

export type Block =
  | { type: 'text'; text: string }
  | { type: 'table'; columns: string[]; rows: (string | number)[][] }
  | { type: 'chart'; title: string; data: { name: string; value: number }[]; unit: string }

export interface CopilotAnswer {
  blocks: Block[]
  sources: string[]
}

export const SUGGESTED_PROMPTS = [
  'Which 5 COs should we retire first and why?',
  'What customers in Sudbury still depend on copper for 911 access?',
  'What happens to the business case if we delay Wave 3 by 6 months?',
  'Draft the CRTC notification for the Thunder Bay CO retirement',
  'Generate the method of procedure for cutting over the Kingston DMS-100',
]

const ranked = () => [...REMAINING_COS].sort((a, b) => b.aiScore - a.aiScore)
const find = (city: string) => COS.find((c) => c.city === city)!

function topFive(): CopilotAnswer {
  const top = ranked().slice(0, 5)
  return {
    blocks: [
      { type: 'text', text: `I scored all ${REMAINING_COS.length} remaining central offices on readiness (40%), annual avoidable cost (35%) and keep-risk from vendor end-of-support and spare parts (25%). Retire these five first:` },
      {
        type: 'table',
        columns: ['#', 'Central office', 'AI score', 'Annual savings', 'Readiness', 'Vendor status'],
        rows: top.map((c, i) => [i + 1, c.name, c.aiScore.toFixed(1), fmtMoney(annualSavings(c)), `${c.readiness}/100`, c.support]),
      },
      { type: 'chart', title: 'Annual avoidable cost by site (CAD)', unit: '$', data: top.map((c) => ({ name: c.city, value: Math.round(annualSavings(c)) })) },
      { type: 'text', text: `**${top[0].city}** leads: ${fmtMoney(top[0].maintenanceCost)}/yr maintenance on an end-of-support ${top[0].switchType}, ${top[0].migratablePct}% of lines already migratable, and ${top[0].imsCoverage}% IMS/VoLTE coverage. Rural sites need a 12-month notice period, so filing should start now.` },
    ],
    sources: ['CO inventory', 'Billing extract', 'Vendor support data', 'GIS coverage'],
  }
}

function sudbury(): CopilotAnswer {
  const s = find('Sudbury')
  const h = s.hidden[0]
  return {
    blocks: [
      { type: 'text', text: `**${h.count} customers** served from ${s.name} still depend on copper for 911 access because wireless coverage is unreliable. The Dependency & Risk Agent found them by joining line records with GIS coverage maps.` },
      {
        type: 'table',
        columns: ['Corridor', 'Customers', 'Copper 911 dependency', 'Recommended path'],
        rows: [
          ['Lively', 214, 'Yes – no LTE indoors', 'Fixed-wireless voice + 8h battery'],
          ['Capreol', 188, 'Yes – no LTE', 'VoIP ATA with 8h battery, retain copper until NG9-1-1 verified'],
          ['Hanmer', 142, 'Partial', 'Fixed-wireless voice, antenna survey'],
          ['Azilda / Chelmsford', 96, 'Partial', 'VoLTE home phone'],
        ],
      },
      { type: 'text', text: `${s.sticky.psap} PSAP trunks and ${fmtInt(s.sticky.ruralNoWireless)} rural lines with no wireless coverage are also tied to this switch. Recommendation: hold Sudbury out of the first two waves until NG9-1-1 call routing and battery-backed endpoints are verified.` },
    ],
    sources: ['Line records', 'GIS coverage map', 'PSAP trunk inventory', 'NG9-1-1 readiness tracker'],
  }
}

function delayWave3(): CopilotAnswer {
  const base = buildPlan(DEFAULT_PARAMS)
  const delayed = buildPlan({ ...DEFAULT_PARAMS, delayWave3Months: 6 })
  const dn = delayed.metrics.npv - base.metrics.npv
  const dp = delayed.metrics.paybackMonths - base.metrics.paybackMonths
  const moved = base.items.filter((i) => i.wave === 3 && !i.deferred).length
  return {
    blocks: [
      { type: 'text', text: `Delaying Wave 3 by six months pushes ${moved} sites later, and cascades into crew availability for Wave 4.` },
      {
        type: 'table',
        columns: ['Metric', 'Current plan', 'Wave 3 +6 months', 'Delta'],
        rows: [
          ['5-yr NPV', fmtMoney(base.metrics.npv), fmtMoney(delayed.metrics.npv), fmtSigned(dn, fmtMoney)],
          ['Payback', `${base.metrics.paybackMonths.toFixed(1)} mo`, `${delayed.metrics.paybackMonths.toFixed(1)} mo`, `${dp >= 0 ? '+' : '−'}${Math.abs(dp).toFixed(1)} mo`],
          ['COs retired in 36 mo', base.metrics.completed, delayed.metrics.completed, delayed.metrics.completed - base.metrics.completed],
          ['Steady-state savings', fmtMoney(base.metrics.steadySavings), fmtMoney(delayed.metrics.steadySavings), fmtSigned(delayed.metrics.steadySavings - base.metrics.steadySavings, fmtMoney)],
        ],
      },
      { type: 'text', text: 'The Sequencing Agent suggests back-filling the gap with two low-risk Wave 4 sites rather than leaving crews idle. Use the Wave Planner to model it.' },
    ],
    sources: ['Wave Planner model', 'Crew capacity plan', 'Finance model (8% discount rate)'],
  }
}

function crtc(): CopilotAnswer {
  const t = find('Thunder Bay')
  return {
    blocks: [
      { type: 'text', text: `**DRAFT – for Regulatory Affairs review**\n\n**Subject: Notice of planned retirement of legacy TDM switching – ${t.name}, ${t.city}, Ontario**\n\nTo: Secretary General, CRTC\n\n1. **Summary.** The carrier intends to retire the ${t.switchType} serving ${fmtInt(t.totalLines)} access lines, with service migrated to IMS-based voice. The vendor ended support for this platform and spare parts are no longer reliably available.\n2. **Timeline.** Customer notices begin at T-12 months (rural notice period). Migration cutovers are planned over ${Math.ceil(t.totalLines / 8000)} months, followed by decommissioning.\n3. **911 continuity.** All ${t.sticky.psap} PSAP trunks will be cut over to NG9-1-1 interconnection before any 911-capable line is migrated. Test calls will be placed to every PSAP, with rollback on any failure.\n4. **Customers with special needs.** Customers with TTY, medical alert, or alarm services will receive assisted migration and a dual-path period.\n5. **Rural service obligations.** Coverage analysis shows ${t.imsCoverage}% VoLTE availability; remaining premises will be offered fixed-wireless voice with battery backup.\n\nSigned: Director, Regulatory Affairs` },
      { type: 'text', text: 'Open items before filing: confirm PSAP concurrence letters (2 of 5 received) and attach the coverage maps.' },
    ],
    sources: ['CRTC decisions (Azure AI Search)', 'CO inventory', 'NG9-1-1 readiness tracker', 'Rural obligations register'],
  }
}

function kingstonMop(): CopilotAnswer {
  const k = find('Kingston')
  return {
    blocks: [
      { type: 'text', text: `**Method of Procedure – Cutover of ${k.name} (${k.switchType})**\nVersion 3 DRAFT · Window: Sunday 00:00–06:00 ET · Change risk: Medium` },
      {
        type: 'table',
        columns: ['Step', 'Time', 'Action', 'Owner', 'Rollback point'],
        rows: [
          ['0', 'T-7d', 'Freeze translations; confirm 214 alarm circuits and 3 elevator lines are on dual-path', 'Voice Architect', '—'],
          ['1', 'T-60m', 'Pre-checks: IMS registration ≥99.5%, SBC capacity, CDR baseline captured', 'Cutover Manager', '—'],
          ['2', 'T+0', 'Go / no-go decision with Regulatory, Care and NOC', 'Cutover Manager', '—'],
          ['3', 'T+10', 'Re-point 911 trunks to NG9-1-1 interconnect; place test calls to PSAP', 'NOC', 'Yes'],
          ['4', 'T+30', 'Port numbers in batches of 5,000; verify LNP confirmations', 'Provisioning', 'Yes'],
          ['5', 'T+90', 'Validate call completion rate (≥ 99.0%), post-dial delay, fax and alarm test', 'NOC', 'Last rollback'],
          ['6', 'T+180', 'Hypercare begins; switch set to read-only', 'Cutover Manager', 'No'],
        ],
      },
      { type: 'text', text: `Rollback: restore translations from the T-7d snapshot and re-point trunks; expected rollback duration under 45 minutes. Success criteria: zero life-safety outages, ${fmtInt(k.totalLines)} lines validated.` },
    ],
    sources: ['MOP library (Azure AI Search)', 'Vendor documentation', 'Change calendar', 'Discovery Agent findings'],
  }
}

function coSummary(c: ReturnType<typeof find>): CopilotAnswer {
  const stickyTop = Object.entries(c.sticky).sort((a, b) => b[1] - a[1]).slice(0, 3)
  return {
    blocks: [
      { type: 'text', text: `**${c.name}** is ranked #${ranked().findIndex((x) => x.id === c.id) + 1} of ${REMAINING_COS.length} remaining sites with a readiness score of ${c.readiness}/100.` },
      {
        type: 'table',
        columns: ['Attribute', 'Value'],
        rows: [
          ['Switch', `${c.switchType} (${c.installYear}) – ${c.support}`],
          ['Access lines', fmtInt(c.totalLines)],
          ['Annual maintenance + site opex', fmtMoney(c.maintenanceCost + c.siteOpex)],
          ['Power / floor space', `${c.powerKw} kW / ${fmtInt(c.floorSqFt)} sq ft`],
          ['Top sticky services', stickyTop.map(([k, v]) => `${STICKY_LABELS[k as keyof typeof STICKY_LABELS]} (${fmtInt(v)})`).join(', ')],
          ['Hidden dependencies', c.hidden.length ? c.hidden.map((h) => h.title).join('; ') : 'None found'],
        ],
      },
    ],
    sources: ['CO inventory', 'Billing extract', 'Discovery Agent findings'],
  }
}

function overview(): CopilotAnswer {
  const done = COS.filter((c) => c.status === 'Decommissioned').length
  const lines = COS.reduce((a, c) => a + c.totalLines, 0)
  return {
    blocks: [
      { type: 'text', text: `Here is the current program picture: ${done} of ${COS.length} switches are decommissioned, covering a ${fmtInt(lines)}-line legacy footprint. The remaining ${REMAINING_COS.length} sites are sequenced in the Wave Planner. I can go deeper on a specific site, the business case, regulatory milestones or customer segments – try asking about a city such as Kingston or Sudbury.` },
      {
        type: 'chart', title: 'Legacy lines by province', unit: 'lines',
        data: (['ON', 'QC', 'BC', 'AB', 'SK', 'MB'] as const).map((p) => ({ name: p, value: COS.filter((c) => c.province === p).reduce((a, c) => a + c.totalLines, 0) })),
      },
    ],
    sources: ['CO inventory', 'Program dashboard'],
  }
}

export function scriptedAnswer(prompt: string): CopilotAnswer {
  const p = prompt.toLowerCase()
  if (p.includes('retire first') || p.includes('top 5') || p.includes('which 5')) return topFive()
  if (p.includes('sudbury') && (p.includes('911') || p.includes('copper'))) return sudbury()
  if (p.includes('delay') && p.includes('wave')) return delayWave3()
  if (p.includes('crtc') && (p.includes('draft') || p.includes('notif'))) return crtc()
  if ((p.includes('mop') || p.includes('method of procedure')) && p.includes('kingston')) return kingstonMop()
  const city = COS.find((c) => p.includes(c.city.toLowerCase()))
  if (city) return coSummary(city)
  if (p.includes('first') || p.includes('rank') || p.includes('priorit')) return topFive()
  return overview()
}
