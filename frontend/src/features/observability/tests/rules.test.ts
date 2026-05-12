import { describe, expect, it } from 'vitest'
import {
  getLagColorClass,
  getLagSeverity,
  LAG_CRITICAL_THRESHOLD,
  LAG_WARNING_THRESHOLD,
} from '../domain/rules'

describe('getLagSeverity', () => {
  it('returns "ok" for values within the warning threshold (inclusive)', () => {
    expect(getLagSeverity(0)).toBe('ok')
    expect(getLagSeverity(LAG_WARNING_THRESHOLD)).toBe('ok')
  })

  it('returns "warning" above the warning threshold and up to critical', () => {
    expect(getLagSeverity(LAG_WARNING_THRESHOLD + 1)).toBe('warning')
    expect(getLagSeverity(LAG_CRITICAL_THRESHOLD)).toBe('warning')
  })

  it('returns "critical" above the critical threshold', () => {
    expect(getLagSeverity(LAG_CRITICAL_THRESHOLD + 1)).toBe('critical')
    expect(getLagSeverity(999_999)).toBe('critical')
  })

  it('returns "ok" defensively for negative or non-finite values', () => {
    expect(getLagSeverity(-1)).toBe('ok')
    expect(getLagSeverity(Number.NaN)).toBe('ok')
    expect(getLagSeverity(Number.POSITIVE_INFINITY)).toBe('ok')
  })
})

describe('getLagColorClass', () => {
  it('maps severities to Tailwind color classes', () => {
    expect(getLagColorClass(0)).toBe('text-green-500')
    expect(getLagColorClass(LAG_WARNING_THRESHOLD + 1)).toBe('text-orange-500')
    expect(getLagColorClass(LAG_CRITICAL_THRESHOLD + 1)).toBe('text-red-500')
  })
})
