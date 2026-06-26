import { describe, expect, it } from 'vitest'
import {
  getLagColorClass,
  getLagSeverity,
  getPendingSeverity,
  getPendingColorClass,
  getRedisMemorySeverity,
  getRedisMemoryColorClass,
  formatRedisMemory,
  LAG_CRITICAL_THRESHOLD,
  LAG_WARNING_THRESHOLD,
  PENDING_WARNING_THRESHOLD,
  PENDING_CRITICAL_THRESHOLD,
  REDIS_MEMORY_WARNING_BYTES,
  REDIS_MEMORY_CRITICAL_BYTES,
} from '@/features/observability/domain/rules'

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

describe('getPendingSeverity', () => {
  it('returns "ok" within warning threshold', () => {
    expect(getPendingSeverity(0)).toBe('ok')
    expect(getPendingSeverity(PENDING_WARNING_THRESHOLD)).toBe('ok')
  })

  it('returns "warning" above warning threshold and up to critical', () => {
    expect(getPendingSeverity(PENDING_WARNING_THRESHOLD + 1)).toBe('warning')
    expect(getPendingSeverity(PENDING_CRITICAL_THRESHOLD)).toBe('warning')
  })

  it('returns "critical" above critical threshold', () => {
    expect(getPendingSeverity(PENDING_CRITICAL_THRESHOLD + 1)).toBe('critical')
  })

  it('returns "ok" for negative or non-finite values', () => {
    expect(getPendingSeverity(-1)).toBe('ok')
    expect(getPendingSeverity(Number.NaN)).toBe('ok')
  })
})

describe('getRedisMemorySeverity', () => {
  it('returns "ok" below warning threshold', () => {
    expect(getRedisMemorySeverity(0)).toBe('ok')
    expect(getRedisMemorySeverity(REDIS_MEMORY_WARNING_BYTES)).toBe('ok')
  })

  it('returns "warning" above warning and up to critical', () => {
    expect(getRedisMemorySeverity(REDIS_MEMORY_WARNING_BYTES + 1)).toBe('warning')
    expect(getRedisMemorySeverity(REDIS_MEMORY_CRITICAL_BYTES)).toBe('warning')
  })

  it('returns "critical" above critical threshold', () => {
    expect(getRedisMemorySeverity(REDIS_MEMORY_CRITICAL_BYTES + 1)).toBe('critical')
  })
})

describe('getPendingColorClass', () => {
  it('maps pending severities to Tailwind color classes', () => {
    expect(getPendingColorClass(0)).toBe('text-green-500')
    expect(getPendingColorClass(PENDING_WARNING_THRESHOLD + 1)).toBe('text-orange-500')
    expect(getPendingColorClass(PENDING_CRITICAL_THRESHOLD + 1)).toBe('text-red-500')
  })
})

describe('getRedisMemoryColorClass', () => {
  it('maps redis memory severities to Tailwind color classes', () => {
    expect(getRedisMemoryColorClass(0)).toBe('text-emerald-500')
    expect(getRedisMemoryColorClass(REDIS_MEMORY_WARNING_BYTES + 1)).toBe('text-orange-500')
    expect(getRedisMemoryColorClass(REDIS_MEMORY_CRITICAL_BYTES + 1)).toBe('text-red-500')
  })
})

describe('formatRedisMemory', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatRedisMemory(0)).toBe('0 B')
  })

  it('formats bytes in KB', () => {
    const result = formatRedisMemory(2048)
    expect(result).toMatch(/\d+\.\d KB/)
  })

  it('formats bytes in MB', () => {
    const result = formatRedisMemory(1048576)
    expect(result).toMatch(/\d+\.\d MB/)
  })

  it('formats bytes in GB', () => {
    const result = formatRedisMemory(1073741824)
    expect(result).toMatch(/\d+\.\d GB/)
  })
})
