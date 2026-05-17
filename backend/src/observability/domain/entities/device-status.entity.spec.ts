import { DeviceStatus } from '../entities/device-status.entity';

describe('DeviceStatus Entity', () => {
  describe('create', () => {
    it('creates an online device status', () => {
      const status = DeviceStatus.create({
        deviceId: 'd1',
        status: 'online',
        lastSeenAt: '2026-01-01T00:00:00Z',
      });
      expect(status.deviceId).toBe('d1');
      expect(status.status).toBe('online');
      expect(status.lastSeenAt).toBe('2026-01-01T00:00:00Z');
    });

    it('defaults to offline when status is not provided', () => {
      const status = DeviceStatus.create({ deviceId: 'd1' });
      expect(status.status).toBe('offline');
      expect(status.lastSeenAt).toBeNull();
    });
  });

  describe('isOnline / isOffline', () => {
    it('isOnline returns true for online devices', () => {
      const status = DeviceStatus.create({ deviceId: 'd1', status: 'online' });
      expect(status.isOnline()).toBe(true);
      expect(status.isOffline()).toBe(false);
    });

    it('isOffline returns true for offline devices', () => {
      const status = DeviceStatus.create({ deviceId: 'd1', status: 'offline' });
      expect(status.isOnline()).toBe(false);
      expect(status.isOffline()).toBe(true);
    });
  });

  describe('toBroadcastEvent', () => {
    it('returns a device_offline event with timestamp', () => {
      const status = DeviceStatus.create({ deviceId: 'd1' });
      const event = status.toBroadcastEvent();
      expect(event.type).toBe('device_offline');
      expect(event.deviceId).toBe('d1');
      expect(event.timestamp).toBeDefined();
    });
  });
});
