"use client"

import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Radio } from "lucide-react"
import { useSensorData } from "../hooks/useSensorData"
import type { Sensor } from "../../domain/types"

interface Props {
  sensor: Sensor
  onClose: () => void
}

export function SensorDataModal({ sensor, onClose }: Props) {
  const { dataPoints, loading } = useSensorData(sensor.id)

  let tableContent: React.ReactNode = dataPoints.map((dp) => (
    <TableRow
      key={dp.id}
      className="hover:bg-surface-container-lowest/50"
    >
      <TableCell className="font-mono text-xs text-muted-foreground">
        {new Date(dp.timestamp).toLocaleString()}
      </TableCell>
      <TableCell>
        <pre className="text-[10px] font-mono bg-black/50 p-2 rounded-md border border-border text-emerald-400">
          {JSON.stringify(dp.payload, null, 2)}
        </pre>
      </TableCell>
    </TableRow>
  ))

  if (loading && dataPoints.length === 0) {
    tableContent = (
      <TableRow>
        <TableCell colSpan={2} className="text-center h-24">
          Cargando datos...
        </TableCell>
      </TableRow>
    )
  } else if (dataPoints.length === 0) {
    tableContent = (
      <TableRow>
        <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
          Sin telemetría registrada aún.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Radio className="h-5 w-5 text-emerald-500" />
            Sensor: {sensor.name}
          </DialogTitle>
          <DialogDescription>
            Mostrando los últimos 50 eventos registrados en tiempo real. ID: {sensor.id}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-md border border-border bg-surface-container-low max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-surface-container-low sticky top-0 shadow-sm">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Payload Crudo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableContent}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
