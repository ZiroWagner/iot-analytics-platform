"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, FolderKanban, Cpu, Radio, Plus, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { isOverviewDataFlowing } from "../../domain/rules"
import { useOverview } from "../hooks/useOverview"

export function OverviewPage() {
  const router = useRouter()
  const { stats, loading, unauthorized } = useOverview()

  useEffect(() => {
    if (unauthorized) router.push("/login")
  }, [unauthorized, router])

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Overview Global</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Visión panorámica de toda tu infraestructura IoT en tiempo real.
          </p>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : stats?.totalProjects === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 border border-dashed rounded-lg bg-surface-container-low/50">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Activity className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Bienvenido a Vortex IoT</h2>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            Para comenzar a ingerir datos y monitorizar tus métricas, crea tu primer contenedor lógico.
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/dashboard/projects")}
            className="bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-5 w-5" />
            Crear tu primer Proyecto
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:bg-accent/5 transition-colors border-primary/10 shadow-sm glass group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FolderKanban className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{stats?.totalProjects}</div>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/5 transition-colors border-blue-500/10 shadow-sm glass group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dispositivos (Gateways)</CardTitle>
                <div className="p-2 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Cpu className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{stats?.totalDevices}</div>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/5 transition-colors border-emerald-500/10 shadow-sm glass group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nodos de Sensores</CardTitle>
                <div className="p-2 rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <Radio className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{stats?.totalSensors}</div>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/5 transition-colors border-purple-500/10 shadow-sm glass group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventos (últimas 24h)</CardTitle>
                <div className="p-2 rounded-md bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Activity className="h-4 w-4 text-purple-500 animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{stats?.eventsLast24h}</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-surface-container-low rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-lg">Flujo de Actividad Reciente</h3>
              </div>
              {isOverviewDataFlowing(stats) ? (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              ) : (
                <span className="flex h-3 w-3 relative">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground/50" />
                </span>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Origen (Gateway)</TableHead>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Payload JSON</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats?.recentEvents || stats.recentEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Esperando telemetría entrante...
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-surface-container-lowest/50">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {event.sensor?.device?.name || "Unknown Gateway"}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                          {event.sensor?.name || "Unknown Sensor"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <pre className="text-[10px] font-mono bg-black p-2 rounded-md border border-border/50 text-emerald-400 overflow-x-auto max-w-md">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
