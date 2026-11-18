import { describe, expect, it } from 'vitest'
import { buildBusinessCase, DEFAULT_INPUTS, irr, npv, npvMonthly, paybackPeriods, RAMPS, tornado } from './finance'

describe('finance primitives', () => {
  it('npv discounts annual flows', () => {
    expect(npv(0.1, [-100, 110])).toBeCloseTo(0, 6)
    expect(npv(0, [-100, 50, 60])).toBeCloseTo(10, 6)
  })
  it('npvMonthly equals annual npv for a single year-end flow', () => {
    const flows = Array(12).fill(0)
    flows[11] = 110
    expect(npvMonthly(0.1, flows)).toBeCloseTo(110 / 1.1, 6)
  })
  it('irr finds the rate that zeroes npv', () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 5)
    expect(irr([-1000, 300, 400, 500])).toBeCloseTo(0.0889, 3)
  })
  it('irr is NaN without sign change', () => {
    expect(irr([10, 20])).toBeNaN()
  })
  it('payback interpolates within the crossover period', () => {
    expect(paybackPeriods([-100, 60, 60])).toBeCloseTo(1.6667, 3)
    expect(paybackPeriods([-100, 10])).toBeNaN()
  })
})

describe('business case', () => {
  const base = buildBusinessCase(DEFAULT_INPUTS)
  it('reconciles the waterfall to total net cash', () => {
    const wf = base.waterfall.reduce((a, w) => a + w.value, 0)
    expect(wf).toBeCloseTo(base.rows[base.rows.length - 1].cumulative, 0)
  })
  it('aggressive ramp pays back faster than conservative', () => {
    const a = buildBusinessCase({ ...DEFAULT_INPUTS, ramp: [...RAMPS.aggressive] })
    const c = buildBusinessCase({ ...DEFAULT_INPUTS, ramp: [...RAMPS.conservative] })
    expect(a.paybackMonths).toBeLessThan(c.paybackMonths)
    expect(a.npv).toBeGreaterThan(c.npv)
  })
  it('higher migration cost lowers NPV; higher maintenance raises it', () => {
    expect(buildBusinessCase({ ...DEFAULT_INPUTS, migrationCostPerLine: 90 }).npv).toBeLessThan(base.npv)
    expect(buildBusinessCase({ ...DEFAULT_INPUTS, maintenancePerSwitch: 1_800_000 }).npv).toBeGreaterThan(base.npv)
  })
  it('tornado is sorted by span and brackets the base case', () => {
    const t = tornado(DEFAULT_INPUTS)
    for (let i = 1; i < t.length; i++) expect(t[i - 1].span).toBeGreaterThanOrEqual(t[i].span)
    expect(t.every((x) => x.low <= 0 && x.high >= 0)).toBe(true)
  })
  it('reports plausible headline numbers', () => {
    expect(base.npv).toBeGreaterThan(0)
  })
})
