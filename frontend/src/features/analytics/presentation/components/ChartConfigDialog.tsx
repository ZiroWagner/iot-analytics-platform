"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Plus, Trash2, LineChart, BarChart3, AreaChart, AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSeriesColor } from "../../domain/chart-colors"
import type {
  ChartWidgetConfig, SeriesConfig, AvailableMetric,
  ChartSeriesType, YAxisPosition, WidgetSize
} from "../../domain/types"
import { DEFAULT_WIDGET_CONFIG, SIZE_LABELS, CHART_TYPE_LABELS } from "../../domain/types"
import { widgetRegistry } from "../../domain/widget-registry"

type WizardStep = 'series' | 'visual' | 'advanced'

interface ChartConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metrics: AvailableMetric[]
  existingConfig?: ChartWidgetConfig
  onSave: (config: ChartWidgetConfig) => void
}

function getInitialTitle(currentTitle: string, currentSeriesCount: number, metric: string, sensorName: string) {
  if (currentTitle) return currentTitle
  if (currentSeriesCount === 0) return `${metric.toUpperCase()} — ${sensorName}`
  return 'Dashboard Comparativo'
}

function getChartTypeIcon(type: ChartSeriesType) {
  if (type === 'line') return <LineChart className="h-3.5 w-3.5" />
  if (type === 'bar') return <BarChart3 className="h-3.5 w-3.5" />
  return <AreaChart className="h-3.5 w-3.5" />
}

/* ------------------------------------------------------------------ */
/*  Sub-components for each wizard step (reduces cognitive complexity) */
/* ------------------------------------------------------------------ */

interface SeriesStepProps {
  title: string
  setTitle: (v: string) => void
  series: SeriesConfig[]
  removeSeries: (id: string) => void
  selGateway: string
  setSelGateway: (v: string) => void
  selSensor: string
  setSelSensor: (v: string) => void
  selMetric: string
  setSelMetric: (v: string) => void
  uniqueGateways: { id: string; name: string }[]
  filteredSensors: AvailableMetric[]
  selectedSensorObj: AvailableMetric | undefined
  hasDuplicateSeries: boolean
  addSeries: () => void
}

