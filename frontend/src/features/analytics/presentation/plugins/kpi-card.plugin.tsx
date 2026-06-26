"use client"

import React from 'react'
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { WidgetPlugin, WidgetPluginProps, WidgetConfigFormProps } from '../../domain/registry.types'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SeriesConfig } from '../../domain/types'

function KPIConfigForm({ config, onChange, availableMetrics }: WidgetConfigFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="kpi-warn">Límite Advertencia</Label>
          <Input
            id="kpi-warn"
            type="number"
            value={config.warningThreshold ?? 70}
            onChange={(e) => onChange({ ...config, warningThreshold: parseFloat(e.target.value) ?? 70 })}
            className="bg-background/60 h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kpi-crit">Límite Crítico</Label>
          <Input
            id="kpi-crit"
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

function KPIRender({ config, data, isLive, loading }: WidgetPluginProps) {
  const seriesInfo = config.series[0]
  const key = seriesInfo ? `${seriesInfo.sensorName}:${seriesInfo.metric}` : ''
  const unit = seriesInfo?.unit || ''

  // Compute stats
  const { latest, trendPct, isUp, sparklinePath, isWarning, isCritical } = React.useMemo(() => {
    if (!data || data.length === 0 || !key) {
      return { latest: null, trendPct: 0, isUp: true, sparklinePath: '', isWarning: false, isCritical: false }
    }

    const values = data.map((pt: any) => Number(pt[key])).filter((val: number) => !isNaN(val))
    if (values.length === 0) {
      return { latest: null, trendPct: 0, isUp: true, sparklinePath: '', isWarning: false, isCritical: false }
    }

    const latestVal = values[values.length - 1]
    const firstVal = values[0]
    
    // Percentage trend
    let pct = 0
    if (firstVal !== 0) {
      pct = ((latestVal - firstVal) / firstVal) * 100
    }

    // Build sparkline path
    // Width=100, Height=24
    const w = 100
    const h = 24
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1

    const pathPoints = values.map((val: number, idx: number) => {
      const x = (idx / (values.length - 1)) * w
      const y = h - ((val - minVal) / range) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })

    const path = pathPoints.length > 1 ? `M ${pathPoints.join(' L ')}` : ''

    const warning = config.warningThreshold ?? 70
    const critical = config.criticalThreshold ?? 90

    return {
      latest: latestVal,
      trendPct: Math.abs(pct),
      isUp: latestVal >= firstVal,
      sparklinePath: path,
      isWarning: latestVal >= warning && latestVal < critical,
      isCritical: latestVal >= critical
    }
  }, [data, key, config.warningThreshold, config.criticalThreshold])

  if (loading && latest === null) {
    return (
      <div className="h-[120px] w-full flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (latest === null) {
    return (
      <div className="h-[120px] w-full flex items-center justify-center text-muted-foreground text-xs">
        Sin telemetría.
      </div>
    )
  }

  const getCardBorderColor = () => {
    if (isCritical) return 'border-red-500/30 text-red-500'
    if (isWarning) return 'border-yellow-500/30 text-yellow-500'
    return 'border-border/50 text-purple-400'
  }

  return (
    <div className="flex flex-col justify-between h-[120px] p-3 w-full">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
            Último valor
          </span>
          <span className="text-3xl font-extrabold font-mono tabular-nums text-foreground mt-1">
            {latest.toFixed(1)}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
          </span>
        </div>

        {/* Alert badge */}
        {(isWarning || isCritical) && (
          <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${
            isCritical ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
          }`}>
            <AlertCircle className="h-3 w-3" />
            {isCritical ? 'Crítico' : 'Alerta'}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mt-2 pt-2 border-t border-border/20">
        {/* Trend Indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center justify-center h-5 w-5 rounded-full ${
            isUp ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
          }`}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </span>
          <span className={`text-[10px] font-semibold font-mono ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
            {isUp ? '+' : '-'}{trendPct.toFixed(1)}%
          </span>
          <span className="text-[9px] text-muted-foreground font-mono">rango</span>
        </div>

        {/* SVG Sparkline */}
        {sparklinePath && (
          <svg className="w-[100px] h-[24px] overflow-visible" viewBox="0 0 100 24">
            <path
              d={sparklinePath}
              fill="none"
              stroke={isCritical ? 'hsl(var(--destructive))' : isWarning ? '#eab308' : 'hsl(var(--primary))'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  )
}

export const kpiCardPlugin: WidgetPlugin = {
  type: 'kpi',
  name: 'Tarjeta KPI',
  description: 'Un indicador numérico grande con sparklines e indicador de desviación porcentual.',
  icon: TrendingUp,
  defaultConfig: {
    size: 'sm',
    timeRange: '15m',
    showGrid: false,
    showLegend: false,
    showReferenceLines: false,
    yAxisAutoRange: false,
    refreshInterval: 3000,
    type: 'kpi',
    warningThreshold: 70,
    criticalThreshold: 90
  },
  ConfigFormComponent: KPIConfigForm,
  RenderComponent: KPIRender
}

export default kpiCardPlugin
