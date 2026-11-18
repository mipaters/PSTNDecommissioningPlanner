export type SwitchType = 'Nortel DMS-100' | 'Nortel DMS-250' | 'Lucent 5ESS' | 'Ericsson AXE-10'
export type SupportStatus = 'Supported' | 'Extended Support' | 'End of Support'
export type Province = 'ON' | 'QC' | 'BC' | 'AB' | 'SK' | 'MB'
export type Segment = 'pots' | 'business' | 'pri' | 'centrex' | 'payphone' | 'special'
export type COStatus = 'Decommissioned' | 'In migration' | 'Planned'

export const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'pots', label: 'Residential POTS' },
  { key: 'business', label: 'Business lines' },
  { key: 'pri', label: 'PRI / ISDN' },
  { key: 'centrex', label: 'Centrex' },
  { key: 'payphone', label: 'Payphones' },
  { key: 'special', label: 'Special services' },
]

export type StickyKey =
  | 'alarm' | 'elevator' | 'fire' | 'fax' | 'atm' | 'psap' | 'gov' | 'ruralNoWireless' | 'tty'

export const STICKY_LABELS: Record<StickyKey, string> = {
  alarm: 'Alarm panels',
  elevator: 'Elevator phones',
  fire: 'Fire panels',
  fax: 'Fax lines',
  atm: 'ATM / POS dial-up',
  psap: '911 PSAP trunks',
  gov: 'Gov / utility circuits',
  ruralNoWireless: 'Rural, no wireless coverage',
  tty: 'Accessibility (TTY)',
}

export interface HiddenDependency {
  id: string
  title: string
  detail: string
  count: number
  kind: StickyKey | 'billing' | 'provisioning'
  discoveredBy: string
  remediation: string
}

export interface TrunkGroup {
  kind: 'Interconnect' | 'E911 / 911' | 'Wholesale' | 'Toll'
  partner: string
  ds1: number
}

export interface CentralOffice {
  id: string
  name: string
  city: string
  province: Province
  lat: number
  lng: number
  switchType: SwitchType
  support: SupportStatus
  installYear: number
  powerKw: number
  floorSqFt: number
  maintenanceCost: number
  siteOpex: number
  sparePartsRisk: number
  status: COStatus
  rural: boolean
  lines: Record<Segment, number>
  totalLines: number
  sticky: Record<StickyKey, number>
  trunks: TrunkGroup[]
  hidden: HiddenDependency[]
  migratablePct: number
  imsCoverage: number
  noticeMonths: number
  ng911Ready: boolean
  targetMix: { label: string; pct: number }[]
  readiness: number
  migrationRisk: number
  keepRisk: number
  aiScore: number
  rank: number
}
