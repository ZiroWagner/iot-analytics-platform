"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChartWidget } from "./components/ChartWidget"
import { ChartConfigDialog } from "./components/ChartConfigDialog"
import { TimeRangeSelector } from "./components/TimeRangeSelector"
import type {
  AvailableMetric,
  ChartWidgetConfig,
  LegacyChartConfig,
  TimeRangePreset,
} from "../domain/types"
import { isLegacyFormat, migrateLegacyConfig } from "../domain/legacy"
import { httpAnalyticsRepository } from "../infrastructure/analytics.repository"

/** Grid column classes mapped to widget size */
const SIZE_GRID_CLASSES: Record<string, string> = {
  sm: 'col-span-1',
  md: 'col-span-1 md:col-span-2',
  lg: 'col-span-1 md:col-span-2 xl:col-span-3',
  full: 'col-span-full',
}

export function AnalyticsTab({ projectId }: { projectId: string }) {
  const [widgets, setWidgets] = useState<ChartWidgetConfig[]>([])
  const [metrics, setMetrics] = useState<AvailableMetric[]>([])
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [globalTimeRange, setGlobalTimeRange] = useState<TimeRangePreset>('15m')
  const [globalCustomDate, setGlobalCustomDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<ChartWidgetConfig | undefined>()

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await httpAnalyticsRepository.availableMetrics(projectId)
      setMetrics(data)
    } catch {
      // Will retry on dialog open
    }
  }, [projectId])

  const persistConfig = useCallback(
    async (newWidgets: ChartWidgetConfig[]) => {
      try {
        await httpAnalyticsRepository.saveDashboardConfig(projectId, newWidgets)
      } catch {
        // Non-critical
      }
    },
    [projectId],
  )

  useEffect(() => {
    const init = async () => {
      try {
        await fetchMetrics()
        const configData = await httpAnalyticsRepository.getDashboardConfig(projectId)

        if (
          configData.layout_config &&
          Array.isArray(configData.layout_config) &&
          configData.layout_config.length > 0
        ) {
          if (isLegacyFormat(configData.layout_config)) {
            const migrated = migrateLegacyConfig(
              configData.layout_config as LegacyChartConfig[],
            )
            setWidgets(migrated)
            await persistConfig(migrated)
          } else {
            setWidgets(configData.layout_config as ChartWidgetConfig[])
          }
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error)
      } finally {
        setLoadingConfig(false)
      }
    }
    init()
  }, [projectId, fetchMetrics, persistConfig])

  useEffect(() => {
    if (dialogOpen) fetchMetrics()
  }, [dialogOpen, fetchMetrics])

  const handleSaveWidget = (config: ChartWidgetConfig) => {
    let updated: ChartWidgetConfig[]
    if (editingWidget) {
      updated = widgets.map((w) => (w.id === config.id ? config : w))
    } else {
      updated = [...widgets, config]
    }
    setWidgets(updated)
    persistConfig(updated)
    setEditingWidget(undefined)
  }

  const handleRemoveWidget = (id: string) => {
    const updated = widgets.filter((w) => w.id !== id)
    setWidgets(updated)
    persistConfig(updated)
  }

  const handleEditWidget = (widget: ChartWidgetConfig) => {
    setEditingWidget(widget)
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingWidget(undefined)
    setDialogOpen(true)
  }

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando motor analítico...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Dashboard Analítico</h2>
            <p className="text-[11px] text-muted-foreground">
              {widgets.length} widget{widgets.length !== 1 ? 's' : ''} activo
              {widgets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TimeRangeSelector
            value={globalTimeRange}
            onChange={setGlobalTimeRange}
            customDate={globalCustomDate}
            onCustomDateChange={setGlobalCustomDate}
          />
          <Button
            className="bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20 h-8 text-xs"
            onClick={openCreateDialog}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Nuevo Widget
          </Button>
        </div>
      </div>

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 border border-dashed border-border/40 rounded-xl bg-gradient-to-b from-accent/10 to-transparent">
          <div className="h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5">
            <BarChart3 className="h-8 w-8 text-purple-500/50" />
          </div>
          <h3 className="text-sm font-medium mb-1.5">Tu dashboard está vacío</h3>
          <p className="text-xs text-muted-foreground text-center max-w-sm mb-5">
            Crea widgets con múltiples series, diferentes tipos de gráficos, y análisis
            comparativos para monitorizar tus sensores IoT.
          </p>
          <Button
            className="bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20"
            onClick={openCreateDialog}
          >
            <Plus className="mr-2 h-4 w-4" /> Crear Primer Widget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={cn(SIZE_GRID_CLASSES[widget.size] ?? 'col-span-1 md:col-span-2')}
            >
              <ChartWidget
                projectId={projectId}
                config={widget}
                globalTimeRange={globalTimeRange}
                globalCustomDate={globalCustomDate}
                onRemove={() => handleRemoveWidget(widget.id)}
                onEdit={() => handleEditWidget(widget)}
              />
            </div>
          ))}
        </div>
      )}

      <ChartConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        metrics={metrics}
        existingConfig={editingWidget}
        onSave={handleSaveWidget}
      />
    </div>
  )
}
