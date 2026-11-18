import type {
  CentralOffice, COStatus, HiddenDependency, Province, Segment, StickyKey, SupportStatus, SwitchType, TrunkGroup,
} from './types'

function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DMS = 'Nortel DMS-100' as const
const DMS250 = 'Nortel DMS-250' as const
const ESS = 'Lucent 5ESS' as const
const AXE = 'Ericsson AXE-10' as const
const EOS = 'End of Support' as const
const EXT = 'Extended Support' as const
const SUP = 'Supported' as const

// name, city, province, lat, lng, switch, support, installYear, size tier (1-5), status, rural
type Raw = [string, string, Province, number, number, SwitchType, SupportStatus, number, number, COStatus, boolean]

const RAW: Raw[] = [
  ['Thunder Bay – Red River', 'Thunder Bay', 'ON', 48.3809, -89.2477, DMS, EOS, 1985, 3, 'Planned', true],
  ['Kingston – Princess St', 'Kingston', 'ON', 44.2312, -76.486, DMS, EOS, 1987, 3, 'Planned', false],
  ['Sudbury – Elm St', 'Sudbury', 'ON', 46.4917, -80.993, DMS, EXT, 1989, 3, 'Planned', true],
  ['Sault Ste. Marie – Queen St', 'Sault Ste. Marie', 'ON', 46.5219, -84.3461, DMS, EOS, 1986, 2, 'Planned', true],
  ['Ottawa – Slater', 'Ottawa', 'ON', 45.4215, -75.6972, ESS, EXT, 1991, 5, 'Planned', false],
  ['Toronto – Adelaide', 'Toronto', 'ON', 43.6504, -79.3849, DMS250, EXT, 1988, 5, 'Planned', false],
  ['Toronto – Bloor', 'Toronto', 'ON', 43.6677, -79.4003, ESS, EXT, 1992, 5, 'Planned', false],
  ['Mississauga – Dundas', 'Mississauga', 'ON', 43.589, -79.6441, ESS, SUP, 1996, 4, 'Planned', false],
  ['Hamilton – King St', 'Hamilton', 'ON', 43.2557, -79.8711, DMS, EXT, 1990, 4, 'Planned', false],
  ['London – Richmond', 'London', 'ON', 42.9849, -81.2453, ESS, EXT, 1993, 4, 'Planned', false],
  ['Windsor – Ouellette', 'Windsor', 'ON', 42.3149, -83.0364, DMS, EOS, 1988, 3, 'Planned', false],
  ['Kitchener – King St', 'Kitchener', 'ON', 43.4516, -80.4925, ESS, SUP, 1997, 3, 'Planned', false],
  ['Barrie – Dunlop', 'Barrie', 'ON', 44.3894, -79.6903, AXE, EXT, 1998, 2, 'Planned', false],
  ['Peterborough – George St', 'Peterborough', 'ON', 44.3091, -78.3197, DMS, EOS, 1989, 2, 'Planned', false],
  ['North Bay – Main St', 'North Bay', 'ON', 46.3091, -79.4608, DMS, EOS, 1987, 2, 'Planned', true],
  ['Timmins – Third Ave', 'Timmins', 'ON', 48.4758, -81.3305, DMS, EOS, 1986, 1, 'Decommissioned', true],
  ['Oshawa – Simcoe', 'Oshawa', 'ON', 43.8971, -78.8658, ESS, SUP, 1999, 3, 'Planned', false],
  ['Montréal – Atwater', 'Montréal', 'QC', 45.4833, -73.5822, DMS250, EXT, 1988, 5, 'Planned', false],
  ['Montréal – Rosemont', 'Montréal', 'QC', 45.5465, -73.5993, DMS, EXT, 1990, 5, 'Planned', false],
  ['Laval – Saint-Martin', 'Laval', 'QC', 45.5712, -73.7124, AXE, SUP, 1997, 4, 'Planned', false],
  ['Longueuil – Taschereau', 'Longueuil', 'QC', 45.5312, -73.5181, AXE, EXT, 1995, 4, 'Planned', false],
  ['Québec – Saint-Roch', 'Québec City', 'QC', 46.8139, -71.2082, DMS, EXT, 1989, 4, 'Planned', false],
  ['Sherbrooke – King Ouest', 'Sherbrooke', 'QC', 45.4042, -71.8929, DMS, EOS, 1988, 2, 'Planned', false],
  ['Trois-Rivières – des Forges', 'Trois-Rivières', 'QC', 46.343, -72.5477, AXE, EXT, 1996, 2, 'Planned', false],
  ['Gatineau – Promenade', 'Gatineau', 'QC', 45.4765, -75.7013, ESS, SUP, 1998, 3, 'Planned', false],
  ['Saguenay – Racine', 'Saguenay', 'QC', 48.4284, -71.0686, DMS, EOS, 1986, 2, 'Planned', true],
  ['Rimouski – Saint-Germain', 'Rimouski', 'QC', 48.4489, -68.5232, DMS, EOS, 1985, 1, 'Decommissioned', true],
  ['Drummondville – Lindsay', 'Drummondville', 'QC', 45.8838, -72.4843, AXE, EXT, 1997, 1, 'In migration', false],
  ['Vancouver – Hastings', 'Vancouver', 'BC', 49.2827, -123.1207, DMS250, EXT, 1989, 5, 'Planned', false],
  ['Victoria – Fort St', 'Victoria', 'BC', 48.4284, -123.3656, ESS, EXT, 1992, 3, 'Planned', false],
  ['Kamloops – Victoria St', 'Kamloops', 'BC', 50.6745, -120.3273, DMS, EOS, 1988, 2, 'Planned', true],
  ['Calgary – Downtown', 'Calgary', 'AB', 51.0447, -114.0719, DMS250, EXT, 1990, 5, 'Planned', false],
  ['Edmonton – Jasper Ave', 'Edmonton', 'AB', 53.5461, -113.4938, ESS, EXT, 1991, 5, 'Planned', false],
  ['Red Deer – Gaetz', 'Red Deer', 'AB', 52.2681, -113.8112, ESS, SUP, 1997, 2, 'In migration', false],
  ['Lethbridge – 3rd Ave', 'Lethbridge', 'AB', 49.6935, -112.8418, DMS, EOS, 1989, 2, 'Planned', false],
  ['Fort McMurray – Franklin', 'Fort McMurray', 'AB', 56.7267, -111.381, ESS, EXT, 1998, 1, 'Decommissioned', true],
  ['Saskatoon – 2nd Ave', 'Saskatoon', 'SK', 52.1332, -106.67, DMS, EXT, 1990, 3, 'Planned', false],
  ['Regina – Scarth St', 'Regina', 'SK', 50.4452, -104.6189, DMS, EOS, 1988, 3, 'Planned', false],
  ['Winnipeg – Main St', 'Winnipeg', 'MB', 49.8951, -97.1384, DMS250, EXT, 1989, 4, 'Planned', false],
  ['Brandon – Rosser Ave', 'Brandon', 'MB', 49.8485, -99.9501, DMS, EOS, 1987, 1, 'Decommissioned', true],
  ['Moose Jaw – Main St', 'Moose Jaw', 'SK', 50.3934, -105.5519, DMS, EOS, 1986, 1, 'Decommissioned', true],
  ['Prince George – Victoria St', 'Prince George', 'BC', 53.9171, -122.7497, ESS, EXT, 1994, 1, 'Decommissioned', true],
]

