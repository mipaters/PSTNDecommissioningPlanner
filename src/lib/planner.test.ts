import { describe, expect, it } from 'vitest'
import { COS, REMAINING_COS } from '@/data/cos'
import { buildPlan, DEFAULT_PARAMS, HORIZON } from './planner'

describe('synthetic data', () => {
  it('has 42 central offices and ~1.2M lines', () => {
    expect(COS).toHaveLength(42)
    const lines = COS.reduce((a, c) => a + c.totalLines, 0)
    expect(lines).toBeGreaterThan(1_190_000)
    expect(lines).toBeLessThan(1_210_000)
    expect(COS.filter((c) => c.status === 'Decommissioned')).toHaveLength(6)
  })
  it('ranks Thunder Bay first among remaining COs', () => {
    const top = [...REMAINING_COS].sort((a, b) => b.aiScore - a.aiScore)[0]
    expect(top.city).toBe('Thunder Bay')
  })
})

describe('planner', () => {
  const plan = buildPlan(DEFAULT_PARAMS)
  it('is deterministic', () => {
    expect(buildPlan(DEFAULT_PARAMS).metrics.npv).toBe(plan.metrics.npv)
  })
  it('respects crew lanes (no overlap) and horizon', () => {
    const done = plan.items.filter((i) => !i.deferred)
    for (const a of done) for (const b of done) {
      if (a !== b && a.lane === b.lane) expect(a.end < b.start || b.end < a.start).toBe(true)
    }
    expect(done.every((i) => i.end <= HORIZON)).toBe(true)
  })
  it('respects the notice period', () => {
    expect(plan.items.every((i) => i.start >= i.co.noticeMonths)).toBe(true)
  })
  it('more crews complete at least as many COs', () => {
    expect(buildPlan({ ...DEFAULT_PARAMS, crews: 8 }).metrics.completed).toBeGreaterThanOrEqual(plan.metrics.completed)
  })
  it('a tight budget defers sites and never exceeds the cap', () => {
    const p = buildPlan({ ...DEFAULT_PARAMS, budgetCap: 30_000_000 })
    expect(p.metrics.capex).toBeLessThanOrEqual(30_000_000)
    expect(p.metrics.deferred).toBeGreaterThan(plan.metrics.deferred)
  })
  it('produces plausible headline metrics', () => {
    const m = plan.metrics
    expect(m.completed + m.deferred).toBe(36)
    expect(m.npv).toBeGreaterThan(0)
  })
})
