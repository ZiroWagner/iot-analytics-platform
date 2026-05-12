"use client"

import { useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import { getSocket } from '../../infrastructure/socket'
import { useTelemetryStore } from '../store'
import type {
  InitialDeviceSnapshotMap,
  TelemetryEvent,
} from '../../domain'

interface InitialStateData {
  projectId: string
  devices: InitialDeviceSnapshotMap
}

interface TelemetryBatchData {
  projectId: string
  events: TelemetryEvent[]
  count: number
}

/**
 * Subscribes to real-time telemetry.
 * - Always opens the socket and tracks connection status (so WS indicators
 *   work everywhere, including pages that do not subscribe to a project).
 * - When `projectId` is provided, also joins that project's room and hydrates
 *   the store with `initial_state` + `telemetry_batch` events.
 */
export function useTelemetry(projectId: string | null): void {
  const socketRef = useRef<Socket | null>(null)
  const setConnected = useTelemetryStore((s) => s.setConnected)
  const setInitialState = useTelemetryStore((s) => s.setInitialState)
  const applyBatch = useTelemetryStore((s) => s.applyBatch)
  const clearDevices = useTelemetryStore((s) => s.clearDevices)

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    const onConnect = () => {
      setConnected(true)
      if (projectId) socket.emit('subscribeToProject', { projectId })
    }

    const onDisconnect = () => setConnected(false)

    const onInitialState = (data: InitialStateData) => {
      if (!projectId || data.projectId !== projectId) return
      setInitialState(data.projectId, data.devices)
    }

    const onTelemetryBatch = (data: TelemetryBatchData) => {
      if (!projectId || data?.projectId !== projectId) return
      if (!Array.isArray(data.events)) return
      applyBatch(data.events)
    }

    if (projectId) clearDevices()

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('initial_state', onInitialState)
    socket.on('telemetry_batch', onTelemetryBatch)

    setConnected(socket.connected)
    if (socket.connected && projectId) {
      socket.emit('subscribeToProject', { projectId })
    }

    return () => {
      if (projectId) socket.emit('unsubscribeFromProject', { projectId })
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('initial_state', onInitialState)
      socket.off('telemetry_batch', onTelemetryBatch)
    }
  }, [projectId, setConnected, setInitialState, applyBatch, clearDevices])
}

/** Returns the current WebSocket connection status from the store. */
export function useSocketStatus(): boolean {
  return useTelemetryStore((state) => state.connected)
}