function SeriesStep({
  title, setTitle, series, removeSeries,
  selGateway, setSelGateway, selSensor, setSelSensor,
  selMetric, setSelMetric, uniqueGateways, filteredSensors,
  selectedSensorObj, hasDuplicateSeries, addSeries,
}: SeriesStepProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Título del widget</label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej: Temperatura vs Humedad"
          className="bg-background/60 h-9"
        />
      </div>

      {series.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Series añadidas ({series.length})
          </label>
          <div className="space-y-1">
            {series.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent/30 border border-border/50"
              >
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs flex-1 truncate">
                  <strong>{s.metric}</strong> — {s.sensorName}
                </span>
                <Button
                  variant="ghost" size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSeries(s.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 p-3 rounded-lg border border-dashed border-border/60 bg-accent/10">
        <span className="text-xs font-medium text-muted-foreground">Seleccionar métrica del sensor</span>
        <p className="text-[10px] text-muted-foreground -mt-1 italic">
          Elige un gateway, sensor y la métrica que deseas monitorear.
        </p>

        <Select value={selGateway} onValueChange={(v) => { setSelGateway(v ?? ''); setSelSensor(''); setSelMetric('') }}>
          <SelectTrigger className="h-8 text-xs bg-background/60">
            {selGateway ? (uniqueGateways.find(g => g.id === selGateway)?.name ?? "Gateway (Device)") : "Gateway (Device)"}
          </SelectTrigger>
          <SelectContent>
            {uniqueGateways.map(g => (
              <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selGateway && (
          <Select value={selSensor} onValueChange={(v) => { setSelSensor(v ?? ''); setSelMetric('') }}>
            <SelectTrigger className="h-8 text-xs bg-background/60">
              {selSensor ? (filteredSensors.find(s => s.sensorId === selSensor)?.sensorName ?? "Sensor") : "Sensor"}
            </SelectTrigger>
            <SelectContent>
              {filteredSensors.map(m => (
                <SelectItem key={m.sensorId} value={m.sensorId} className="text-xs">{m.sensorName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selSensor && (
          <Select value={selMetric} onValueChange={(v) => setSelMetric(v ?? '')}>
            <SelectTrigger className="h-8 text-xs bg-background/60">
              {selMetric || "Métrica"}
            </SelectTrigger>
            <SelectContent>
              {selectedSensorObj?.availableMetrics.map(m => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasDuplicateSeries && (
          <p className="flex items-center gap-1 text-[11px] text-amber-400">
            <AlertTriangle className="h-3 w-3" /> Esta serie ya fue añadida.
          </p>
        )}

        <Button
          size="sm"
          className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-500"
          disabled={!selSensor || !selMetric || hasDuplicateSeries}
          onClick={addSeries}
        >
          <Plus className="h-3 w-3 mr-1" /> Añadir Serie
        </Button>
      </div>
    </>
  )
}

interface VisualStepProps {
  series: SeriesConfig[]
  updateSeries: (id: string, updates: Partial<SeriesConfig>) => void
  widgetType: string
  setWidgetType: (type: string) => void
  pluginConfig: Record<string, any>
  setPluginConfig: (cfg: Record<string, any>) => void
  availableMetrics: AvailableMetric[]
}

function VisualStep({
  series, updateSeries, widgetType, setWidgetType,
  pluginConfig, setPluginConfig, availableMetrics
}: VisualStepProps) {
  if (series.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center py-8">
          Añade al menos una serie en el paso anterior.
        </p>
      </div>
    )
  }

  const plugin = useMemo(() => {
    return widgetRegistry.get(widgetType) ?? widgetRegistry.get('charts')!
  }, [widgetType])

  const ConfigFormComponent = plugin.ConfigFormComponent

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Tipo de Visualización</label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
              {widgetRegistry.get(widgetType)?.name ?? widgetType}
            </span>
            {series.filter(s => s.metric).length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground border border-border/30">
                {series.filter(s => s.metric).length} serie{series.filter(s => s.metric).length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <Select value={widgetType} onValueChange={(val) => setWidgetType(val || 'charts')}>
          <SelectTrigger className="h-9 bg-background/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {widgetRegistry.getAll().map((p) => (
              <SelectItem key={p.type} value={p.type} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground italic mt-0.5">
          {plugin.description}
        </p>
      </div>

      {/* Render plugin specific configuration */}
      {ConfigFormComponent && (
        <div className="p-3 rounded-lg border border-border/40 bg-accent/5">
          <label className="text-[11px] font-bold text-muted-foreground block mb-2 uppercase tracking-wider">
            Opciones del Widget
          </label>
          <ConfigFormComponent
            config={pluginConfig}
            onChange={(updated) => setPluginConfig(updated)}
            availableMetrics={availableMetrics}
          />
        </div>
      )}

      {/* Only show series chart customizations for charts (Recharts) */}
      {widgetType === 'charts' && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted-foreground block">
            Estilo de Series Individuales
          </label>
          {series.map((s) => (
            <div key={s.id} className="p-3 rounded-lg border border-border/50 bg-accent/10 space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-semibold">{s.metric}</span>
                <span className="text-[10px] text-muted-foreground">— {s.sensorName}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Tipo</label>
                  <div className="flex gap-1">
                    {(['line', 'bar', 'area'] as ChartSeriesType[]).map(type => (
                      <Button
                        key={type}
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          s.chartType === type
                            ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30"
                            : "text-muted-foreground"
                        )}
                        onClick={() => updateSeries(s.id, { chartType: type })}
                        title={CHART_TYPE_LABELS[type]}
                      >
                        {getChartTypeIcon(type)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Unidad</label>
                  <Input
                    value={s.unit}
                    onChange={e => updateSeries(s.id, { unit: e.target.value })}
                    placeholder="°C, %, hPa"
                    className="h-7 text-xs bg-background/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Eje Y</label>
                  <Select
                    value={s.yAxisId}
                    onValueChange={(v) => updateSeries(s.id, { yAxisId: (v ?? 'left') as YAxisPosition })}
                  >
                    <SelectTrigger className="h-7 text-xs bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left" className="text-xs">Izquierdo</SelectItem>
                      <SelectItem value="right" className="text-xs">Derecho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Color</label>
                <input
                  type="color"
                  value={s.color}
                  onChange={e => updateSeries(s.id, { color: e.target.value })}
                  className="h-7 w-full rounded cursor-pointer border border-border"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface AdvancedStepProps {
  size: WidgetSize
  setSize: (v: WidgetSize) => void
  showGrid: boolean
  setShowGrid: (v: boolean) => void
  showLegend: boolean
  setShowLegend: (v: boolean) => void
  showRefLines: boolean
  setShowRefLines: (v: boolean) => void
  yAxisAuto: boolean
  setYAxisAuto: (v: boolean) => void
  yMin: string
  setYMin: (v: string) => void
  yMax: string
  setYMax: (v: string) => void
}

function AdvancedStep({
  size, setSize,
  showGrid, setShowGrid, showLegend, setShowLegend,
  showRefLines, setShowRefLines, yAxisAuto, setYAxisAuto,
  yMin, setYMin, yMax, setYMax,
}: AdvancedStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Tamaño del widget</label>
        <Select value={size} onValueChange={(v) => setSize((v ?? 'md') as WidgetSize)}>
          <SelectTrigger className="h-9 bg-background/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(SIZE_LABELS) as [WidgetSize, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Grilla', value: showGrid, set: setShowGrid },
          { label: 'Leyenda', value: showLegend, set: setShowLegend },
          { label: 'Líneas ref.', value: showRefLines, set: setShowRefLines },
        ].map(t => (
          <button
            key={t.label}
            className={cn(
              "p-2 rounded-lg border text-xs font-medium transition-all text-center",
              t.value
                ? "border-purple-500/40 bg-purple-500/10 text-purple-400"
                : "border-border/50 bg-accent/10 text-muted-foreground"
            )}
            onClick={() => t.set(!t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Rango eje Y</label>
          <button
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full transition-colors",
              yAxisAuto ? "bg-purple-500/20 text-purple-400" : "bg-accent text-muted-foreground"
            )}
            onClick={() => setYAxisAuto(!yAxisAuto)}
          >
            {yAxisAuto ? 'Automático' : 'Manual'}
          </button>
        </div>
        {!yAxisAuto && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={yMin}
              onChange={e => setYMin(e.target.value)}
              placeholder="Mín"
              className="h-8 text-xs bg-background/60"
            />
            <Input
              type="number"
              value={yMax}
              onChange={e => setYMax(e.target.value)}
              placeholder="Máx"
              className="h-8 text-xs bg-background/60"
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main dialog component                                             */
/* ------------------------------------------------------------------ */

export function ChartConfigDialog({
  open, onOpenChange, metrics, existingConfig, onSave
}: ChartConfigDialogProps) {
  const isEditing = !!existingConfig
  const [step, setStep] = useState<WizardStep>('series')
  const [title, setTitle] = useState(existingConfig?.title ?? '')
  const [series, setSeries] = useState<SeriesConfig[]>(existingConfig?.series ?? [])
  const [size, setSize] = useState<WidgetSize>(existingConfig?.size ?? 'md')
  const [showGrid, setShowGrid] = useState(existingConfig?.showGrid ?? true)
  const [showLegend, setShowLegend] = useState(existingConfig?.showLegend ?? true)
  const [showRefLines, setShowRefLines] = useState(existingConfig?.showReferenceLines ?? false)
  const [yAxisAuto, setYAxisAuto] = useState(existingConfig?.yAxisAutoRange ?? true)
  const [yMin, setYMin] = useState<string>(existingConfig?.yAxisMin?.toString() ?? '')
  const [yMax, setYMax] = useState<string>(existingConfig?.yAxisMax?.toString() ?? '')
  const [widgetType, setWidgetType] = useState<string>(existingConfig?.type ?? 'charts')
  const [pluginConfig, setPluginConfig] = useState<Record<string, any>>(existingConfig ?? {})
  const [selGateway, setSelGateway] = useState('')
  const [selSensor, setSelSensor] = useState('')
  const [selMetric, setSelMetric] = useState('')

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      setStep('series')
      setTitle(existingConfig?.title ?? '')
      setSeries(existingConfig?.series ?? [])
      setSize(existingConfig?.size ?? 'md')
      setShowGrid(existingConfig?.showGrid ?? true)
      setShowLegend(existingConfig?.showLegend ?? true)
      setShowRefLines(existingConfig?.showReferenceLines ?? false)
      setYAxisAuto(existingConfig?.yAxisAutoRange ?? true)
      setYMin(existingConfig?.yAxisMin?.toString() ?? '')
      setYMax(existingConfig?.yAxisMax?.toString() ?? '')
      setWidgetType(existingConfig?.type ?? 'charts')
      setPluginConfig(existingConfig ?? {})
      setSelGateway('')
      setSelSensor('')
      setSelMetric('')
    }, 0)
    return () => clearTimeout(timeout)
  }, [open, existingConfig])

  const uniqueGateways = useMemo(() => {
    const map = new Map<string, string>()
    metrics.forEach(m => map.set(m.gatewayId, m.gatewayName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [metrics])

  const filteredSensors = useMemo(
    () => metrics.filter(m => m.gatewayId === selGateway),
    [metrics, selGateway]
  )

  const selectedSensorObj = useMemo(
    () => metrics.find(m => m.sensorId === selSensor),
    [metrics, selSensor]
  )

  const hasDuplicateSeries = useMemo(() => {
    return Boolean(selSensor && selMetric && series.some(s => s.sensorId === selSensor && s.metric === selMetric))
  }, [series, selSensor, selMetric])

  const addSeries = () => {
    if (!selSensor || !selMetric || hasDuplicateSeries) return
    const sensorInfo = metrics.find(m => m.sensorId === selSensor)
    if (!sensorInfo) return

    const newSeries: SeriesConfig = {
      id: `s_${Date.now()}_${crypto.randomUUID()}`,
      sensorId: selSensor,
      sensorName: sensorInfo.sensorName,
      metric: selMetric,
      chartType: 'line',
      color: getSeriesColor(series.length),
      yAxisId: 'left',
      unit: '',
    }
    setSeries([...series, newSeries])
    setSelMetric('')

    setTitle(getInitialTitle(title, series.length, selMetric, sensorInfo.sensorName))
  }

  const removeSeries = (id: string) => {
    setSeries(series.filter(s => s.id !== id))
  }

  const updateSeries = (id: string, updates: Partial<SeriesConfig>) => {
    setSeries(series.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const handleSave = () => {
    const config: ChartWidgetConfig = {
      ...pluginConfig,
      id: existingConfig?.id ?? `w_${crypto.randomUUID()}`,
      title: title || 'Sin título',
      series,
      size,
      showGrid,
      showLegend,
      showReferenceLines: showRefLines,
      timeRange: DEFAULT_WIDGET_CONFIG.timeRange,
      refreshInterval: DEFAULT_WIDGET_CONFIG.refreshInterval,
      yAxisAutoRange: yAxisAuto,
      yAxisMin: yMin ? Number(yMin) : undefined,
      yAxisMax: yMax ? Number(yMax) : undefined,
      type: widgetType,
    }
    onSave(config)
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setStep('series')
    setTitle('')
    setSeries([])
    setSize('md')
    setWidgetType('charts')
    setPluginConfig({})
    setSelGateway('')
    setSelSensor('')
    setSelMetric('')
  }

  const steps: { key: WizardStep; label: string; num: number }[] = [
    { key: 'series', label: 'Series', num: 1 },
    { key: 'visual', label: 'Visualización', num: 2 },
    { key: 'advanced', label: 'Avanzado', num: 3 },
  ]

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  const getPreviousStep = (): WizardStep => (step === 'advanced' ? 'visual' : 'series')
  const getNextStep = (): WizardStep => (step === 'series' ? 'visual' : 'advanced')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden bg-card border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-b from-purple-500/5 to-transparent">
          <DialogTitle className="text-lg">
            {isEditing ? 'Editar Widget' : 'Crear Widget Analítico'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configura las series de datos y la visualización del gráfico.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center px-6 py-3 border-b border-border/50 bg-accent/20">
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <div className="flex-1 h-px bg-border mx-2" />}
              <button
                onClick={() => setStep(s.key)}
                className={cn(
                  "flex items-center gap-2 text-xs font-medium transition-colors",
                  step === s.key ? "text-purple-400" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn(
                  "h-5 w-5 rounded-full text-[10px] flex items-center justify-center font-bold",
                  step === s.key ? "bg-purple-500 text-white" : "bg-accent text-muted-foreground"
                )}>
                  {s.num}
                </span>
                {s.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="px-6 py-4 max-h-[420px] overflow-y-auto space-y-4">
          {step === 'series' && (
            <SeriesStep
              title={title} setTitle={setTitle}
              series={series} removeSeries={removeSeries}
              selGateway={selGateway} setSelGateway={setSelGateway}
              selSensor={selSensor} setSelSensor={setSelSensor}
              selMetric={selMetric} setSelMetric={setSelMetric}
              uniqueGateways={uniqueGateways}
              filteredSensors={filteredSensors}
              selectedSensorObj={selectedSensorObj}
              hasDuplicateSeries={hasDuplicateSeries}
              addSeries={addSeries}
            />
          )}

          {step === 'visual' && (
            <VisualStep
              series={series}
              updateSeries={updateSeries}
              widgetType={widgetType}
              setWidgetType={setWidgetType}
              pluginConfig={pluginConfig}
              setPluginConfig={setPluginConfig}
              availableMetrics={metrics}
            />
          )}

          {step === 'advanced' && (
            <AdvancedStep
              size={size} setSize={setSize}
              showGrid={showGrid} setShowGrid={setShowGrid}
              showLegend={showLegend} setShowLegend={setShowLegend}
              showRefLines={showRefLines} setShowRefLines={setShowRefLines}
              yAxisAuto={yAxisAuto} setYAxisAuto={setYAxisAuto}
              yMin={yMin} setYMin={setYMin}
              yMax={yMax} setYMax={setYMax}
            />
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-border/50 bg-accent/10">
          <div className="text-[10px] text-muted-foreground">
            {series.length} serie{series.length !== 1 ? 's' : ''} configurada{series.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            {step !== 'series' && (
              <Button
                variant="ghost" size="sm"
                className="h-8 text-xs"
                onClick={() => setStep(getPreviousStep())}
              >
                Atrás
              </Button>
            )}
            {step !== 'advanced' ? (
              <Button
                size="sm"
                className="h-8 text-xs bg-purple-600 hover:bg-purple-500"
                onClick={() => setStep(getNextStep())}
                disabled={series.length === 0}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500"
                onClick={handleSave}
                disabled={series.length === 0}
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Widget'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
