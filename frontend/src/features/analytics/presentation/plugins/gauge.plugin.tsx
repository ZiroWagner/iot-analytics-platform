"use client"

import React from 'react'
import { Activity } from "lucide-react"
import { WidgetPlugin, WidgetPluginProps, WidgetConfigFormProps } from '../../domain/registry.types'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SeriesConfig } from '../../domain/types'

function GaugeConfigForm({ config, onChange, availableMetrics }: WidgetConfigFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="gauge-min">Valor Mínimo</Label>
          <Input
            id="gauge-min"
            type="number"
            value={config.gaugeMin ?? 0}
            onChange={(e) => onChange({ ...config, gaugeMin: parseFloat(e.target.value) ?? 0 })}
            className="bg-background/60 h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gauge-max">Valor Máximo</Label>
          <Input
            id="gauge-max"
            type="number"
            value={config.gaugeMax ?? 100}
            onChange={(e) => onChange({ ...config, gaugeMax: parseFloat(e.target.value) ?? 100 })}
            className="bg-background/60 h-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="gauge-warn">Límite Advertencia</Label>
          <Input
            id="gauge-warn"
            type="number"
            value={config.warningThreshold ?? 70}
            onChange={(e) => onChange({ ...config, warningThreshold: parseFloat(e.target.value) ?? 70 })}
            className="bg-background/60 h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gauge-crit">Límite Crítico</Label>
          <Input
            id="gauge-crit"
            type="number"
            value={config.criticalThreshold ?? 90}
            onChange={(e) => onChange({ ...config, criticalThreshold: parseFloat(e.target.value) ?? 90 })}
            className="bg-background/60 h-9"
          />
        </div>
      </div>
    </div>
  )
}

function GaugeRender({ config, data, isLive, loading }: WidgetPluginProps) {
  // Extract latest value from data
  const latestValue = React.useMemo(() => {
    if (!data || data.length === 0) return null
    const latestPoint = data[data.length - 1]
    
    // Find the first series key
    const firstSeries = config.series[0]
    if (!firstSeries) return null
    const key = `${firstSeries.sensorName}:${firstSeries.metric}`
    const val = latestPoint[key]
    return typeof val === 'number' ? val : null
  }, [data, config.series])

  const min = config.gaugeMin ?? 0
  const max = config.gaugeMax ?? 100
  const val = latestValue ?? min

  // Calculate percentage of gauge filled
  const percentage = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100))
  
  // Color mapping based on thresholds
  const warning = config.warningThreshold ?? 70
  const critical = config.criticalThreshold ?? 90
  
  const getStatusColor = () => {
    if (val >= critical) return 'stroke-red-500 text-red-500'
    if (val >= warning) return 'stroke-yellow-500 text-yellow-500'
    return 'stroke-purple-500 text-purple-500'
  }

  const getStatusBgColor = () => {
    if (val >= critical) return 'bg-red-500/10 border-red-500/20'
    if (val >= warning) return 'bg-yellow-500/10 border-yellow-500/20'
    return 'bg-purple-500/10 border-purple-500/20'
  }

  const seriesInfo = config.series[0]
  const unit = seriesInfo?.unit || ''

  if (loading && latestValue === null) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (latestValue === null) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center text-muted-foreground text-xs">
        Esperando telemetría...
      </div>
    )
  }

  // Semi-circle arc definitions: radius 70, center at (100, 100)
  // Arc length is pi * r = 219.9.
  const arcLength = 219.9
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-[240px]">
        <svg viewBox="0 0 200 120" className="w-full h-auto overflow-visible">
          {/* Background Track */}
          <path
            d="M 30,100 A 70,70 0 0,1 170,100"
            fill="none"
            stroke="hsl(var(--border) / 0.3)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Value Arc */}
          <path
            d="M 30,100 A 70,70 0 0,1 170,100"
            fill="none"
            className={`transition-all duration-500 ease-out ${getStatusColor()}`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
          />

          {/* Tick lines / sectors */}
          {/* Warn tick */}
          {warning !== undefined && warning > min && warning < max && (
            <line
              x1={100 + 64 * Math.cos(((warning - min) / (max - min) * Math.PI) - Math.PI)}
              y1={100 + 64 * Math.sin(((warning - min) / (max - min) * Math.PI) - Math.PI)}
              x2={100 + 76 * Math.cos(((warning - min) / (max - min) * Math.PI) - Math.PI)}
              y2={100 + 76 * Math.sin(((warning - min) / (max - min) * Math.PI) - Math.PI)}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              opacity="0.5"
            />
          )}

        </svg>

        {/* Text values */}
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center">
          <span className="text-2xl font-bold font-mono tracking-tight tabular-nums">
            {val.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border mt-1 font-semibold capitalize ${getStatusBgColor()}`}>
            {val >= critical ? 'crítico' : val >= warning ? 'advertencia' : 'óptimo'}
          </span>
        </div>
      </div>

      <div className="flex justify-between w-full max-w-[200px] text-[10px] text-muted-foreground mt-2 font-mono">
        <span>MÍN: {min}</span>
        <span>MÁX: {max}</span>
      </div>
    </div>
  )
}

export const gaugePlugin: WidgetPlugin = {
  type: 'gauge',
  name: 'Medidor Industrial (Gauge)',
  description: 'Un dial circular interactivo para monitorear una sola métrica en tiempo real.',
  icon: Activity,
  defaultConfig: {
    size: 'sm',
    timeRange: '15m',
    showGrid: false,
    showLegend: false,
    showReferenceLines: false,
    yAxisAutoRange: false,
    refreshInterval: 1000,
    type: 'gauge',
    gaugeMin: 0,
    gaugeMax: 100,
    warningThreshold: 70,
    criticalThreshold: 90
  },
  ConfigFormComponent: GaugeConfigForm,
  RenderComponent: GaugeRender
}

export default gaugePlugin
