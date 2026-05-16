import { 
  buildDeviceMapFromInitialState, 
  applyEventToDevices, 
  applyEventsToDevices,
  markDeviceOffline,
  EVENT_DEVICE_DATA, 
  EVENT_DEVICE_OFFLINE 
} from '@/features/telemetry/domain/reducers'
import { describe, expect, it } from 'vitest'
import { faker } from '@faker-js/faker'

describe('Telemetry Reducers', () => {
  it('buildDeviceMapFromInitialState should create correct structure', () => {
    const deviceId = faker.string.uuid()
    const lastSeen = faker.date.recent().toISOString()
    const snapshot = {
      [deviceId]: { status: 'online', lastSeenAt: lastSeen }
    }
    const result = buildDeviceMapFromInitialState(snapshot as any)
    expect(result[deviceId]).toEqual({
      deviceId,
      status: 'online',
      lastSeenAt: lastSeen,
      sensors: {}
    })
  })

  it('buildDeviceMapFromInitialState should handle missing status/date', () => {
    const snapshot = { 'd1': {} }
    const result = buildDeviceMapFromInitialState(snapshot as any)
    expect(result['d1'].status).toBe('offline')
    expect(result['d1'].lastSeenAt).toBe('')
  })

  it('applyEventToDevices should update sensor data and status', () => {
    const deviceId = 'd1'
    const timestamp = faker.date.recent().toISOString()
    const state = {}
    const event = {
      type: EVENT_DEVICE_DATA,
      deviceId,
      timestamp,
      sensors: [{ sensor_id: 's1', payload: 42 }]
    }
    
    const next = applyEventToDevices(state as any, event as any)
    expect(next[deviceId]).toBeDefined()
    expect(next[deviceId].status).toBe('online')
    expect(next[deviceId].lastSeenAt).toBe(timestamp)
    expect(next[deviceId].sensors['s1']).toBe(42)
  })

  it('applyEventToDevices should merge with existing sensors', () => {
    const state = {
      'd1': { deviceId: 'd1', status: 'online', sensors: { 's1': 10 } }
    }
    const event = {
      type: EVENT_DEVICE_DATA,
      deviceId: 'd1',
      timestamp: 'now',
      sensors: [{ sensor_id: 's2', payload: 20 }]
    }
    
    const next = applyEventToDevices(state as any, event as any)
    expect(next['d1'].sensors['s1']).toBe(10)
    expect(next['d1'].sensors['s2']).toBe(20)
  })

  it('applyEventToDevices should mark offline', () => {
    const state = {
      'd1': { deviceId: 'd1', status: 'online', sensors: {} }
    }
    const event = {
      type: EVENT_DEVICE_OFFLINE,
      deviceId: 'd1'
    }
    
    const next = applyEventToDevices(state as any, event as any)
    expect(next['d1'].status).toBe('offline')
  })

  it('applyEventToDevices should ignore offline event if device not in state', () => {
    const state = {}
    const event = { type: EVENT_DEVICE_OFFLINE, deviceId: 'unknown' }
    const next = applyEventToDevices(state as any, event as any)
    expect(next).toEqual({})
  })

  it('applyEventsToDevices should process a batch', () => {
    const events = [
      { type: EVENT_DEVICE_DATA, deviceId: 'd1', timestamp: 't1', sensors: [{ sensor_id: 's1', payload: 1 }] },
      { type: EVENT_DEVICE_DATA, deviceId: 'd1', timestamp: 't2', sensors: [{ sensor_id: 's1', payload: 2 }] }
    ]
    const next = applyEventsToDevices({}, events as any)
    expect(next['d1'].sensors['s1']).toBe(2)
    expect(next['d1'].lastSeenAt).toBe('t2')
  })

  it('markDeviceOffline should update status correctly', () => {
    const state = { 'd1': { status: 'online' } }
    const next = markDeviceOffline(state as any, 'd1')
    expect(next['d1'].status).toBe('offline')
  })

  it('markDeviceOffline should return state if device missing', () => {
    const state = { 'd1': { status: 'online' } }
    const next = markDeviceOffline(state as any, 'd2')
    expect(next).toBe(state)
  })
})
