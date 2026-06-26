/** Chart type for each individual series within a widget */
export type ChartSeriesType = 'line' | 'bar' | 'area'

/** Y-axis assignment for dual-axis support */
export type YAxisPosition = 'left' | 'right'

/** Available widget sizes in the grid layout */
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full'

/** Preset time ranges */
export type TimeRangePreset = '5m' | '15m' | '1h' | '6h' | '24h' | 'custom' | 'range'

/** Individual data series within a chart widget */
export interface SeriesConfig {
  id: string
  sensorId: string
  sensorName: string
  metric: string
  chartType: ChartSeriesType
  color: string
  yAxisId: YAxisPosition
  unit: string
}

/** Complete widget configuration — persisted to backend */
export interface ChartWidgetConfig {
  id: string
  title: string
  series: SeriesConfig[]
  size: WidgetSize
  timeRange: TimeRangePreset
  customFrom?: string
  customTo?: string
  showGrid: boolean
  showLegend: boolean
  showReferenceLines: boolean
  yAxisAutoRange: boolean
  yAxisMin?: number
  yAxisMax?: number
  refreshInterval: number
  type?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/** Available metric discovered from sensor data */
export interface AvailableMetric {
  sensorId: string
  sensorName: string
  gatewayId: string
  gatewayName: string
  availableMetrics: string[]
}

/** Timeseries data point from backend */
export interface TimeseriesPoint {
  timestamp: string
  timeLabel: string
  [key: string]: unknown
}

/** Statistical summary from backend */
export interface MetricStats {
  sensorId: string
  metric: string
  min: number
  max: number
  avg: number
  stddev: number
  count: number
}

/** Legacy chart config for migration */
export interface LegacyChartConfig {
  id: string
  sensorId: string
  sensorName: string
  metric: string
  title: string
}

/** Time range in milliseconds for each preset */
export const TIME_RANGE_MS: Record<Exclude<TimeRangePreset, 'custom' | 'range'>, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}

/** Default widget configuration */
export const DEFAULT_WIDGET_CONFIG: Omit<ChartWidgetConfig, 'id' | 'title' | 'series'> = {
  size: 'md',
  timeRange: '15m',
  showGrid: true,
  showLegend: true,
  showReferenceLines: false,
  yAxisAutoRange: true,
  refreshInterval: 3000,
}

/** Size labels for UI display */
export const SIZE_LABELS: Record<WidgetSize, string> = {
  sm: '1 columna',
  md: '2 columnas',
  lg: '3 columnas',
  full: 'Ancho completo',
}

/** Chart type labels for UI */
export const CHART_TYPE_LABELS: Record<ChartSeriesType, string> = {
  line: 'Línea',
  bar: 'Barra',
  area: 'Área',
}
