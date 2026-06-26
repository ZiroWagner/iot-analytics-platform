"use client"

import React, { useMemo } from 'react'
import {
  ComposedChart, Line, Bar, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Scatter
} from "recharts"
import { LineChart } from "lucide-react"
import { WidgetPlugin, WidgetPluginProps, WidgetConfigFormProps } from '../../domain/registry.types'
import { getAreaFillColor } from '../../domain/chart-colors'
import { detectAnomalies } from '../../domain/math-utils'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SeriesConfig } from '../../domain/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipEntry = { name: string; dataKey: string; color: string; value: number; payload: Record<string, any> }

// Custom tooltip for Recharts
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3 min-w-[180px]">
      <p className="text-[10px] text-muted-foreground mb-2 font-mono">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: TooltipEntry, idx: number) => {
          const isAnomaly = entry.payload.isAnomaly && entry.dataKey === entry.name
          const isForecast = entry.payload.isForecast

          return (
            <div key={`${entry.name}-${entry.dataKey}-${idx}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isAnomaly ? '#ef4444' : entry.color }}
                />
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {entry.name} {isForecast && '(Predicción)'}
                </span>
              </div>
              <span className={`text-xs font-semibold font-mono tabular-nums ${isAnomaly ? 'text-red-500' : ''}`}>
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Config form component
function ChartsConfigForm({ config, onChange }: WidgetConfigFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="anomaly-switch">Detección de anomalías (Z-Score)</Label>
        <input
          id="anomaly-switch"
          type="checkbox"
          checked={config.anomalyDetection || false}
          onChange={(e) => onChange({ ...config, anomalyDetection: e.target.checked })}
          className="h-4 w-4 rounded border-border bg-background accent-purple-600 focus:ring-1 focus:ring-purple-500 cursor-pointer"
        />
      </div>

      {config.anomalyDetection && (
        <div className="space-y-1.5">
          <Label htmlFor="anomaly-threshold">Umbral de anomalía (Z-Score)</Label>
          <Input
            id="anomaly-threshold"
            type="number"
            step="0.1"
            value={config.anomalyThreshold ?? 3.0}
            onChange={(e) => onChange({ ...config, anomalyThreshold: parseFloat(e.target.value) || 3.0 })}
            className="bg-background/60 h-9"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="forecast-switch">Proyección de tendencia (Regresión)</Label>
        <input
          id="forecast-switch"
          type="checkbox"
          checked={config.forecast || false}
          onChange={(e) => onChange({ ...config, forecast: e.target.checked })}
          className="h-4 w-4 rounded border-border bg-background accent-purple-600 focus:ring-1 focus:ring-purple-500 cursor-pointer"
        />
      </div>
    </div>
  )
}

// Custom legend with trend direction arrows
function CustomLegend({ payload, trendDirections, forecastEnabled }: { payload?: { value: string; color: string }[]; trendDirections?: Record<string, 'up' | 'down' | 'flat'>; forecastEnabled?: boolean }) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap gap-3 justify-center pt-2 text-xs">
      {payload.map((entry: { value: string; color: string }) => {
        const trend = forecastEnabled ? trendDirections?.[entry.value] : null
        return (
          <div key={entry.value} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.value}</span>
            {trend && (
              <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'}>
                {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Render component
function ChartsRender({ config, data, loading, trendDirections }: WidgetPluginProps) {
  // Pre-process data to inject Z-Score anomalies
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    let result = (data as Record<string, unknown>[]).map((pt) => ({ ...pt, isForecast: false, isAnomaly: false }))

    // 1. Anomaly Detection
    if (config.anomalyDetection) {
      config.series.forEach((s: SeriesConfig) => {
        const seriesKey = `${s.sensorName}:${s.metric}`
        const values = (data as Record<string, unknown>[]).map((pt) => Number(pt[seriesKey])).filter((val: number) => !isNaN(val))
        if (values.length > 0) {
          const anomalies = detectAnomalies(values, config.anomalyThreshold ?? 3.0)
          
          let valIndex = 0
          result = result.map((pt) => {
            const val = (pt as Record<string, unknown>)[seriesKey]
            if (typeof val === 'number') {
              const isAnom = anomalies[valIndex++]
              return {
                ...pt,
                isAnomaly: pt.isAnomaly || isAnom,
                [`${seriesKey}_anomaly`]: isAnom ? val : null
              }
            }
            return pt
          })
        }
      })
    }

    return result
  }, [data, config.series, config.anomalyDetection, config.anomalyThreshold])

  const hasMultipleYAxes = useMemo(() => {
    const axes = new Set(config.series.map((s: SeriesConfig) => s.yAxisId))
    return axes.size > 1
  }, [config.series])

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Procesando gráficos...</span>
        </div>
      </div>
    )
  }

  if (processedData.length === 0) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center text-muted-foreground text-xs">
        Sin datos históricos en el rango seleccionado.
      </div>
    )
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData} margin={{ top: 10, right: hasMultipleYAxes ? 40 : 10, left: -10, bottom: 0 }}>
          {config.showGrid && (
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
          <Tooltip content={<CustomTooltip />} />
          {config.showLegend && (
            <Legend
              content={<CustomLegend trendDirections={trendDirections} forecastEnabled={!!config.forecast} />}
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
              iconSize={8}
              iconType="circle"
            />
          )}

          {config.series.map((s: SeriesConfig) => {
            const seriesKey = `${s.sensorName}:${s.metric}`
            const color = s.color
            const yId = hasMultipleYAxes ? s.yAxisId : 'left'

            return (
              <React.Fragment key={seriesKey}>
                {/* Standard / Historical Line */}
                {s.chartType === 'area' && (
                  <Area
                    dataKey={(d) => d.isForecast ? null : d[seriesKey]}
                    name={seriesKey}
                    stroke={color}
                    fill={getAreaFillColor(color)}
                    yAxisId={yId}
                    isAnimationActive={false}
                    type="monotone"
                    strokeWidth={2}
                    fillOpacity={0.15}
                  />
                )}
                {s.chartType === 'bar' && (
                  <Bar
                    dataKey={(d) => d.isForecast ? null : d[seriesKey]}
                    name={seriesKey}
                    fill={color}
                    yAxisId={yId}
                    isAnimationActive={false}
                    radius={[2, 2, 0, 0]}
                    fillOpacity={0.8}
                    barSize={8}
                  />
                )}
                {s.chartType === 'line' && (
                  <Line
                    dataKey={(d) => d.isForecast ? null : d[seriesKey]}
                    name={seriesKey}
                    stroke={color}
                    yAxisId={yId}
                    isAnimationActive={false}
                    type="monotone"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                )}

                {/* Highlight Anomalies */}
                {config.anomalyDetection && (
                  <Scatter
                    dataKey={`${seriesKey}_anomaly`}
                    name={`Anomalía ${s.metric}`}
                    fill="#ef4444"
                    yAxisId={yId}
                    legendType="none"
                  />
                )}
              </React.Fragment>
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export const chartsPlugin: WidgetPlugin = {
  type: 'charts',
  name: 'Gráficos Analíticos',
  description: 'Gráficas de líneas, áreas y barras con detección de anomalías y predicciones.',
  icon: LineChart,
  defaultConfig: {
    size: 'md',
    timeRange: '15m',
    showGrid: true,
    showLegend: true,
    showReferenceLines: false,
    yAxisAutoRange: true,
    refreshInterval: 3000,
    type: 'charts',
    anomalyDetection: false,
    anomalyThreshold: 3.0,
    forecast: false,
  },
  ConfigFormComponent: ChartsConfigForm,
  RenderComponent: ChartsRender
}

export default chartsPlugin
