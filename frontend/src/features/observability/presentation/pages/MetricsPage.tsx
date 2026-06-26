"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Activity,
  BarChart3,
  Gauge,
  Radio,
  RefreshCw,
  Server,
  Timer,
  Wifi,
  Zap,
  Database,
  Clock,
} from "lucide-react"
import { useSocketStatus, useTelemetry } from "@/features/telemetry"
import {
  getLagColorClass,
  getPendingColorClass,
  getRedisMemoryColorClass,
  formatRedisMemory,
} from "../../domain/rules"
import { useSystemMetrics } from "../hooks/useSystemMetrics"

export function MetricsPage() {
  const { metrics, loading, refresh } = useSystemMetrics()

  useTelemetry(null)
  const connected = useSocketStatus()

  const lagValue = metrics?.consumerLag ?? 0
  const pendingValue = metrics?.pendingMessages ?? 0
  const redisMem = metrics?.redisMemoryUsedBytes ?? 0

  const streamTarget = 50000
  const streamPct = metrics?.streamSize != null && streamTarget > 0
    ? Math.round((metrics.streamSize / streamTarget) * 100)
    : 0

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas del Sistema</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Panel de observabilidad en tiempo real de la infraestructura IoT.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
            />
            <span className="text-muted-foreground">
              {connected ? "WebSocket Activo" : "WebSocket Inactivo"}
            </span>
          </div>
          <Button
            variant="outline"
            className="bg-surface-container-low"
            onClick={refresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-surface-container-low border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tamaño del Stream
            </CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {loading ? "—" : (metrics?.streamSize ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-accent/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    streamPct > 90 ? "bg-red-500" : streamPct > 70 ? "bg-orange-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(streamPct, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {streamPct}% / {streamTarget.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mensajes en Redis Stream (MAXLEN ~{streamTarget.toLocaleString()})
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consumer Lag
            </CardTitle>
            <Gauge className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold tabular-nums ${getLagColorClass(lagValue)}`}
            >
              {loading ? "—" : lagValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mensajes sin procesar (lag)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eventos / Segundo
            </CardTitle>
            <Zap className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-emerald-500">
              {loading ? "—" : metrics?.eventsPerSecond ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">EPS (promedio 3s)</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dispositivos Online
            </CardTitle>
            <Wifi className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {loading ? "—" : metrics?.onlineDevices ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">con TTL activo en Redis</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-surface-container-low border-border/50 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mensajes Pendientes
            </CardTitle>
            <Timer className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold tabular-nums ${getPendingColorClass(pendingValue)}`}
            >
              {loading ? "—" : pendingValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              sin XACK (XPENDING)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Memoria Redis
            </CardTitle>
            <Database className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold tabular-nums ${getRedisMemoryColorClass(redisMem)}`}
            >
              {loading ? "—" : formatRedisMemory(redisMem)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {redisMem > 0
                ? `< ${formatRedisMemory(500 * 1024 * 1024)} ideal`
                : 'usada por Redis'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inserción DB
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-amber-500">
              {loading ? "—" : metrics?.dbInsertLatencyMs != null ? `${metrics.dbInsertLatencyMs} ms` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              tiempo bulk insert a PostgreSQL
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-container-low border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Estado de la Arquitectura V2
          </CardTitle>
          <CardDescription>
            Flujo de datos: Hardware → Redis Streams → Worker → PostgreSQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 py-4">
            {[
              { label: "HTTP Ingesta", icon: Radio, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Redis Stream", icon: Server, color: "text-orange-500", bg: "bg-orange-500/10" },
              { label: "Worker (Batch)", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "PostgreSQL", icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border border-border/50 ${step.bg}`}
                >
                  <step.icon className={`h-5 w-5 ${step.color}`} />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {i < 3 && (
                  <span className="text-muted-foreground text-xl hidden md:inline">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              WebSocket Pub/Sub Broadcasting
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Métricas vía WebSocket (5s)
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              XTRIM automático ~50k
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
