import { CHART_COLORS } from './chart-colors'
import {
  DEFAULT_WIDGET_CONFIG,
  type ChartWidgetConfig,
  type LegacyChartConfig,
} from './types'

/** Detect if layout_config is in the legacy (pre-series) format. */
export function isLegacyFormat(config: unknown[]): boolean {
  if (!Array.isArray(config) || config.length === 0) return false
  const first = config[0] as Record<string, unknown> | null
  if (!first || typeof first !== 'object') return false
  return 'metric' in first && !('series' in first)
}

/** Convert legacy ChartConfig[] into the new widget-oriented shape. */
export function migrateLegacyConfig(
  legacy: LegacyChartConfig[],
): ChartWidgetConfig[] {
  return legacy.map((old, idx) => {
    return {
      ...DEFAULT_WIDGET_CONFIG,
      id: old.id,
      title: old.title,
      series: [
        {
          id: `s_${old.id}`,
          sensorId: old.sensorId,
          sensorName: old.sensorName,
          metric: old.metric,
          chartType: 'line' as const,
          color: CHART_COLORS[idx % CHART_COLORS.length],
          yAxisId: 'left' as const,
          unit: '',
        },
      ],
      type: 'charts',
    } as ChartWidgetConfig
  })
}
