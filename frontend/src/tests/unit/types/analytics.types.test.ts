import { describe, expect, it } from 'vitest'
import {
  TIME_RANGE_MS,
  DEFAULT_WIDGET_CONFIG,
  SIZE_LABELS,
  CHART_TYPE_LABELS,
} from '@/features/analytics/domain/types'

describe('TIME_RANGE_MS', () => {
  it('converts preset time ranges to milliseconds', () => {
    expect(TIME_RANGE_MS['5m']).toBe(5 * 60 * 1000)
    expect(TIME_RANGE_MS['15m']).toBe(15 * 60 * 1000)
    expect(TIME_RANGE_MS['1h']).toBe(60 * 60 * 1000)
    expect(TIME_RANGE_MS['6h']).toBe(6 * 60 * 60 * 1000)
    expect(TIME_RANGE_MS['24h']).toBe(24 * 60 * 60 * 1000)
  })

  it('has exactly 5 presets', () => {
    expect(Object.keys(TIME_RANGE_MS).length).toBe(5)
  })
})

describe('DEFAULT_WIDGET_CONFIG', () => {
  it('has all required default properties', () => {
    expect(DEFAULT_WIDGET_CONFIG.size).toBe('md')
    expect(DEFAULT_WIDGET_CONFIG.timeRange).toBe('15m')
    expect(DEFAULT_WIDGET_CONFIG.showGrid).toBe(true)
    expect(DEFAULT_WIDGET_CONFIG.showLegend).toBe(true)
    expect(DEFAULT_WIDGET_CONFIG.showReferenceLines).toBe(false)
    expect(DEFAULT_WIDGET_CONFIG.yAxisAutoRange).toBe(true)
    expect(DEFAULT_WIDGET_CONFIG.refreshInterval).toBe(3000)
  })
})

describe('SIZE_LABELS', () => {
  it('maps all widget sizes to labels', () => {
    expect(SIZE_LABELS.sm).toBe('1 columna')
    expect(SIZE_LABELS.md).toBe('2 columnas')
    expect(SIZE_LABELS.lg).toBe('3 columnas')
    expect(SIZE_LABELS.full).toBe('Ancho completo')
  })

  it('has exactly 4 size options', () => {
    expect(Object.keys(SIZE_LABELS).length).toBe(4)
  })
})

describe('CHART_TYPE_LABELS', () => {
  it('maps all chart types to labels', () => {
    expect(CHART_TYPE_LABELS.line).toBe('Línea')
    expect(CHART_TYPE_LABELS.bar).toBe('Barra')
    expect(CHART_TYPE_LABELS.area).toBe('Área')
  })

  it('has exactly 3 chart types', () => {
    expect(Object.keys(CHART_TYPE_LABELS).length).toBe(3)
  })
})