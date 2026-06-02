import type {
  DeviceMap,
  DeviceState,
  InitialDeviceSnapshotMap,
  TelemetryEvent,
} from './types'

/** Event type emitted when a device sends new sensor data. */
export const EVENT_DEVICE_DATA = 'device_data'
/** Event type emitted by the offline-detection cron. */
export const EVENT_DEVICE_OFFLINE = 'device_offline'

/**
 * Builds a fresh device map from the initial snapshot received when
 * subscribing to a project room. Pure function: no React, no side effects.
 */
export function buildDeviceMapFromInitialState(
  snapshot: InitialDeviceSnapshotMap,
): DeviceMap {
  const devices: DeviceMap = {}
  for (const [deviceId, state] of Object.entries(snapshot)) {
    devices[deviceId] = {
      deviceId,
      status: (state.status as 'online' | 'offline') || 'offline',
      lastSeenAt: state.lastSeenAt || '',
      sensors: {},
    }
  }
  return devices
}

/**
 * Applies a single telemetry event to a device map and returns the next state.
 * Pure: input maps are not mutated.
 */
export function applyEventToDevices(
  state: DeviceMap,
  event: TelemetryEvent,
): DeviceMap {
  if (event.type === EVENT_DEVICE_DATA) {
    const existing = state[event.deviceId]
    const sensorData: DeviceState['sensors'] = { ...(existing?.sensors || {}) }

    if (event.sensors) {
      for (const s of event.sensors) {
        sensorData[s.sensorId] = s.payload
      }
    }

    return {
      ...state,
      [event.deviceId]: {
        deviceId: event.deviceId,
        status: 'online',
        lastSeenAt: event.timestamp,
        sensors: sensorData,
      },
    }
  }

  if (event.type === EVENT_DEVICE_OFFLINE) {
    const existing = state[event.deviceId]
    if (!existing) return state
    return {
      ...state,
      [event.deviceId]: { ...existing, status: 'offline' },
    }
  }

  return state
}

/** Folds a batch of events over a device map. */
export function applyEventsToDevices(
  state: DeviceMap,
  events: TelemetryEvent[],
): DeviceMap {
  let next = state
  for (const event of events) {
    next = applyEventToDevices(next, event)
  }
  return next
}

/** Marks a device as offline if it exists; otherwise returns state unchanged. */
export function markDeviceOffline(state: DeviceMap, deviceId: string): DeviceMap {
  const existing = state[deviceId]
  if (!existing) return state
  return {
    ...state,
    [deviceId]: { ...existing, status: 'offline' },
  }
}
