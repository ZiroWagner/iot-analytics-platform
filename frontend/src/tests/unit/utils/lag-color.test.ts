import { describe, expect, it } from 'vitest'
import {
  getLagColorClass,
  getLagSeverity,
  LAG_WARNING_THRESHOLD,
  LAG_CRITICAL_THRESHOLD,
} from '@/features/observability/domain/rules'

describe('getLagColorClass', () => {
  it('returns green for lag within ok range', () => {
    expect(getLagColorClass(0)).toBe('text-green-500')
    expect(getLagColorClass(LAG_WARNING_THRESHOLD)).toBe('text-green-500')
  })

  it('returns orange for warning range', () => {
    expect(getLagColorClass(LAG_WARNING_THRESHOLD + 1)).toBe('text-orange-500')
    expect(getLagColorClass(LAG_CRITICAL_THRESHOLD)).toBe('text-orange-500')
  })

  it('returns red for critical range', () => {
    expect(getLagColorClass(LAG_CRITICAL_THRESHOLD + 1)).toBe('text-red-500')
    expect(getLagColorClass(10_000)).toBe('text-red-500')
  })

  it('returns green for negative or non-finite values', () => {
    expect(getLagColorClass(-5)).toBe('text-green-500')
    expect(getLagColorClass(NaN)).toBe('text-green-500')
    expect(getLagColorClass(Infinity)).toBe('text-green-500')
  })
})

describe('getLagSeverity (boundary conditions)', () => {
  it('handles exact boundary values', () => {
    expect(getLagSeverity(LAG_WARNING_THRESHOLD)).toBe('ok')
    expect(getLagSeverity(LAG_WARNING_THRESHOLD + 1)).toBe('warning')
    expect(getLagSeverity(LAG_CRITICAL_THRESHOLD)).toBe('warning')
    expect(getLagSeverity(LAG_CRITICAL_THRESHOLD + 1)).toBe('critical')
  })
})