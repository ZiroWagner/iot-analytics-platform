import { describe, expect, it } from 'vitest'
import {
  CHART_COLORS,
  getAreaFillColor,
  getSeriesColor,
} from '@/features/analytics/domain/chart-colors'

describe('getSeriesColor', () => {
  it('returns palette colors in order for small indices', () => {
    expect(getSeriesColor(0)).toBe(CHART_COLORS[0])
    expect(getSeriesColor(1)).toBe(CHART_COLORS[1])
  })

  it('wraps around the palette for indices >= palette length', () => {
    expect(getSeriesColor(CHART_COLORS.length)).toBe(CHART_COLORS[0])
    expect(getSeriesColor(CHART_COLORS.length + 3)).toBe(CHART_COLORS[3])
  })
})

describe('getAreaFillColor', () => {
  it('appends a hex alpha suffix for semi-transparent fills', () => {
    expect(getAreaFillColor('#10b981')).toBe('#10b98120')
  })
})