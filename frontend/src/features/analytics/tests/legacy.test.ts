import { describe, expect, it } from 'vitest'
import { isLegacyFormat, migrateLegacyConfig } from '../domain/legacy'
import { CHART_COLORS } from '../domain/chart-colors'
import { DEFAULT_WIDGET_CONFIG, type LegacyChartConfig } from '../domain/types'

describe('isLegacyFormat', () => {
  it('returns false for empty or non-array inputs', () => {
    expect(isLegacyFormat([])).toBe(false)
    // @ts-expect-error defensive: runtime may pass non-arrays
    expect(isLegacyFormat(null)).toBe(false)
    // @ts-expect-error defensive: runtime may pass non-arrays
    expect(isLegacyFormat(undefined)).toBe(false)
  })

  it('returns true when first item has legacy shape (metric, no series)', () => {
    expect(
      isLegacyFormat([{ id: '1', sensorId: 's', metric: 'temp', title: 't' }]),
    ).toBe(true)
  })

  it('returns false when first item already uses the new series-based shape', () => {
    expect(isLegacyFormat([{ id: '1', series: [] }])).toBe(false)
  })

  it('returns false when first item is not an object', () => {
    expect(isLegacyFormat([null])).toBe(false)
    expect(isLegacyFormat(['string'])).toBe(false)
  })
})

describe('migrateLegacyConfig', () => {
  const legacy: LegacyChartConfig[] = [
    { id: 'a', sensorId: 's1', sensorName: 'Sensor 1', metric: 'temp', title: 'Temp' },
    { id: 'b', sensorId: 's2', sensorName: 'Sensor 2', metric: 'hum', title: 'Hum' },
  ]

  it('maps each legacy entry to a single-series widget preserving id/title', () => {
    const result = migrateLegacyConfig(legacy)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('a')
    expect(result[0].title).toBe('Temp')
    expect(result[0].series).toHaveLength(1)
    expect(result[0].series[0]).toMatchObject({
      id: 's_a',
      sensorId: 's1',
      sensorName: 'Sensor 1',
      metric: 'temp',
      chartType: 'line',
      yAxisId: 'left',
      unit: '',
    })
  })

  it('assigns colors cycling through the palette by index', () => {
    const result = migrateLegacyConfig(legacy)
    expect(result[0].series[0].color).toBe(CHART_COLORS[0])
    expect(result[1].series[0].color).toBe(CHART_COLORS[1])
  })

  it('applies DEFAULT_WIDGET_CONFIG defaults to each migrated widget', () => {
    const [widget] = migrateLegacyConfig(legacy)
    expect(widget.size).toBe(DEFAULT_WIDGET_CONFIG.size)
    expect(widget.timeRange).toBe(DEFAULT_WIDGET_CONFIG.timeRange)
    expect(widget.refreshInterval).toBe(DEFAULT_WIDGET_CONFIG.refreshInterval)
    expect(widget.showGrid).toBe(DEFAULT_WIDGET_CONFIG.showGrid)
    expect(widget.yAxisAutoRange).toBe(DEFAULT_WIDGET_CONFIG.yAxisAutoRange)
  })

  it('handles an empty legacy array', () => {
    expect(migrateLegacyConfig([])).toEqual([])
  })
})
