/** Pure financial helpers + the 5-year business-case model. All amounts in CAD. */

export function npv(annualRate: number, flows: number[]): number {
  return flows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + annualRate, t), 0)
}

/** Monthly flows discounted with an annual rate; flows[0] is month 1. */
export function npvMonthly(annualRate: number, flows: number[]): number {
  const m = Math.pow(1 + annualRate, 1 / 12) - 1
  return flows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + m, i + 1), 0)
}

export function irr(flows: number[]): number {
  const hasPos = flows.some((f) => f > 0)
  const hasNeg = flows.some((f) => f < 0)
  if (!hasPos || !hasNeg) return NaN
  let lo = -0.99
  let hi = 10
  if (npv(lo, flows) * npv(hi, flows) > 0) return NaN
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const v = npv(mid, flows)
    if (Math.abs(v) < 1e-6) return mid
    if (npv(lo, flows) * v < 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/** Payback in periods (flows[0] occurs at t=0) using linear interpolation inside the crossover period. NaN if never. */
export function paybackPeriods(flows: number[]): number {
  let cum = 0
  for (let i = 0; i < flows.length; i++) {
    const prev = cum
    cum += flows[i]
    if (i > 0 && cum >= 0 && prev < 0) return i - 1 + -prev / flows[i]
  }
  return NaN
}

export interface BusinessInputs {
  switches: number
  lines: number
  maintenancePerSwitch: number
  siteOpexPerSwitch: number
  powerKwPerSwitch: number
  powerCostPerKwh: number
  sqFtPerSwitch: number
  leasableShare: number
  realEstatePerSqFt: number
  migrationCostPerLine: number
  decomCostPerSwitch: number
  churnRate: number
  annualRevenuePerLine: number
  contributionMargin: number
  discountRate: number
  ramp: number[]
}

export const RAMPS = {
  aggressive: [0.3, 0.72, 0.96, 1, 1],
  balanced: [0.17, 0.45, 0.75, 0.93, 1],
  conservative: [0.1, 0.28, 0.5, 0.72, 0.9],
} as const

export const DEFAULT_INPUTS: BusinessInputs = {
  switches: 42,
  lines: 1_200_000,
  maintenancePerSwitch: 1_350_000,
  siteOpexPerSwitch: 740_000,
  powerKwPerSwitch: 115,
  powerCostPerKwh: 0.11,
  sqFtPerSwitch: 13_000,
  leasableShare: 0.5,
  realEstatePerSqFt: 28,
  migrationCostPerLine: 48,
  decomCostPerSwitch: 400_000,
  churnRate: 0.035,
  annualRevenuePerLine: 540,
  contributionMargin: 0.35,
  discountRate: 0.08,
  ramp: [...RAMPS.balanced],
}

export interface YearRow {
  year: number
  fraction: number
  opexSavings: number
  powerSavings: number
  realEstate: number
  churnLoss: number
  capex: number
  net: number
  cumulative: number
}

export interface BusinessCase {
  rows: YearRow[]
  flows: number[]
  npv: number
  irr: number
  paybackMonths: number
  totalSavings: number
  totalCapex: number
  powerAvoidedGWh: number
  co2Tonnes: number
  sqFtFreed: number
  waterfall: { name: string; value: number }[]
}

const GRID_KG_PER_KWH = 0.03 // Canadian blended grid intensity (illustrative)

export function buildBusinessCase(inp: BusinessInputs): BusinessCase {
  const rows: YearRow[] = []
  const programCost = inp.lines * inp.migrationCostPerLine + inp.switches * inp.decomCostPerSwitch
  const delta = (y: number) => (inp.ramp[y] ?? inp.ramp[inp.ramp.length - 1]) - (y > 0 ? inp.ramp[y - 1] : 0)
  // Spend leads delivery: 40% of each year's migration scope is spent (design, procurement, outreach) the year before.
  const year0Capex = 0.4 * delta(0) * programCost
  let prevFrac = 0
  let cum = -year0Capex
  let powerKwh = 0
  for (let y = 0; y < inp.ramp.length; y++) {
    const frac = inp.ramp[y]
    const avg = (prevFrac + frac) / 2
    const opexSavings = avg * inp.switches * (inp.maintenancePerSwitch + inp.siteOpexPerSwitch)
    const kwh = avg * inp.switches * inp.powerKwPerSwitch * 8760
    const powerSavings = kwh * inp.powerCostPerKwh
    const realEstate = avg * inp.switches * inp.sqFtPerSwitch * inp.leasableShare * inp.realEstatePerSqFt
    const churnLoss = avg * inp.lines * inp.churnRate * inp.annualRevenuePerLine * inp.contributionMargin
    const capex = programCost * (0.6 * delta(y) + 0.4 * (y + 1 < inp.ramp.length ? delta(y + 1) : 0))
    const net = opexSavings + powerSavings + realEstate - churnLoss - capex
    cum += net
    powerKwh += kwh
    rows.push({ year: y + 1, fraction: frac, opexSavings, powerSavings, realEstate, churnLoss, capex, net, cumulative: cum })
    prevFrac = frac
  }
  const flows = [-year0Capex, ...rows.map((r) => r.net)]
  // Payback is measured on a monthly basis assuming each year's net flow accrues evenly.
  const monthly = [-year0Capex, ...rows.flatMap((r) => Array(12).fill(r.net / 12))]
  const sum = (f: (r: YearRow) => number) => rows.reduce((a, r) => a + f(r), 0)
  const totalSavings = sum((r) => r.opexSavings + r.powerSavings + r.realEstate)
  const totalCapex = sum((r) => r.capex) + year0Capex
  return {
    rows,
    flows,
    npv: npv(inp.discountRate, flows),
    irr: irr(flows),
    paybackMonths: paybackPeriods(monthly),
    totalSavings,
    totalCapex,
    powerAvoidedGWh: powerKwh / 1e6,
    co2Tonnes: (powerKwh * GRID_KG_PER_KWH) / 1000,
    sqFtFreed: inp.ramp[inp.ramp.length - 1] * inp.switches * inp.sqFtPerSwitch,
    waterfall: [
      { name: 'Maintenance & site opex', value: sum((r) => r.opexSavings) },
      { name: 'Power', value: sum((r) => r.powerSavings) },
      { name: 'Real estate', value: sum((r) => r.realEstate) },
      { name: 'Churn impact', value: -sum((r) => r.churnLoss) },
      { name: 'Migration & decom capex', value: -totalCapex },
    ],
  }
}

export type TornadoKey = 'maintenancePerSwitch' | 'powerCostPerKwh' | 'realEstatePerSqFt' | 'migrationCostPerLine' | 'churnRate'

export const TORNADO_LABELS: Record<TornadoKey, string> = {
  maintenancePerSwitch: 'Maintenance $/switch',
  powerCostPerKwh: 'Power $/kWh',
  realEstatePerSqFt: 'Real estate $/sq ft',
  migrationCostPerLine: 'Migration $/line',
  churnRate: 'Churn rate',
}

/** NPV impact of moving each driver by ±swing (default 20%). */
export function tornado(inp: BusinessInputs, swing = 0.2) {
  const base = buildBusinessCase(inp).npv
  return (Object.keys(TORNADO_LABELS) as TornadoKey[])
    .map((key) => {
      const lo = buildBusinessCase({ ...inp, [key]: inp[key] * (1 - swing) }).npv - base
      const hi = buildBusinessCase({ ...inp, [key]: inp[key] * (1 + swing) }).npv - base
      return { key, label: TORNADO_LABELS[key], low: Math.min(lo, hi), high: Math.max(lo, hi), span: Math.abs(hi - lo) }
    })
    .sort((a, b) => b.span - a.span)
}
