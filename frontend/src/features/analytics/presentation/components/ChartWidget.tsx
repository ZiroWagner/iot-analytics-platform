"use client"

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  X, Settings2,
  BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, Zap
} from "lucide-react"
import type {
  ChartWidgetConfig, TimeseriesPoint,
} from "../../domain/types"
import { httpAnalyticsRepository } from "../../infrastructure/analytics.repository"
import { useRealtimeSeries, useSocketStatus } from "@/features/telemetry"
import { widgetRegistry } from "../../domain/widget-registry"
import { projectFutureValues } from "../../domain/math-utils"


interface ChartWidgetProps {
  projectId: string
  config: ChartWidgetConfig
  timeFrom: string
  timeTo: string
  refreshInterval: number
  onRemove: () => void
  onEdit: () => void
}

export function ChartWidget({ projectId, config, timeFrom, timeTo, refreshInterval, onRemove, onEdit }: ChartWidgetProps) {
  const [historicalData, setHistoricalData] = useState<TimeseriesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const isFirstLoad = useRef(true)

  const wsConnected = useSocketStatus()

  // Fetch historical data (initial load + time range changes)
  const fetchHistoricalData = useCallback(async () => {
    if (config.series.length === 0) return

    try {
      const seriesParam = JSON.stringify(
        config.series.map(s => ({ sensorId: s.sensorId, metric: s.metric }))
      )
      const params: Record<string, string> = { series: seriesParam, limit: '150' }
      if (timeFrom) params.from = timeFrom
      if (timeTo) params.to = timeTo

      const result = await httpAnalyticsRepository.multiTimeseries(projectId, params)
      const showDate = timeFrom && timeTo &&
        (new Date(timeTo).getTime() - new Date(timeFrom).getTime()) > 86400000
      const enriched = result.map(pt => ({
        ...pt,
        timeLabel: showDate
          ? new Date(pt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }))
      setHistoricalData(enriched)
    } catch {
      // Retry on next fallback
    } finally {
      setLoading(false)
    }
  }, [projectId, config.series, timeFrom, timeTo])

  // Merge historical data with realtime WebSocket points
  const { data: data, isRealtime } = useRealtimeSeries(
    config.series.map(s => ({ sensorId: s.sensorId, sensorName: s.sensorName, metric: s.metric })),
    historicalData,
  )

  // Initial load immediately, subsequent changes debounced
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      fetchHistoricalData()
      return
    }
    const timeout = setTimeout(fetchHistoricalData, 300)
    return () => clearTimeout(timeout)
  }, [fetchHistoricalData])

  // Fallback poll to re-sync if WS missed events
  useEffect(() => {
    if (refreshInterval === 0) return
    const interval = setInterval(fetchHistoricalData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchHistoricalData, refreshInterval])

  // Compute trend directions from merged data
  const trendDirections = useMemo(() => {
    if (!config.forecast || !data || data.length < 2) return {} as Record<string, 'up' | 'down' | 'flat'>
    const directions: Record<string, 'up' | 'down' | 'flat'> = {}
    const forecastPointsCount = 10
    const degree = 2
    config.series.forEach((s) => {
      const key = `${s.sensorName}:${s.metric}`
      const values = data.map((pt: TimeseriesPoint) => Number(pt[key as keyof TimeseriesPoint])).filter((val: number) => !isNaN(val))
      if (values.length < 2) {
        directions[key] = 'flat'
        return
      }
      const forecast = projectFutureValues(values, forecastPointsCount, degree)
      if (forecast.length >= 2) {
        const first = forecast[0]
        const last = forecast[forecast.length - 1]
        const diff = last - first
        const threshold = Math.max(Math.abs((first + last) / 2) * 0.01, 0.1)
        directions[key] = diff > threshold ? 'up' : diff < -threshold ? 'down' : 'flat'
      } else {
        directions[key] = 'flat'
      }
    })
    return directions
  }, [config.forecast, config.series, data])

  const plugin = useMemo(() => {
    return widgetRegistry.get(config.type ?? 'charts') ?? widgetRegistry.get('charts')!
  }, [config.type])

  const RenderComponent = plugin?.RenderComponent

  const chartContent = RenderComponent ? (
    <RenderComponent
      config={config}
      data={data}
      isLive={isRealtime}
      loading={loading}
      trendDirections={trendDirections}
    />
  ) : null

  return (
    <Card className="border-border/60 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col group relative overflow-hidden bg-card/50 backdrop-blur-sm">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/60 via-emerald-500/40 to-cyan-500/60" />

      <CardHeader className="pb-1 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1 shrink-0 text-purple-400">
              {plugin.icon ? (
                React.createElement(plugin.icon, { className: "h-3.5 w-3.5" })
              ) : (
                config.series.slice(0, 3).map((s) => (
                  <span key={s.id} title={s.chartType} style={{ color: s.color }}>
                    {s.chartType === 'line' && <LineChartIcon className="h-3.5 w-3.5" />}
                    {s.chartType === 'bar' && <BarChart3 className="h-3.5 w-3.5" />}
                    {s.chartType === 'area' && <AreaChartIcon className="h-3.5 w-3.5" />}
                  </span>
                ))
              )}
            </div>
            <h3 className="text-sm font-semibold truncate">{config.title}</h3>
            {isRealtime && wsConnected && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full" title="Real-time updates via WebSocket">
                <Zap className="h-2.5 w-2.5" />
                Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          {config.series.map((s) => {
            const key = `${s.sensorName}:${s.metric}`
            const trend = trendDirections[key]
            return (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/50 text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.metric}{s.unit ? ` (${s.unit})` : ''}
                {trend && (
                  <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'}>
                    {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192'}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-[260px] p-2 pt-0">
        {chartContent}
      </CardContent>
    </Card>
  )
}
