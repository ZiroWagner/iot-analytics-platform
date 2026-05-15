"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ComposedChart, Line, Bar, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Brush, ReferenceLine
} from "recharts"
import {
  X, Settings2, Grid3X3, TrendingUp,
  BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getAreaFillColor } from "../../domain/chart-colors"
import type {
  ChartWidgetConfig, TimeseriesPoint, MetricStats,
  TimeRangePreset, SeriesConfig
} from "../../domain/types"
import { TIME_RANGE_MS } from "../../domain/types"
import { httpAnalyticsRepository } from "../../infrastructure/analytics.repository"


interface ChartWidgetProps {
  projectId: string
  config: ChartWidgetConfig
  globalTimeRange: TimeRangePreset
  globalCustomDate?: string
  onRemove: () => void
  onEdit: () => void
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: string
  series: SeriesConfig[]
}

function CustomTooltip({ active, payload, label, series }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3 min-w-[180px]">
      <p className="text-[10px] text-muted-foreground mb-2 font-mono">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const seriesConfig = series.find(s => `${s.sensorName}:${s.metric}` === entry.dataKey)
          const unit = seriesConfig?.unit || ''
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {entry.dataKey}
                </span>
              </div>
              <span className="text-xs font-semibold font-mono tabular-nums">
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : '—'}
                {unit && <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChartWidget({ projectId, config, globalTimeRange, globalCustomDate, onRemove, onEdit }: ChartWidgetProps) {
  const [data, setData] = useState<TimeseriesPoint[]>([])
  const [stats, setStats] = useState<MetricStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showGrid, setShowGrid] = useState(config.showGrid)
  const [showRefLines, setShowRefLines] = useState(config.showReferenceLines)

  const effectiveTimeRange = config.timeRange === '15m' ? globalTimeRange : config.timeRange

  const getTimeParams = useCallback(() => {
    if (effectiveTimeRange === 'custom') {
      if (globalCustomDate) {
        return {
          from: new Date(`${globalCustomDate}T00:00:00.000Z`).toISOString(),
          to: new Date(`${globalCustomDate}T23:59:59.999Z`).toISOString()
        }
      }
      return { from: config.customFrom, to: config.customTo }
    }
    const ms = TIME_RANGE_MS[effectiveTimeRange]
    const now = Date.now()
    return {
      from: new Date(now - ms).toISOString(),
      to: new Date(now).toISOString(),
    }
  }, [effectiveTimeRange, config.customFrom, config.customTo, globalCustomDate])

  const fetchData = useCallback(async () => {
    if (config.series.length === 0) return

    try {
      const seriesParam = JSON.stringify(
        config.series.map(s => ({ sensorId: s.sensorId, metric: s.metric }))
      )
      const timeParams = getTimeParams()
      const params: Record<string, string> = { series: seriesParam, limit: '150' }
      if (timeParams.from) params.from = timeParams.from
      if (timeParams.to) params.to = timeParams.to

      const result = await httpAnalyticsRepository.multiTimeseries(projectId, params)
      setData(result)
    } catch {
      // Retry on next interval
    } finally {
      setLoading(false)
    }
  }, [projectId, config.series, getTimeParams])

  const fetchStats = useCallback(async () => {
    if (!showRefLines || config.series.length === 0) return

    try {
      const timeParams = getTimeParams()
      const results = await Promise.all(
        config.series.map(s => {
          const params: Record<string, string> = { sensorId: s.sensorId, metric: s.metric }
          if (timeParams.from) params.from = timeParams.from
          if (timeParams.to) params.to = timeParams.to
          return httpAnalyticsRepository.stats(projectId, params)
        })
      )
      setStats(results)
    } catch {
      // Non-critical
    }
  }, [projectId, config.series, showRefLines, getTimeParams])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData()
      fetchStats()
    }, 0)
    const interval = setInterval(fetchData, config.refreshInterval)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetchData, fetchStats, config.refreshInterval])

  const hasMultipleYAxes = useMemo(() => {
    const axes = new Set(config.series.map(s => s.yAxisId))
    return axes.size > 1
  }, [config.series])

  const renderSeries = () => {
    return config.series.map((s) => {
      const seriesKey = `${s.sensorName}:${s.metric}`
      const props = {
        dataKey: seriesKey,
        stroke: s.color,
        fill: s.chartType === 'area' ? getAreaFillColor(s.color) : s.color,
        yAxisId: hasMultipleYAxes ? s.yAxisId : 'left',
        isAnimationActive: false,
      }

      switch (s.chartType) {
        case 'bar':
          return <Bar key={seriesKey} {...props} radius={[2, 2, 0, 0]} fillOpacity={0.8} barSize={8} />
        case 'area':
          return (
            <Area
              key={seriesKey}
              {...props}
              type="monotone"
              strokeWidth={2}
              fillOpacity={0.15}
              fill={s.color}
            />
          )
        case 'line':
        default:
          return (
            <Line
              key={seriesKey}
              {...props}
              type="monotone"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          )
      }
    })
  }

  const renderReferenceLines = () => {
    if (!showRefLines || stats.length === 0) return null

    return stats.map((st, idx) => {
      const s = config.series[idx]
      if (!s) return null
      return (
        <React.Fragment key={`ref-${s.id}`}>
          <ReferenceLine
            y={st.avg}
            yAxisId={hasMultipleYAxes ? s.yAxisId : 'left'}
            stroke={s.color}
            strokeDasharray="6 3"
            strokeOpacity={0.5}
            label={{
              value: `μ=${st.avg.toFixed(1)}`,
              position: 'right',
              fill: s.color,
              fontSize: 9,
            }}
          />
        </React.Fragment>
      )
    })
  }

  let chartContent = (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: hasMultipleYAxes ? 40 : 10, left: -10, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
          )}
          <XAxis
            dataKey="timeLabel"
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.8 }}
            tickMargin={8}
            stroke="hsl(var(--border))"
            axisLine={{ strokeOpacity: 0.3 }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.8 }}
            stroke="hsl(var(--border))"
            axisLine={{ strokeOpacity: 0.3 }}
            domain={config.yAxisAutoRange ? ['auto', 'auto'] : [config.yAxisMin ?? 'auto', config.yAxisMax ?? 'auto']}
          />
          {hasMultipleYAxes && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.8 }}
              stroke="hsl(var(--border))"
              axisLine={{ strokeOpacity: 0.3 }}
              domain={['auto', 'auto']}
            />
          )}
          <Tooltip content={<CustomTooltip series={config.series} />} />
          {config.showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
              iconSize={8}
              iconType="circle"
            />
          )}
          {renderSeries()}
          {renderReferenceLines()}
          {data.length > 20 && (
            <Brush
              dataKey="timeLabel"
              height={22}
              stroke="hsl(var(--border))"
              fill="hsl(var(--card))"
              travellerWidth={8}
              startIndex={Math.max(0, data.length - 50)}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )

  if (loading && data.length === 0) {
    chartContent = (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Cargando datos...</span>
        </div>
      </div>
    )
  } else if (data.length === 0) {
    chartContent = (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
        Sin datos para el rango seleccionado.
      </div>
    )
  }

  return (
    <Card className="border-border/60 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col group relative overflow-hidden bg-card/50 backdrop-blur-sm">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/60 via-emerald-500/40 to-cyan-500/60" />

      <CardHeader className="pb-1 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1 shrink-0">
              {config.series.slice(0, 3).map((s) => (
                <span key={s.id} title={s.chartType} style={{ color: s.color }}>
                  {s.chartType === 'line' && <LineChartIcon className="h-3.5 w-3.5" />}
                  {s.chartType === 'bar' && <BarChart3 className="h-3.5 w-3.5" />}
                  {s.chartType === 'area' && <AreaChartIcon className="h-3.5 w-3.5" />}
                </span>
              ))}
            </div>
            <h3 className="text-sm font-semibold truncate">{config.title}</h3>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost" size="icon"
              className={cn(
                "h-6 w-6 transition-colors",
                showGrid ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle grid"
            >
              <Grid3X3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className={cn(
                "h-6 w-6 transition-colors",
                showRefLines ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setShowRefLines(!showRefLines)}
              title="Toggle reference lines"
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
              title="Editar widget"
            >
              <Settings2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              title="Eliminar widget"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-1.5">
          {config.series.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/50 text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.metric}{s.unit ? ` (${s.unit})` : ''}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-[260px] p-2 pt-0">
        {chartContent}
      </CardContent>
    </Card>
  )
}
