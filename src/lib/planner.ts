import { REMAINING_COS } from '@/data/cos'
import type { CentralOffice } from '@/data/types'
import { npvMonthly } from './finance'

export type Priority = 'savings' | 'risk' | 'realEstate' | 'carbon' | 'manual'

export interface PlanParams {
  crews: number // parallel migration crews
  budgetCap: number // CAD, cumulative migration + decom spend
  riskTolerance: number // 0 (cautious) – 100 (aggressive)
  priority: Priority
  delayWave3Months?: number
}

export const DEFAULT_PARAMS: PlanParams = { crews: 5, budgetCap: 90_000_000, riskTolerance: 50, priority: 'savings' }

export const HORIZON = 36
export const MODEL_MONTHS = 60
export const LINES_PER_CREW_MONTH = 8000
export const MIGRATION_COST_PER_LINE = 48
export const DECOM_COST = 400_000
export const DISCOUNT = 0.08
const CHURN_COST_PER_LINE = 540 * 0.35 * 0.035 // annual contribution lost per migrated line

export interface PlanItem {
  co: CentralOffice
  lane: number
  start: number // 1-based month
  end: number
  wave: number
  cost: number
  annualSavings: number
  deferred: boolean
}

export interface PlanMetrics {
  npv: number
  paybackMonths: number
  completed: number
  deferred: number
  capex: number
  steadySavings: number
  linesMigrated: number
  exposureIndex: number
  migrationRisk: number
  monthlySavings: number[]
  cumulativeNet: number[]
  linesRemaining: number[]
}

export interface Plan {
  params: PlanParams
  items: PlanItem[]
  metrics: PlanMetrics
}

export function annualSavings(c: CentralOffice): number {
  return c.maintenanceCost + c.siteOpex + c.powerKw * 8760 * 0.11 + c.floorSqFt * 0.5 * 28
}

export const migrationCost = (c: CentralOffice) => c.totalLines * MIGRATION_COST_PER_LINE + DECOM_COST

function priorityScore(c: CentralOffice, p: Priority, idx: number): number {
  switch (p) {
    case 'manual':
      return -idx // inventory order, as a spreadsheet-driven plan would do
    case 'savings':
      return annualSavings(c) / migrationCost(c)
    case 'risk':
      return c.keepRisk - c.migrationRisk * 0.3
    case 'realEstate':
      return c.floorSqFt / 1000
    case 'carbon':
      return c.powerKw
  }
}

export function buildPlan(params: PlanParams, cos: CentralOffice[] = REMAINING_COS): Plan {
  const threshold = 25 + params.riskTolerance * 0.55
  const scored = cos.map((c, i) => ({ c, s: priorityScore(c, params.priority, i) }))
  const norm = (arr: number[]) => {
    const lo = Math.min(...arr)
    const hi = Math.max(...arr)
    return arr.map((v) => (hi === lo ? 0.5 : (v - lo) / (hi - lo)))
  }
  const ns = norm(scored.map((x) => x.s))
  const ordered = scored
    .map((x, i) => {
      if (params.priority === 'manual') return { c: x.c, key: ns[i] }
      const tooRisky = x.c.migrationRisk > threshold
      // Readiness blends in so that low-risk-ready sites go first; risky ones sink to the back.
      return { c: x.c, key: ns[i] * 0.6 + (x.c.readiness / 100) * 0.4 - (tooRisky ? 1 : 0) }
    })
    .sort((a, b) => b.key - a.key)

  const lanes: number[] = Array(Math.max(1, Math.round(params.crews))).fill(0)
  const items: PlanItem[] = []
  let spent = 0
  const delay = params.delayWave3Months ?? 0
  const crewRate = LINES_PER_CREW_MONTH

  for (const { c } of ordered) {
    const cost = migrationCost(c)
    const duration = Math.max(2, Math.ceil(c.totalLines / crewRate) + 1)
    let lane = 0
    for (let i = 1; i < lanes.length; i++) if (lanes[i] < lanes[lane]) lane = i
    let start = Math.max(lanes[lane] + 1, c.noticeMonths)
    let wave = Math.floor((start - 1) / 9) + 1
    if (delay && wave === 3) start += delay
    wave = Math.floor((start - 1) / 9) + 1
    const end = start + duration - 1
    const over = spent + cost > params.budgetCap
    const deferred = over || end > HORIZON
    if (!deferred) {
      spent += cost
      lanes[lane] = end
    }
    items.push({ co: c, lane, start, end, wave, cost, annualSavings: annualSavings(c), deferred })
  }

  return { params, items, metrics: computeMetrics(items) }
}

function computeMetrics(items: PlanItem[]): PlanMetrics {
  const done = items.filter((i) => !i.deferred)
  const flows = Array(MODEL_MONTHS).fill(0) as number[]
  const monthlySavings = Array(HORIZON + 1).fill(0) as number[]
  for (const it of done) {
    const months = it.end - it.start + 1
    for (let m = it.start; m <= it.end; m++) flows[m - 1] -= it.cost / months
    for (let m = it.end + 1; m <= MODEL_MONTHS; m++) {
      flows[m - 1] += it.annualSavings / 12 - (it.co.totalLines * CHURN_COST_PER_LINE) / 12
      if (m <= HORIZON) monthlySavings[m] += it.annualSavings / 12
    }
  }
  let cum = 0
  const cumulativeNet = flows.map((f) => (cum += f))
  let payback = NaN
  for (let i = 1; i < cumulativeNet.length; i++) {
    if (cumulativeNet[i - 1] < 0 && cumulativeNet[i] >= 0) {
      payback = i + -cumulativeNet[i - 1] / flows[i]
      break
    }
  }

  const totalLines = items.reduce((a, i) => a + i.co.totalLines, 0)
  const linesRemaining: number[] = []
  let exposure = 0
  for (let m = 0; m <= HORIZON; m++) {
    const rem = items.reduce((a, it) => a + (!it.deferred && it.end <= m ? 0 : it.co.totalLines), 0)
    linesRemaining.push(rem)
    if (m > 0) exposure += items.reduce((a, it) => a + (!it.deferred && it.end <= m ? 0 : it.co.keepRisk * it.co.totalLines), 0) / totalLines
  }
  const migLines = done.reduce((a, i) => a + i.co.totalLines, 0)

  return {
    npv: npvMonthly(DISCOUNT, flows),
    paybackMonths: payback,
    completed: done.length,
    deferred: items.length - done.length,
    capex: done.reduce((a, i) => a + i.cost, 0),
    steadySavings: done.reduce((a, i) => a + i.annualSavings, 0),
    linesMigrated: migLines,
    exposureIndex: exposure / HORIZON,
    migrationRisk: migLines ? done.reduce((a, i) => a + i.co.migrationRisk * i.co.totalLines, 0) / migLines : 0,
    monthlySavings,
    cumulativeNet,
    linesRemaining,
  }
}
