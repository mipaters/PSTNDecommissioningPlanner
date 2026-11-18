import { COS } from '@/data/cos'
import { SEGMENTS, type Segment } from '@/data/types'
import { annualSavings } from './planner'

export const MONTH_NOW = 14
const TOTAL_MONTHS = 36

const sCurve = (m: number) => {
  const x = m / TOTAL_MONTHS
  return 1 / (1 + Math.exp(-9 * (x - 0.5))) // logistic
}
const norm = (m: number) => (sCurve(m) - sCurve(0)) / (sCurve(TOTAL_MONTHS) - sCurve(0))

export function dashboardData() {
  const totalLines = COS.reduce((a, c) => a + c.totalLines, 0)
  const done = COS.filter((c) => c.status === 'Decommissioned')
  const migrating = COS.filter((c) => c.status === 'In migration')
  const doneLines = done.reduce((a, c) => a + c.totalLines, 0)
  const migratedLines = doneLines + migrating.reduce((a, c) => a + c.totalLines * 0.55, 0)

  const burndown = Array.from({ length: TOTAL_MONTHS + 1 }, (_, m) => {
    const plan = Math.round(totalLines * (1 - norm(m)))
    const remainingNow = totalLines - migratedLines
    const actual = m <= MONTH_NOW ? Math.round(totalLines - (migratedLines * norm(m)) / norm(MONTH_NOW)) : null
    const forecast = m >= MONTH_NOW ? Math.round(remainingNow * (1 - (0.96 * (norm(m) - norm(MONTH_NOW))) / (1 - norm(MONTH_NOW)))) : null
    return { month: m, plan, actual, forecast }
  })

  const savingsPlanFull = COS.reduce((a, c) => a + annualSavings(c), 0)
  const savingsRamp = Array.from({ length: TOTAL_MONTHS + 1 }, (_, m) => ({
    month: m,
    plan: Math.round((savingsPlanFull * norm(m)) / 1e5) / 10,
    actual: m <= MONTH_NOW ? Math.round((savingsPlanFull * norm(m) * 0.95) / 1e5) / 10 : null,
  }))

  const segMigrated: Record<Segment, number> = { pots: 0.31, business: 0.44, pri: 0.37, centrex: 0.29, payphone: 0.62, special: 0.18 }
  const segments = SEGMENTS.map((s) => {
    const total = COS.reduce((a, c) => a + c.lines[s.key], 0)
    const mig = Math.round(total * segMigrated[s.key])
    return { key: s.key, name: s.label, migrated: mig, remaining: total - mig, total, pct: segMigrated[s.key] * 100 }
  })

  const savingsRealized = savingsPlanFull * norm(MONTH_NOW) * 0.95
  const savingsPlan = savingsPlanFull * norm(MONTH_NOW)
  const powerPlanKw = COS.reduce((a, c) => a + c.powerKw, 0)
  const powerRemovedKw = done.reduce((a, c) => a + c.powerKw, 0) + migrating.reduce((a, c) => a + c.powerKw * 0.5, 0)
  const sqFt = done.reduce((a, c) => a + c.floorSqFt, 0)

  return {
    totalLines, migratedLines,
    switches: { done: done.length, total: COS.length },
    migratedPct: (migratedLines / totalLines) * 100,
    savingsRealized, savingsPlan, savingsPlanFull,
    powerRemovedKw, powerPlanKw, powerMwhYr: (powerRemovedKw * 8760) / 1000,
    co2Tonnes: (powerRemovedKw * 8760 * 0.03) / 1000,
    sqFtFreed: sqFt, monetization: sqFt * 0.5 * 28 * 5,
    criticalAtRisk: { red: 3, amber: 9, green: 74 },
    churnMigrated: 3.9, churnBaseline: 9.0,
    onTimePct: 91.7,
    burndown, savingsRamp, segments,
  }
}
