const cad0 = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })

/** CAD with k/M/B suffix, e.g. $2.1M */
export function fmtMoney(n: number, digits = 1): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(digits)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(digits)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}k`
  return cad0.format(n)
}

export function fmtNum(n: number, digits = 1): string {
  const abs = Math.abs(n)
  if (abs >= 1e6) return `${(n / 1e6).toFixed(digits)}M`
  if (abs >= 1e4) return `${(n / 1e3).toFixed(digits === 0 ? 0 : 1)}k`
  return Math.round(n).toLocaleString('en-CA')
}

export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-CA')
export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`
export const fmtMonths = (n: number) => (Number.isFinite(n) ? `${n.toFixed(1)} mo` : 'n/a')
export const fmtSigned = (n: number, fmt: (x: number) => string) => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`
