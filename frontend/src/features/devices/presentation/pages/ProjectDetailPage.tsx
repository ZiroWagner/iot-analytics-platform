"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsTab } from "@/features/analytics"
import {
  Plus,
  ArrowLeft,
  Copy,
  Cpu,
  Activity,
  ChevronDown,
  ChevronRight,
  Radio,
  LayoutDashboard,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  useTelemetry,
  useSocketStatus,
  useTelemetryStore,
} from "@/features/telemetry"
import {
  SensorDataModal,
  createSensorFormSchema,
  parseSensorMetadata,
  formatSensorMetadata,
  httpSensorsRepository,
  type CreateSensorFormInput,
  type Sensor,
} from "@/features/sensors"
import { createDeviceSchema, type CreateDeviceInput } from "../../domain/schemas"
import { isDeviceActive, countActiveDevicesFromList } from "../../domain/rules"
import { httpDevicesRepository } from "../../infrastructure/devices.repository"
import { useDevicesByProject } from "../hooks/useDevicesByProject"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import type { Device } from "../../domain/types"

export function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    devices,
    loading,
    unauthorized,
    refetch: refetchDevices,
  } = useDevicesByProject(projectId)

  // WebSocket real-time telemetry
  useTelemetry(projectId)
  const wsConnected = useSocketStatus()
  const realtimeDevices = useTelemetryStore((state) => state.devices)

  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [inspectingSensor, setInspectingSensor] = useState<Sensor | null>(null)
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<Set<string>>(new Set())
  const [activeDeviceIdForSensor, setActiveDeviceIdForSensor] = useState<string | null>(null)

  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [isEditDeviceDialogOpen, setIsEditDeviceDialogOpen] = useState(false)
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null)
  const [isDeleteDeviceOpen, setIsDeleteDeviceOpen] = useState(false)
  const [deletingDeviceLoading, setDeletingDeviceLoading] = useState(false)

  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [isEditSensorDialogOpen, setIsEditSensorDialogOpen] = useState(false)
  const [deletingSensor, setDeletingSensor] = useState<Sensor | null>(null)
  const [isDeleteSensorOpen, setIsDeleteSensorOpen] = useState(false)
  const [deletingSensorLoading, setDeletingSensorLoading] = useState(false)

  const deviceForm = useForm<CreateDeviceInput>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: { name: "", type: "ESP32", mac_address: "" },
  })

  const editDeviceForm = useForm<CreateDeviceInput>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: { name: "", type: "ESP32", mac_address: "" },
  })

  const sensorForm = useForm<CreateSensorFormInput>({
    resolver: zodResolver(createSensorFormSchema),
    defaultValues: { name: "", metadata: "" },
  })

  const editSensorForm = useForm<CreateSensorFormInput>({
    resolver: zodResolver(createSensorFormSchema),
    defaultValues: { name: "", metadata: "" },
  })

  useEffect(() => {
    if (unauthorized) router.push("/login")
  }, [unauthorized, router])

  useEffect(() => {
    if (editingDevice) {
      editDeviceForm.reset({
        name: editingDevice.name,
        type: editingDevice.type,
        mac_address: editingDevice.mac_address || "",
      })
    }
  }, [editingDevice, editDeviceForm])

  useEffect(() => {
    if (editingSensor) {
      editSensorForm.reset({
        name: editingSensor.name,
        metadata: formatSensorMetadata(editingSensor.metadata),
      })
    }
  }, [editingSensor, editSensorForm])

  const toggleRow = (deviceId: string) => {
    setExpandedDeviceIds((prev) => {
      const next = new Set(prev)
      if (next.has(deviceId)) next.delete(deviceId)
      else next.add(deviceId)
      return next
    })
  }

  const activeCount = useMemo(
    () => countActiveDevicesFromList(devices, realtimeDevices),
    [devices, realtimeDevices],
  )

  async function onSubmitDevice(values: CreateDeviceInput) {
    try {
      const created = await httpDevicesRepository.create(projectId, values)
      setNewApiKey(created.api_key || null)
      toast.success("Gateway registrado. Copia la API Key para el Hardware.")
      refetchDevices()
      deviceForm.reset()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al registrar el Gateway"
      toast.error(message)
    }
  }

  async function onSubmitSensor(values: CreateSensorFormInput) {
    if (!activeDeviceIdForSensor) return
    try {
      await httpSensorsRepository.create({
        name: values.name,
        deviceId: activeDeviceIdForSensor,
        metadata: parseSensorMetadata(values.metadata),
      })

      toast.success("Sensor lógico registrado al Gateway.")
      setExpandedDeviceIds((prev) => new Set(prev).add(activeDeviceIdForSensor))
      setActiveDeviceIdForSensor(null)
      sensorForm.reset()
      refetchDevices()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al registrar el Sensor"
      toast.error(message)
    }
  }

  async function onEditDevice(values: CreateDeviceInput) {
    if (!editingDevice) return
    try {
      await httpDevicesRepository.update(editingDevice.id, values)
      toast.success("Gateway actualizado exitosamente")
      setIsEditDeviceDialogOpen(false)
      setEditingDevice(null)
      refetchDevices()
    } catch {
      toast.error("Hubo un problema al actualizar el Gateway")
    }
  }

  async function onDeleteDeviceConfirm() {
    if (!deletingDevice) return
    try {
      setDeletingDeviceLoading(true)
      await httpDevicesRepository.delete(deletingDevice.id)
      toast.success("Gateway eliminado permanentemente")
      setIsDeleteDeviceOpen(false)
      setDeletingDevice(null)
      refetchDevices()
    } catch {
      toast.error("Hubo un problema al eliminar el Gateway")
    } finally {
      setDeletingDeviceLoading(false)
    }
  }

  async function onEditSensor(values: CreateSensorFormInput) {
    if (!editingSensor) return
    try {
      await httpSensorsRepository.update(editingSensor.id, {
        name: values.name,
        metadata: parseSensorMetadata(values.metadata),
      })
      toast.success("Sensor actualizado exitosamente")
      setIsEditSensorDialogOpen(false)
      setEditingSensor(null)
      refetchDevices()
    } catch {
      toast.error("Hubo un problema al actualizar el Sensor")
    }
  }

  async function onDeleteSensorConfirm() {
    if (!deletingSensor) return
    try {
      setDeletingSensorLoading(true)
      await httpSensorsRepository.delete(deletingSensor.id)
      toast.success("Sensor eliminado permanentemente")
      setIsDeleteSensorOpen(false)
      setDeletingSensor(null)
      refetchDevices()
    } catch {
      toast.error("Hubo un problema al eliminar el Sensor")
    } finally {
      setDeletingSensorLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("API Key copiada")
    setIsDeviceDialogOpen(false)
    setNewApiKey(null)
  }

  let devicesTableContent: React.ReactNode = devices.map((device) => {
    const active = isDeviceActive(device.id, device.lastSeenAt, realtimeDevices)
    const expanded = expandedDeviceIds.has(device.id)
    return (
      <React.Fragment key={device.id}>
        <TableRow
          className="hover:bg-surface-container-low/50 group cursor-pointer"
          onClick={() => toggleRow(device.id)}
        >
          <TableCell>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </TableCell>
          <TableCell className="font-medium flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-500/10">
              <Cpu className="h-4 w-4 text-blue-500" />
            </div>
            {device.name}
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {device.type} {device.mac_address && `(${device.mac_address})`}
          </TableCell>
          <TableCell>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {device.sensors.length} Sensores
            </Badge>
          </TableCell>
          <TableCell>
            {active ? (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex w-max items-center gap-1"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Activo
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground border-border/50 flex w-max items-center gap-1"
              >
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                Inactivo
              </Badge>
            )}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingDevice(device)
                  setIsEditDeviceDialogOpen(true)
                }}
                title="Editar Gateway"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeletingDevice(device)
                  setIsDeleteDeviceOpen(true)
                }}
                title="Eliminar Gateway"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Dialog
              open={activeDeviceIdForSensor === device.id}
              onOpenChange={(open) => !open && setActiveDeviceIdForSensor(null)}
            >
              <DialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveDeviceIdForSensor(device.id)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Nuevo Sensor
                    </Button>
                  }
                />
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Anexar Sensor al Gateway</DialogTitle>
                  <DialogDescription>
                    Agrega una fuente de datos lógica a <b>{device.name}</b>.
                  </DialogDescription>
                </DialogHeader>
                <Form {...sensorForm}>
                  <form
                    onSubmit={sensorForm.handleSubmit(onSubmitSensor)}
                    className="space-y-4 pt-4"
                  >
                    <FormField
                      control={sensorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID/Nombre del Sensor</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. sensor_temp_01"
                              {...field}
                              className="bg-surface-container-lowest"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sensorForm.control}
                      name="metadata"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Etiquetas</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="outdoor, dht22"
                              {...field}
                              className="bg-surface-container-lowest"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="submit">Agregar Sensor</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TableCell>
        </TableRow>
        {expanded && (
          <TableRow className="bg-surface-container-lowest/50 hover:bg-surface-container-lowest/50">
            <TableCell colSpan={6} className="p-0 border-b-0">
              <div className="pl-14 pr-4 py-4 bg-surface-container-low/20 inner-shadow-sm border-b">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Radio className="h-4 w-4" /> Sensores Conectados
                </h4>
                {device.sensors.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No hay sensores configurados para este dispositivo.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {device.sensors.map((sensor) => (
                      <div
                        key={sensor.id}
                        className="relative flex items-center justify-between p-3 rounded-md bg-background border border-border/50 hover:border-emerald-500/50 cursor-pointer transition-colors group"
                      >
                        <div
                          className="flex-1"
                          onClick={() => setInspectingSensor(sensor)}
                        >
                          <p
                            className={`font-medium text-sm transition-colors ${active ? "text-foreground group-hover:text-emerald-500" : "text-muted-foreground"}`}
                          >
                            {sensor.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            ID: {sensor.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingSensor(sensor)
                                setIsEditSensorDialogOpen(true)
                              }}
                              title="Editar sensor"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingSensor(sensor)
                                setIsDeleteSensorOpen(true)
                              }}
                              title="Eliminar sensor"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Activity
                            className={`h-4 w-4 ${active ? "text-emerald-500/50 group-hover:text-emerald-500 group-hover:animate-pulse" : "text-muted-foreground/30"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    )
  })

  if (loading) {
    devicesTableContent = (
      <TableRow>
        <TableCell colSpan={6} className="h-24 text-center">
          Cargando...
        </TableCell>
      </TableRow>
    )
  } else if (devices.length === 0) {
    devicesTableContent = (
      <TableRow>
        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
          No tienes Gateways en este proyecto.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/projects")}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión del Proyecto</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra tus nodos de hardware y visualiza tus datos en tiempo real.
          </p>
        </div>
      </div>

      <Tabs defaultValue="devices" className="w-full h-full flex flex-col">
        <TabsList className="w-max bg-surface-container-low border border-border">
          <TabsTrigger
            value="devices"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Cpu className="h-4 w-4 mr-2" />
            Infraestructura (Gateways)
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-500"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard Analítico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="flex-1 mt-4 space-y-6">
          <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">
                Devices Activos ({activeCount}/
                {Array.isArray(devices) ? devices.length : 0})
              </h2>
              <div className="flex items-center gap-1.5 ml-2 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${wsConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
                />
                <span className="text-muted-foreground">
                  {wsConnected ? "WS Live" : "WS Off"}
                </span>
              </div>
            </div>

            <Dialog open={isDeviceDialogOpen} onOpenChange={setIsDeviceDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="mr-2 h-4 w-4" /> Registrar Gateway
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[500px] border-border bg-background shadow-2xl">
                {newApiKey ? (
                  <div className="py-6 flex flex-col items-center space-y-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                      <Activity className="h-6 w-6 text-green-500" />
                    </div>
                    <DialogTitle className="text-2xl text-green-500">Gateway Creado</DialogTitle>
                    <DialogDescription>
                      Inyecta este token en tu hardware (ej: ESP32) para autorizar todas sus transmisiones.{" "}
                      <strong className="text-red-400">Sólo se muestra una vez.</strong>
                    </DialogDescription>
                    <div className="mt-6 w-full p-4 bg-black rounded-md flex items-center justify-between border border-blue-500/30">
                      <code className="text-blue-400 font-mono text-sm break-all text-left">{newApiKey}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(newApiKey)}
                        className="ml-2 hover:bg-blue-500/20 hover:text-blue-400"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-500"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      Copiar y Cerrar
                    </Button>
                  </div>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Registrar Hardware Gateway</DialogTitle>
                      <DialogDescription>
                        Define el concentrador que emitirá los datos de uno o varios sensores en conjunto.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...deviceForm}>
                      <form
                        onSubmit={deviceForm.handleSubmit(onSubmitDevice)}
                        className="space-y-4 pt-4"
                      >
                        <FormField
                          control={deviceForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre del Gateway</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej. Nodo-Central-Piso1"
                                  {...field}
                                  className="bg-surface-container-lowest"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={deviceForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Modelo/Placa</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="ESP32, RPi4"
                                    {...field}
                                    className="bg-surface-container-lowest"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={deviceForm.control}
                            name="mac_address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>MAC (Opcional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="00:1A:..."
                                    {...field}
                                    className="font-mono bg-surface-container-lowest uppercase"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                          <Button variant="ghost" type="button" onClick={() => setIsDeviceDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                            Generar Credenciales
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border border-border bg-surface-container-lowest overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-container-low">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px]" />
                  <TableHead className="w-[250px]">Nombre del Device</TableHead>
                  <TableHead>Hardware</TableHead>
                  <TableHead>Sensores Lógicos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devicesTableContent}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 mt-4">
          <AnalyticsTab projectId={projectId} />
        </TabsContent>
      </Tabs>

      {inspectingSensor && (
        <SensorDataModal
          sensor={inspectingSensor}
          onClose={() => setInspectingSensor(null)}
        />
      )}

      {/* EDIT DEVICE DIALOG */}
      <Dialog open={isEditDeviceDialogOpen} onOpenChange={setIsEditDeviceDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-border bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle>Editar Gateway</DialogTitle>
            <DialogDescription>
              Modifica los detalles del dispositivo gateway.
            </DialogDescription>
          </DialogHeader>
          <Form {...editDeviceForm}>
            <form
              onSubmit={editDeviceForm.handleSubmit(onEditDevice)}
              className="space-y-4 pt-4"
            >
              <FormField
                control={editDeviceForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Gateway</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Nodo-Central-Piso1"
                        {...field}
                        className="bg-surface-container-lowest"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editDeviceForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo/Placa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ESP32, RPi4"
                          {...field}
                          className="bg-surface-container-lowest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editDeviceForm.control}
                  name="mac_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MAC (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00:1A:..."
                          {...field}
                          className="font-mono bg-surface-container-lowest uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setIsEditDeviceDialogOpen(false)
                    setEditingDevice(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* DELETE DEVICE CONFIRMATION */}
      <DeleteConfirmDialog
        open={isDeleteDeviceOpen}
        onOpenChange={setIsDeleteDeviceOpen}
        title={deletingDevice?.name || "este gateway"}
        description="Al eliminar este gateway, se eliminarán en cascada de forma permanente todos sus sensores registrados y el histórico completo de eventos de telemetría asociados."
        onConfirm={onDeleteDeviceConfirm}
        loading={deletingDeviceLoading}
      />

      {/* EDIT SENSOR DIALOG */}
      <Dialog open={isEditSensorDialogOpen} onOpenChange={setIsEditSensorDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle>Editar Sensor</DialogTitle>
            <DialogDescription>
              Modifica los detalles del sensor lógico.
            </DialogDescription>
          </DialogHeader>
          <Form {...editSensorForm}>
            <form
              onSubmit={editSensorForm.handleSubmit(onEditSensor)}
              className="space-y-4 pt-4"
            >
              <FormField
                control={editSensorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID/Nombre del Sensor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. sensor_temp_01"
                        {...field}
                        className="bg-surface-container-lowest"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editSensorForm.control}
                name="metadata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiquetas</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="outdoor, dht22"
                        {...field}
                        className="bg-surface-container-lowest"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setIsEditSensorDialogOpen(false)
                    setEditingSensor(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* DELETE SENSOR CONFIRMATION */}
      <DeleteConfirmDialog
        open={isDeleteSensorOpen}
        onOpenChange={setIsDeleteSensorOpen}
        title={deletingSensor?.name || "este sensor"}
        description="Al eliminar este sensor, se borrará permanentemente su configuración y todo el histórico de datos de telemetría asociados."
        onConfirm={onDeleteSensorConfirm}
        loading={deletingSensorLoading}
      />
    </div>
  )
}
