/** Per-device snapshot kept in the in-memory telemetry store. */
export interface DeviceState {
  deviceId: string
  status: 'online' | 'offline'
  lastSeenAt: string
  sensors?: Record<string, Record<string, unknown>>
}

/** Sensor reading payload as it arrives in a telemetry event. */
export interface TelemetrySensorReading {
  sensorId: string
  payload: Record<string, unknown>
}

/**
 * A single event produced by the backend gateway.
 * `type` is the discriminator we react to in the reducer.
 */
export interface TelemetryEvent {
  type: string
  deviceId: string
  projectId: string
  timestamp: string
  sensors?: TelemetrySensorReading[]
}

/** Initial snapshot pushed when the client subscribes to a project room. */
export interface InitialDeviceSnapshot {
  status?: string
  lastSeenAt?: string
}

/** Map of deviceId -> snapshot used by initial_state events. */
export type InitialDeviceSnapshotMap = Record<string, InitialDeviceSnapshot>

export type DeviceMap = Record<string, DeviceState>
