import { describe, expect, it } from 'vitest'
import {
  TIME_RANGE_MS,
  DEFAULT_WIDGET_CONFIG,
  SIZE_LABELS,
  CHART_TYPE_LABELS,
} from '@/features/analytics/domain/types'

describe('TIME_RANGE_MS', () => {
  it('defines correct milliseconds for each time preset', () => {
    expect(TIME_RANGE_MS['5m']).toBe(5 * 60 * 1000)
    expect(TIME_RANGE_MS['15m']).toBe(15 * 60 * 1000)
    expect(TIME_RANGE_MS['1h']).toBe(60 * 60 * 1000)
    expect(TIME_RANGE_MS['6h']).toBe(6 * 60 * 60 * 1000)
    expect(TIME_RANGE_MS['24h']).toBe(24 * 60 * 60 * 1000)
  })

  it('covers all five non-custom presets', () => {
    expect(Object.keys(TIME_RANGE_MS)).toHaveLength(5)
  })
})

describe('DEFAULT_WIDGET_CONFIG', () => {
  it('has expected default values', () => {
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
  it('provides labels for all four widget sizes', () => {
    expect(Object.keys(SIZE_LABELS)).toEqual(['sm', 'md', 'lg', 'full'])
    expect(SIZE_LABELS.sm).toBe('1 columna')
    expect(SIZE_LABELS.md).toBe('2 columnas')
    expect(SIZE_LABELS.lg).toBe('3 columnas')
    expect(SIZE_LABELS.full).toBe('Ancho completo')
  })
})

describe('CHART_TYPE_LABELS', () => {
  it('provides labels for all three chart types', () => {
    expect(CHART_TYPE_LABELS.line).toBe('Línea')
    expect(CHART_TYPE_LABELS.bar).toBe('Barra')
    expect(CHART_TYPE_LABELS.area).toBe('Área')
  })
})