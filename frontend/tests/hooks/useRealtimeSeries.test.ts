import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { useRealtimeSeries } from '@/features/telemetry/presentation/hooks/useRealtimeSeries'
import { useTelemetryStore } from '@/features/telemetry/presentation/store'
import type { TimeseriesPoint } from '@/features/analytics/domain/types'

function makePoint(
  overrides: Partial<{
    sensorId: string
    metric: string
    value: number
    timestamp: string
    deviceId: string
  }> = {},
) {
  return {
    sensorId: 's1',
    metric: 'temperature',
    value: 22.5,
    timestamp: '2026-01-01T00:00:00Z',
    deviceId: 'd1',
    ...overrides,
  }
}

function makeHistorical(
  timestamp: string,
  timeLabel: string,
  extra: Record<string, unknown> = {},
): TimeseriesPoint {
  return { timestamp, timeLabel, ...extra }
}

describe('useRealtimeSeries', () => {
  beforeEach(() => {
    useTelemetryStore.setState({ realtimePoints: [] })
  })

  it('returns empty data for empty seriesConfig', () => {
    const { result } = renderHook(() => useRealtimeSeries([], []))

    expect(result.current).toEqual({
      data: [],
      isRealtime: false,
      lastUpdate: null,
    })
  })

  it('returns historical data when no realtime points', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]
    const historical: TimeseriesPoint[] = [
      makeHistorical('2026-01-01T00:00:00Z', '00:00', { 's1:temperature': 22 }),
      makeHistorical('2026-01-01T00:01:00Z', '00:01', { 's1:temperature': 23 }),
    ]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, historical))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data[0]).toMatchObject({
      timestamp: '2026-01-01T00:00:00Z',
      timeLabel: '00:00',
      's1:temperature': 22,
    })
    expect(result.current.data[1]).toMatchObject({
      timestamp: '2026-01-01T00:01:00Z',
      timeLabel: '00:01',
      's1:temperature': 23,
    })
    expect(result.current.isRealtime).toBe(false)
  })

  it('merges realtime points into existing historical timestamps', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]
    const historical: TimeseriesPoint[] = [
      makeHistorical('2026-01-01T00:00:00Z', '00:00', { 's1:temperature': 22 }),
    ]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, historical))

    act(() => {
      useTelemetryStore.setState({
        realtimePoints: [makePoint({ timestamp: '2026-01-01T00:00:00Z', value: 25 })],
      })
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0]).toMatchObject({
      timestamp: '2026-01-01T00:00:00Z',
      timeLabel: '00:00',
      's1:temperature': 25,
    })
  })

  it('creates new entries for realtime points at unseen timestamps', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]
    const historical: TimeseriesPoint[] = [
      makeHistorical('2026-01-01T00:00:00Z', '00:00', { 's1:temperature': 22 }),
    ]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, historical))

    act(() => {
      useTelemetryStore.setState({
        realtimePoints: [makePoint({ timestamp: '2026-01-01T00:05:00Z', value: 30 })],
      })
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data[0]).toMatchObject({
      timestamp: '2026-01-01T00:00:00Z',
      's1:temperature': 22,
    })
    expect(result.current.data[1]).toMatchObject({
      timestamp: '2026-01-01T00:05:00Z',
      's1:temperature': 30,
    })
  })

  it('skips realtime points that do not match any series config', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]
    const historical: TimeseriesPoint[] = [
      makeHistorical('2026-01-01T00:00:00Z', '00:00', { 's1:temperature': 22 }),
    ]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, historical))

    // realtime point sensorId 'other' does not match series sensorName 's1'
    act(() => {
      useTelemetryStore.setState({
        realtimePoints: [makePoint({ sensorId: 'other', metric: 'temperature', value: 99 })],
      })
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0]).toMatchObject({
      's1:temperature': 22,
    })
  })

  it('last value wins when multiple realtime points share the same timestamp', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, []))

    act(() => {
      useTelemetryStore.setState({
        realtimePoints: [
          makePoint({ timestamp: '2026-01-01T00:00:00Z', value: 10 }),
          makePoint({ timestamp: '2026-01-01T00:00:00Z', value: 20 }),
        ],
      })
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0]).toMatchObject({
      's1:temperature': 20,
    })
  })

  it('handles historical points with mixed timestamp types', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]
    const dateObj = new Date('2026-06-15T12:00:00Z')
    const historical = [
      makeHistorical('2026-01-01T00:00:00Z', '00:00', { 's1:temperature': 22 }),
      // @ts-expect-error TimeseriesPoint expects string, but the hook handles Date objects
      makeHistorical(dateObj, '12:00', { 's1:temperature': 25 }),
    ]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, historical))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data[0].timestamp).toBe('2026-01-01T00:00:00Z')
    // Date objects should be normalized to ISO string
    expect(result.current.data[1].timestamp).toBe('2026-06-15T12:00:00.000Z')
  })

  it('returns only timeLabel + timestamp for historical points without metric keys', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]
    const historical: TimeseriesPoint[] = [
      makeHistorical('2026-01-01T00:00:00Z', '00:00'),
    ]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, historical))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0]).toMatchObject({
      timestamp: '2026-01-01T00:00:00Z',
      timeLabel: '00:00',
    })
    expect(Object.keys(result.current.data[0])).toEqual(['timestamp', 'timeLabel'])
  })

  it('sorts data chronologically by timestamp', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]
    const historical: TimeseriesPoint[] = [
      makeHistorical('2026-01-01T00:02:00Z', '00:02', { 's1:temperature': 23 }),
      makeHistorical('2026-01-01T00:00:00Z', '00:00', { 's1:temperature': 22 }),
      makeHistorical('2026-01-01T00:01:00Z', '00:01', { 's1:temperature': 21 }),
    ]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, historical))

    expect(result.current.data).toHaveLength(3)
    expect(result.current.data[0]['s1:temperature']).toBe(22)
    expect(result.current.data[1]['s1:temperature']).toBe(21)
    expect(result.current.data[2]['s1:temperature']).toBe(23)
  })

  it('tracks isRealtime flipping from false to true after realtime points arrive', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, []))

    expect(result.current.isRealtime).toBe(false)
    expect(result.current.lastUpdate).toBeNull()

    act(() => {
      useTelemetryStore.setState({
        realtimePoints: [makePoint({ value: 25 })],
      })
    })

    expect(result.current.isRealtime).toBe(true)
    expect(result.current.lastUpdate).toEqual(expect.any(Number))
  })

  it('handles multiple series with distinct sensor/metric combos', () => {
    const seriesConfig = [
      { sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' },
      { sensorId: 'uuid-2', sensorName: 's2', metric: 'humidity' },
    ]
    const historical: TimeseriesPoint[] = [
      makeHistorical('2026-01-01T00:00:00Z', '00:00', {
        's1:temperature': 22,
        's2:humidity': 60,
      }),
    ]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, historical))

    act(() => {
      useTelemetryStore.setState({
        realtimePoints: [
          makePoint({ sensorId: 's1', metric: 'temperature', value: 25 }),
          makePoint({ sensorId: 's2', metric: 'humidity', value: 55 }),
        ],
      })
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0]).toMatchObject({
      's1:temperature': 25,
      's2:humidity': 55,
    })
  })

  it('creates timeLabel from timestamp for realtime-only entries', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, []))

    act(() => {
      useTelemetryStore.setState({
        realtimePoints: [makePoint({ timestamp: '2026-01-01T12:30:00Z' })],
      })
    })

    expect(result.current.data).toHaveLength(1)
    // timeLabel should be a locale-specific time string
    expect(result.current.data[0].timeLabel).toBeDefined()
    expect(typeof result.current.data[0].timeLabel).toBe('string')
  })

  it('returns empty data when seriesConfig has entries but no matching data arrives', () => {
    const seriesConfig = [{ sensorId: 'uuid-1', sensorName: 's1', metric: 'temperature' }]

    const { result } = renderHook(() => useRealtimeSeries(seriesConfig, []))

    expect(result.current.data).toHaveLength(0)
  })
})
