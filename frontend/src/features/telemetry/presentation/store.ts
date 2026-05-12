import { create } from 'zustand'
import {
  applyEventsToDevices,
  buildDeviceMapFromInitialState,
  markDeviceOffline,
  type DeviceMap,
  type InitialDeviceSnapshotMap,
  type TelemetryEvent,
} from '../domain'

interface SystemMetrics {
  streamSize: number
  consumerLag: number
  eventsPerSecond: number
  onlineDevices: number
}

/**
 * Reactive store for real-time device state.
 * The mutators delegate to pure reducers in `../domain` to keep this file thin
 * and the logic testable without React.
 */
interface TelemetryStore {
  devices: DeviceMap
  systemMetrics: SystemMetrics | null
  connected: boolean
  setConnected: (connected: boolean) => void
  setInitialState: (projectId: string, deviceMap: InitialDeviceSnapshotMap) => void
  applyBatch: (events: TelemetryEvent[]) => void
  markOffline: (deviceId: string) => void
  clearDevices: () => void
  setSystemMetrics: (metrics: SystemMetrics | null) => void
}

export const useTelemetryStore = create<TelemetryStore>((set) => ({
  devices: {},
  systemMetrics: null,
  connected: false,

  setConnected: (connected) => set({ connected }),

  setInitialState: (_projectId, deviceMap) =>
    set({ devices: buildDeviceMapFromInitialState(deviceMap) }),

  applyBatch: (events) =>
    set((state) => ({ devices: applyEventsToDevices(state.devices, events) })),

  markOffline: (deviceId) =>
    set((state) => ({ devices: markDeviceOffline(state.devices, deviceId) })),

  clearDevices: () => set({ devices: {} }),

  setSystemMetrics: (metrics) => set({ systemMetrics: metrics }),
}))
