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

/** Raw sensor reading extracted from telemetry events for chart consumers */
export interface RealtimeSensorPoint {
  sensorId: string
  metric: string
  value: number
  timestamp: string
  deviceId: string
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
  /** Accumulated realtime sensor points for chart consumers */
  realtimePoints: RealtimeSensorPoint[]
  setConnected: (connected: boolean) => void
  setInitialState: (projectId: string, deviceMap: InitialDeviceSnapshotMap) => void
  applyBatch: (events: TelemetryEvent[]) => void
  markOffline: (deviceId: string) => void
  clearDevices: () => void
  setSystemMetrics: (metrics: SystemMetrics | null) => void
  /** Add a batch of realtime sensor points (called by useTelemetry) */
  addRealtimePoints: (points: RealtimeSensorPoint[]) => void
  /** Clear all accumulated realtime points */
  clearRealtimePoints: () => void
}

const MAX_REALTIME_POINTS = 500

export const useTelemetryStore = create<TelemetryStore>((set) => ({
  devices: {},
  systemMetrics: null,
  connected: false,
  realtimePoints: [],

  setConnected: (connected) => set({ connected }),

  setInitialState: (_projectId, deviceMap) =>
    set({ devices: buildDeviceMapFromInitialState(deviceMap) }),

  applyBatch: (events) => {
    // Extract sensor data points from telemetry events for chart consumers
    const points: RealtimeSensorPoint[] = []
    for (const event of events) {
      if (event.type === 'device_data' && event.sensors) {
        for (const sensor of event.sensors) {
          for (const [metric, value] of Object.entries(sensor.payload)) {
            if (typeof value === 'number') {
              points.push({
                sensorId: sensor.sensor_id,
                metric,
                value,
                timestamp: event.timestamp,
                deviceId: event.deviceId,
              })
            }
          }
        }
      }
    }

    set((state) => {
      const merged = [...state.realtimePoints, ...points]
      // Keep only the most recent points to prevent memory growth
      const trimmed = merged.length > MAX_REALTIME_POINTS
        ? merged.slice(-MAX_REALTIME_POINTS)
        : merged
      return {
        devices: applyEventsToDevices(state.devices, events),
        realtimePoints: trimmed,
      }
    })
  },

  markOffline: (deviceId) =>
    set((state) => ({ devices: markDeviceOffline(state.devices, deviceId) })),

  clearDevices: () => set({ devices: {} }),

  setSystemMetrics: (metrics) => set({ systemMetrics: metrics }),

  addRealtimePoints: (points) =>
    set((state) => {
      const merged = [...state.realtimePoints, ...points]
      const trimmed = merged.length > MAX_REALTIME_POINTS
        ? merged.slice(-MAX_REALTIME_POINTS)
        : merged
      return { realtimePoints: trimmed }
    }),

  clearRealtimePoints: () => set({ realtimePoints: [] }),
}))
