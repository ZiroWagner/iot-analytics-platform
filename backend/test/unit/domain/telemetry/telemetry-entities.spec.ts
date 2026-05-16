import { DeviceSnapshot } from '@/telemetry/domain/entities/device-snapshot.entity';
import { TelemetryEvent } from '@/telemetry/domain/entities/telemetry-event.entity';

describe('Telemetry Entities', () => {
  describe('DeviceSnapshot', () => {
    it('should create from redis data', () => {
      const state = { status: 'online', lastSeenAt: '2026-05-16T10:00:00Z' };
      const snapshot = DeviceSnapshot.fromRedis(state);
      expect(snapshot.status).toBe('online');
      expect(snapshot.isOnline()).toBe(true);
    });

    it('should default to offline', () => {
      const snapshot = DeviceSnapshot.fromRedis({});
      expect(snapshot.status).toBe('offline');
      expect(snapshot.isOnline()).toBe(false);
    });
  });

  describe('TelemetryEvent', () => {
    it('should create from pubsub data', () => {
      const plain = {
        type: 'device_data',
        deviceId: 'd1',
        projectId: 'p1',
        timestamp: 'ts',
        sensors: [{ sensor_id: 's1', payload: { v: 1 } }],
      };
      const event = TelemetryEvent.fromPubSub(plain);
      expect(event.type).toBe('device_data');
      expect(event.sensors).toHaveLength(1);
      expect(event.getRoomName()).toBe('project:p1');
    });

    it('should return unknown room if no project', () => {
      const event = TelemetryEvent.fromPubSub({
        type: 'device_offline',
        deviceId: 'd1',
        timestamp: 'ts',
      });
      expect(event.getRoomName()).toBe('unknown');
    });
  });
});