const TIER_LINES = [0, 9000, 17000, 27000, 41000, 62000]

function makeTrunks(r: () => number, tier: number, city: string): TrunkGroup[] {
  const partners = ['Northern Lights Wireless', 'Prairie Cable Co.', 'Great Lakes Fibre', 'Cité Télécom']
  return [
    { kind: 'Interconnect', partner: partners[Math.floor(r() * partners.length)], ds1: Math.round(24 * tier * (0.8 + r() * 0.5)) },
    { kind: 'E911 / 911', partner: `${city} PSAP network`, ds1: 4 + Math.round(tier * (1 + r())) },
    { kind: 'Wholesale', partner: partners[Math.floor(r() * partners.length)], ds1: Math.round(12 * tier * (0.6 + r() * 0.8)) },
    { kind: 'Toll', partner: 'National toll tandem', ds1: Math.round(8 * tier * (0.7 + r() * 0.6)) },
  ]
}

function build(): CentralOffice[] {
  const sizes = RAW.map((raw, i) => TIER_LINES[raw[8]] * (0.85 + rng(i * 7 + 3)() * 0.3))
  const scale = 1_200_000 / sizes.reduce((a, b) => a + b, 0)

  const cos: CentralOffice[] = RAW.map((raw, i) => {
    const [name, city, province, lat, lng, switchType, support, installYear, tier, status, rural] = raw
    const r = rng(1000 + i * 31)
    const total = Math.round(sizes[i] * scale)
    const mix: Record<Segment, number> = {
      pots: rural ? 0.64 : 0.54, business: 0.18, pri: 0.07, centrex: 0.09, payphone: rural ? 0.012 : 0.006, special: 0.09,
    }
    const jitter = (Object.keys(mix) as Segment[]).map((k) => mix[k] * (0.9 + r() * 0.2))
    const sum = jitter.reduce((a, b) => a + b, 0)
    const lines = {} as Record<Segment, number>
    ;(Object.keys(mix) as Segment[]).forEach((k, idx) => (lines[k] = Math.round((jitter[idx] / sum) * total)))
    const totalLines = Object.values(lines).reduce((a, b) => a + b, 0)

    const eosMult = support === EOS ? 1.3 : support === EXT ? 1.12 : 1
    let maintenanceCost = Math.round((450_000 + totalLines * 24) * eosMult * (0.92 + r() * 0.16) / 1000) * 1000
    maintenanceCost = Math.min(maintenanceCost, 1_950_000)
    const powerKw = Math.round(35 + (totalLines / 1000) * 2.8 * (0.9 + r() * 0.2))
    const floorSqFt = Math.round((3000 + totalLines * 0.35) / 100) * 100
    const sparePartsRisk = support === EOS ? 70 + Math.round(r() * 25) : support === EXT ? 40 + Math.round(r() * 30) : 10 + Math.round(r() * 25)
    const k = totalLines / 1000
    const sticky: Record<StickyKey, number> = {
      alarm: Math.round(k * 11 * (0.6 + r() * 0.8)),
      elevator: Math.round(k * 0.6 * (0.6 + r() * 0.8)),
      fire: Math.round(k * 0.8 * (0.6 + r() * 0.8)),
      fax: Math.round(k * 5 * (0.6 + r() * 0.8)),
      atm: Math.round(k * 3 * (0.6 + r() * 0.8)),
      psap: 2 + Math.round(tier * (0.6 + r())),
      gov: Math.round(k * 1.1 * (0.6 + r() * 0.8)),
      ruralNoWireless: Math.round(k * (rural ? 18 : 1.8) * (0.6 + r() * 0.8)),
      tty: Math.round(k * 0.7 * (0.6 + r() * 0.8)),
    }
    const migratablePct = Math.round((rural ? 76 : 84) + r() * 12)
    const imsCoverage = Math.round((rural ? 78 : 92) + r() * 7)

    return {
      id: `CO-${String(i + 1).padStart(2, '0')}`,
      name, city, province, lat, lng, switchType, support, installYear,
      powerKw, floorSqFt, maintenanceCost,
      siteOpex: Math.round(maintenanceCost * 0.55 / 1000) * 1000,
      sparePartsRisk, status, rural,
      lines, totalLines, sticky,
      trunks: makeTrunks(r, tier, city),
      hidden: [],
      migratablePct, imsCoverage,
      noticeMonths: rural ? 12 : tier >= 4 ? 9 : 6,
      ng911Ready: !rural && r() > 0.25,
      targetMix: [],
      readiness: 0, migrationRisk: 0, keepRisk: 0, aiScore: 0, rank: 0,
    }
  })

  // Hand-tuned flagship sites used in the scripted scenarios
  const byCity = (c: string) => cos.find((x) => x.city === c)!
  const tb = byCity('Thunder Bay')
  tb.maintenanceCost = 2_100_000
  tb.siteOpex = 1_150_000
  tb.migratablePct = 92
  tb.sparePartsRisk = 94
  tb.imsCoverage = 97
  tb.hidden = [{
    id: 'H-TB-1', title: 'Legacy toll-ticket feed to billing', kind: 'billing', count: 1,
    detail: 'Nightly AMA toll-ticket file still feeds the 2009 mediation server used for wholesale settlements.',
    discoveredBy: 'Discovery Agent (billing × CDR reconciliation)',
    remediation: 'Re-point mediation to IMS CDR stream; parallel-run two bill cycles.',
  }]

  const kn = byCity('Kingston')
  kn.hidden = [
    {
      id: 'H-KN-1', title: 'Alarm-monitoring circuits not in inventory', kind: 'alarm', count: 214,
      detail: '214 dry-pair alarm-panel circuits terminate on spare line cards but have no billing or provisioning record.',
      discoveredBy: 'Discovery Agent (CDR dial-out patterns × line-card scan)',
      remediation: 'Move to LTE alarm communicators / SIP-capable panels; install 90-day dual-path monitoring before cutover.',
    },
    {
      id: 'H-KN-2', title: 'Elevator emergency phones', kind: 'elevator', count: 3,
      detail: '3 elevator emergency lines serve a hospital annex and two provincial buildings; classed life-safety.',
      discoveredBy: 'Discovery Agent (CDR × facilities register)',
      remediation: 'Site visit, replace with cellular elevator communicators, witness test with building owner.',
    },
    {
      id: 'H-KN-3', title: 'Legacy provisioning feed (SOAP → switch)', kind: 'provisioning', count: 1,
      detail: 'A 2004 provisioning gateway still writes translations directly to the DMS-100.',
      discoveredBy: 'Dependency & Risk Agent (OSS interface graph)',
      remediation: 'Retire gateway after IMS provisioning flow-through is certified.',
    },
  ]
  kn.sticky.alarm += 214
  kn.sticky.elevator += 3

  const sb = byCity('Sudbury')
  sb.sticky.psap = 9
  sb.sticky.ruralNoWireless = 1840
  sb.hidden = [{
    id: 'H-SU-1', title: 'Copper-only 911 access lines', kind: 'ruralNoWireless', count: 640,
    detail: '640 customers in the Lively / Capreol / Hanmer corridors have no reliable wireless coverage and use copper for 911.',
    discoveredBy: 'Dependency & Risk Agent (GIS coverage × line records)',
    remediation: 'Fixed-wireless voice with battery backup where coverage exists; retain copper-to-VoIP ATAs with 8-hour battery elsewhere.',
  }]

  const wd = byCity('Windsor')
  wd.hidden = [{
    id: 'H-WI-1', title: 'Hospital fax and paging lines', kind: 'fax', count: 38,
    detail: '38 lines carry hospital pharmacy fax and a legacy paging gateway.',
    discoveredBy: 'Discovery Agent (CDR clustering)',
    remediation: 'Migrate to T.38-capable SIP trunk with fax-over-IP gateway.',
  }]

  // Derived scores
  const maxMaint = Math.max(...cos.map((c) => c.maintenanceCost))
  for (const c of cos) {
    const stickyDensity = Math.min(
      100,
      ((c.sticky.alarm + c.sticky.elevator * 8 + c.sticky.fire * 4 + c.sticky.psap * 10 + c.sticky.ruralNoWireless * 0.4 + c.sticky.tty * 2) /
        c.totalLines) * 800,
    )
    const hiddenPenalty = c.hidden.reduce((a, h) => a + Math.min(25, 4 + h.count / 12), 0)
    c.readiness = clamp(Math.round(0.5 * c.migratablePct + 0.2 * (100 - stickyDensity) + 0.2 * c.imsCoverage + 10 - hiddenPenalty * 0.5 - (c.rural ? 4 : 0)))
    c.migrationRisk = clamp(Math.round(100 - c.readiness + (c.ng911Ready ? 0 : 6)))
    c.keepRisk = clamp(Math.round(0.55 * c.sparePartsRisk + 0.45 * (c.support === EOS ? 95 : c.support === EXT ? 55 : 20)))
    const value = ((c.maintenanceCost + c.siteOpex + c.powerKw * 8760 * 0.11) / maxMaint / 1.9) * 100
    c.aiScore = Math.round((0.4 * c.readiness + 0.35 * value + 0.25 * c.keepRisk) * 10) / 10
    const rest = 100 - c.readiness
    c.targetMix = [
      { label: 'VoLTE home phone', pct: Math.round(c.migratablePct * 0.55) },
      { label: 'SIP trunking', pct: Math.round(c.migratablePct * 0.2) },
      { label: 'Operator Connect (Teams)', pct: Math.round(c.migratablePct * 0.15) },
      { label: 'Fixed wireless voice', pct: Math.round(100 - c.migratablePct * 0.9 - rest * 0.1) },
    ]
  }
  const ranked = [...cos].sort((a, b) => b.aiScore - a.aiScore)
  ranked.forEach((c, i) => (c.rank = i + 1))
  return cos
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

export const COS: CentralOffice[] = build()
export const CO_BY_ID = Object.fromEntries(COS.map((c) => [c.id, c])) as Record<string, CentralOffice>
export const REMAINING_COS = COS.filter((c) => c.status !== 'Decommissioned')
export const HIDDEN_DEPENDENCIES: (HiddenDependency & { coId: string })[] = COS.flatMap((c) => c.hidden.map((h) => ({ ...h, coId: c.id })))

export function readinessBand(score: number): 'High' | 'Medium' | 'Low' {
  return score >= 75 ? 'High' : score >= 60 ? 'Medium' : 'Low'
}
export const BAND_COLORS = { High: '#14b8a6', Medium: '#f59e0b', Low: '#ef4444' } as const
