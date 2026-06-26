"use client"

import React, { useMemo } from 'react'
import { Calendar } from "lucide-react"
import { WidgetPlugin, WidgetPluginProps, WidgetConfigFormProps } from '../../domain/registry.types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { SeriesConfig } from '../../domain/types'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

const HEATMAP_PALETTES: Record<string, string[]> = {
  purple: ['bg-purple-500/15 border-purple-500/10', 'bg-purple-500/35 border-purple-500/20', 'bg-purple-500/65 border-purple-500/30 text-white', 'bg-purple-500 border-purple-600 text-white font-bold'],
  emerald: ['bg-emerald-500/15 border-emerald-500/10', 'bg-emerald-500/35 border-emerald-500/20', 'bg-emerald-500/65 border-emerald-500/30 text-white', 'bg-emerald-500 border-emerald-600 text-white font-bold'],
  amber: ['bg-amber-500/15 border-amber-500/10', 'bg-amber-500/35 border-amber-500/20', 'bg-amber-500/65 border-amber-500/30 text-white', 'bg-amber-500 border-amber-600 text-white font-bold'],
}

function HeatmapConfigForm({ config, onChange }: WidgetConfigFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="heatmap-color">Esquema de Color</Label>
        <Select
          value={config.heatmapColor || 'purple'}
          onValueChange={(val) => onChange({ ...config, heatmapColor: val })}
        >
          <SelectTrigger className="h-9 bg-background/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="purple">Púrpura Profundo</SelectItem>
            <SelectItem value="emerald">Esmeralda Energético</SelectItem>
            <SelectItem value="amber">Ámbar Eléctrico</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

type HeatmapCell = { avg: number; count: number }

function HeatmapRender({ config, data, isLive, loading }: WidgetPluginProps) {
  const seriesInfo = config.series[0]
  const key = seriesInfo ? `${seriesInfo.sensorName}:${seriesInfo.metric}` : ''
  const unit = seriesInfo?.unit || ''

  // Compute average per day/hour cell
  const { matrix, minVal, maxVal, hasData } = useMemo(() => {
    // Initialize 7x24 grid: matrix[day][hour] = { sum: 0, count: 0 }
    const grid: { sum: number; count: number }[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }))
    )

    if (!data || data.length === 0 || !key) {
      const emptyMatrix: HeatmapCell[][] = grid.map(row =>
        row.map(() => ({ avg: 0, count: 0 }))
      )
      return { matrix: emptyMatrix, minVal: 0, maxVal: 0, hasData: false }
    }

    data.forEach((pt: any) => {
      const val = Number(pt[key])
      if (isNaN(val)) return

      const date = new Date(pt.timestamp)
      const day = date.getDay()
      const hour = date.getHours()

      grid[day][hour].sum += val
      grid[day][hour].count += 1
    })

    let min = Infinity
    let max = -Infinity
    let anyData = false

    const finalMatrix: HeatmapCell[][] = grid.map((row) =>
      row.map((cell) => {
        if (cell.count === 0) return { avg: 0, count: 0 }
        anyData = true
        const avg = cell.sum / cell.count
        if (avg < min) min = avg
        if (avg > max) max = avg
        return { avg, count: cell.count }
      })
    )

    if (!anyData) return { matrix: finalMatrix, minVal: 0, maxVal: 0, hasData: false }
    if (min === max) max = min + 1 // prevent division by zero, show uniform color

    return { matrix: finalMatrix, minVal: min, maxVal: max, hasData: true }
  }, [data, key])

  const theme = config.heatmapColor || 'purple'
  const paletteColors = HEATMAP_PALETTES[theme] ?? HEATMAP_PALETTES.purple

  const getCellColor = (cell: HeatmapCell) => {
    if (cell.count === 0) return 'bg-transparent border-dashed border-border/20'
    if (!hasData) return 'bg-accent/10 border-border/20'
    const intensity = (cell.avg - minVal) / (maxVal - minVal || 1)
    if (intensity < 0.25) return paletteColors[0]
    if (intensity < 0.5) return paletteColors[1]
    if (intensity < 0.75) return paletteColors[2]
    return paletteColors[3]
  }

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center text-muted-foreground text-xs">
        Sin históricos disponibles.
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col p-2 select-none overflow-x-auto">
      <div className="min-w-[560px] space-y-0.5">
        {/* Hours header */}
        <div className="grid grid-cols-[36px_repeat(24,_1fr)] gap-px mb-0.5">
          <div />
          {HOURS.map((hr, idx) => (
            <div key={hr} className="text-[8px] text-center text-muted-foreground font-mono leading-none" title={hr}>
              {idx % 4 === 0 ? hr.split(':')[0] : ''}
            </div>
          ))}
        </div>

        {/* Days grid */}
        {DAYS.map((dayName, dayIdx) => (
          <div key={dayName} className="grid grid-cols-[36px_repeat(24,_1fr)] gap-px items-center">
            <div className="text-[9px] font-semibold text-muted-foreground font-mono text-right pr-1.5 truncate leading-none">
              {dayName}
            </div>
            {matrix[dayIdx].map((cell, hourIdx) => (
              <div
                key={`${dayIdx}-${hourIdx}`}
                className={`h-3.5 w-full rounded-sm border ${getCellColor(cell)}`}
                title={`${DAYS[dayIdx]} ${String(hourIdx).padStart(2, '0')}:00 — ${cell.count > 0 ? `Promedio: ${cell.avg.toFixed(2)}${unit}` : 'Sin datos'}`}
              />
            ))}
          </div>
        ))}
      </div>

      {hasData && (
        <div className="flex justify-end items-center gap-1.5 mt-2 text-[9px] text-muted-foreground font-mono">
          <span>Bajo ({minVal.toFixed(1)})</span>
          <div className="flex gap-px">
            {paletteColors.map((cls, i) => (
              <span key={i} className={`h-2 w-2.5 rounded-sm ${cls.split(' ').slice(0, 2).join(' ')}`} />
            ))}
          </div>
          <span>Alto ({maxVal.toFixed(1)})</span>
        </div>
      )}
      {!hasData && (
        <div className="flex justify-center mt-2 text-[10px] text-muted-foreground italic">
          Los datos no cubren un rango suficiente para generar el mapa de calor.
        </div>
      )}
    </div>
  )
}

export const heatmapPlugin: WidgetPlugin = {
  type: 'heatmap',
  name: 'Mapa de Calor',
  description: 'Un mapa matricial para observar niveles de actividad por día de la semana y hora.',
  icon: Calendar,
  defaultConfig: {
    size: 'lg',
    timeRange: '24h', // default longer timeframe
    showGrid: false,
    showLegend: false,
    showReferenceLines: false,
    yAxisAutoRange: false,
    refreshInterval: 10000, // slower refresh
    type: 'heatmap',
    heatmapColor: 'purple'
  },
  ConfigFormComponent: HeatmapConfigForm,
  RenderComponent: HeatmapRender
}

export default heatmapPlugin
