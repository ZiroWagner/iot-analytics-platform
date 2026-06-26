"use client"

import React, { useMemo } from 'react'
import {
  ScatterChart, Scatter as RechartsScatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { Grid } from "lucide-react"
import { WidgetPlugin, WidgetPluginProps, WidgetConfigFormProps } from '../../domain/registry.types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ScatterConfigForm(_props: WidgetConfigFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <p className="text-xs text-muted-foreground">
        El gráfico de dispersión requiere exactamente dos series: la primera se mapeará al eje X y la segunda al eje Y.
      </p>
    </div>
  )
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: { payload: Record<string, unknown> }[] }) {
  if (!active || !payload || payload.length === 0) return null

  const dataPoint = payload[0].payload
  return (
    <div className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3 text-xs">
      <p className="text-[10px] text-muted-foreground mb-1.5 font-mono">{dataPoint.timeLabel as string}</p>
      <div className="space-y-1">
        <div>
          <span className="text-muted-foreground">Eje X ({dataPoint.xName as string}): </span>
          <span className="font-semibold font-mono">{(dataPoint.xVal as number).toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Eje Y ({dataPoint.yName as string}): </span>
          <span className="font-semibold font-mono">{(dataPoint.yVal as number).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 3) return 0
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0)
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0)
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0)
  const num = n * sumXY - sumX * sumY
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (den === 0) return 0
  return num / den
}

function ScatterRender({ config, data, loading }: WidgetPluginProps) {
  const xSeries = config.series[0]
  const ySeries = config.series[1]

  const { scatterData, correlation } = useMemo(() => {
    if (!data || data.length === 0 || !xSeries || !ySeries) {
      return { scatterData: [], correlation: 0 }
    }

    const xKey = `${xSeries.sensorName}:${xSeries.metric}`
    const yKey = `${ySeries.sensorName}:${ySeries.metric}`

    const points: { xVal: number; yVal: number; xName: string; yName: string; timeLabel: string }[] = []
    const xValues: number[] = []
    const yValues: number[] = []

    ;(data as Record<string, unknown>[]).forEach((pt: Record<string, unknown>) => {
      const xVal = Number(pt[xKey])
      const yVal = Number(pt[yKey])
      if (isNaN(xVal) || isNaN(yVal)) return
      points.push({ xVal, yVal, xName: xSeries.metric, yName: ySeries.metric, timeLabel: pt.timeLabel as string })
      xValues.push(xVal)
      yValues.push(yVal)
    })

    const r = pearsonCorrelation(xValues, yValues)

    return { scatterData: points, correlation: r }
  }, [data, xSeries, ySeries])

  const getCorrelationLabel = (r: number) => {
    const abs = Math.abs(r)
    if (abs < 0.1) return { text: 'Sin correlación', color: 'text-muted-foreground' }
    if (abs < 0.3) return { text: 'Correlación muy baja', color: 'text-muted-foreground' }
    if (abs < 0.5) return { text: 'Correlación baja', color: 'text-yellow-500' }
    if (abs < 0.7) return { text: 'Correlación moderada', color: 'text-yellow-500' }
    if (abs < 0.9) return { text: 'Correlación alta', color: 'text-emerald-500' }
    return { text: 'Correlación muy alta', color: 'text-emerald-500' }
  }

  const corrInfo = getCorrelationLabel(correlation)
  const direction = correlation >= 0 ? 'positiva' : 'negativa'

  if (!xSeries || !ySeries) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center text-muted-foreground text-xs text-center p-4">
        Añade exactamente 2 series en la pestaña &quot;Series&quot; para habilitar la dispersión XY.
      </div>
    )
  }

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (scatterData.length === 0) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center text-muted-foreground text-xs">
        Esperando datos combinados...
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
        <span className="text-[10px] text-muted-foreground">
          {xSeries.metric} vs {ySeries.metric}
        </span>
        <span className={`text-[10px] font-medium ${corrInfo.color}`}>
          r = {correlation.toFixed(3)} — {corrInfo.text} {direction}
        </span>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
          {config.showGrid && (
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="hsl(var(--border) / 0.3)" />
          )}
          <XAxis
            type="number"
            dataKey="xVal"
            name={xSeries.metric}
            unit={xSeries.unit}
            tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.8 }}
            stroke="hsl(var(--border))"
            axisLine={{ strokeOpacity: 0.3 }}
          />
          <YAxis
            type="number"
            dataKey="yVal"
            name={ySeries.metric}
            unit={ySeries.unit}
            tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.8 }}
            stroke="hsl(var(--border))"
            axisLine={{ strokeOpacity: 0.3 }}
          />
          <Tooltip content={<ScatterTooltip />} />
          <RechartsScatter
            name="Puntos"
            data={scatterData}
            fill={xSeries.color || 'hsl(var(--primary))'}
          />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export const scatterPlugin: WidgetPlugin = {
  type: 'scatter',
  name: 'Dispersión XY',
  description: 'Compara dos variables diferentes en coordenadas cartesianas para buscar correlaciones.',
  icon: Grid,
  defaultConfig: {
    size: 'md',
    timeRange: '15m',
    showGrid: true,
    showLegend: false,
    showReferenceLines: false,
    yAxisAutoRange: true,
    refreshInterval: 3000,
    type: 'scatter',
  },
  ConfigFormComponent: ScatterConfigForm,
  RenderComponent: ScatterRender
}

export default scatterPlugin
