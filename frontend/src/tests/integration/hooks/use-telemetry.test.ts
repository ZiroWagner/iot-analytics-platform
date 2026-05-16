import { describe, expect, it, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSocketStatus } from '@/features/telemetry/presentation/hooks/useTelemetry'
import { useTelemetryStore } from '@/features/telemetry/presentation/store'

describe('useSocketStatus', () => {
  beforeEach(() => {
    useTelemetryStore.setState({ connected: false, devices: {}, systemMetrics: null })
  })

  it('returns false when not connected', () => {
    const { result } = renderHook(() => useSocketStatus())
    expect(result.current).toBe(false)
  })

  it('returns true when connected', () => {
    useTelemetryStore.setState({ connected: true, devices: {}, systemMetrics: null })

    const { result } = renderHook(() => useSocketStatus())
    expect(result.current).toBe(true)
  })
})