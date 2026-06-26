import { ObservabilityDomainService } from '@/observability/domain/services/observability-domain.service';

describe('ObservabilityDomainService', () => {
  describe('buildSystemMetrics', () => {
    it('creates a SystemMetrics instance with given values', () => {
      const metrics = ObservabilityDomainService.buildSystemMetrics({
        streamSize: 100,
        consumerLag: 5,
        eventsPerSecond: 42,
        onlineDevices: 10,
      });
      expect(metrics.streamSize).toBe(100);
      expect(metrics.consumerLag).toBe(5);
      expect(metrics.eventsPerSecond).toBe(42);
      expect(metrics.onlineDevices).toBe(10);
      expect(metrics.timestamp).toBeDefined();
    });
  });

  describe('calculateEventsPerSecond', () => {
    it('returns the rounded average of EPS values', () => {
      expect(
        ObservabilityDomainService.calculateEventsPerSecond([10, 20, 30]),
      ).toBe(20);
    });

    it('rounds down fractional averages', () => {
      expect(ObservabilityDomainService.calculateEventsPerSecond([1, 2])).toBe(
        2,
      );
    });
  });

  describe('extractDeviceIdsFromKeys', () => {
    it('strips the device:state: prefix from keys', () => {
      const result = ObservabilityDomainService.extractDeviceIdsFromKeys([
        'device:state:abc',
        'device:state:def',
      ]);
      expect(result).toEqual(['abc', 'def']);
    });

    it('handles empty array', () => {
      expect(ObservabilityDomainService.extractDeviceIdsFromKeys([])).toEqual(
        [],
      );
    });
  });

  describe('buildOfflineEvent', () => {
    it('builds a device_offline event with timestamp', () => {
      const event = ObservabilityDomainService.buildOfflineEvent('d1', 'p1');
      expect(event.type).toBe('device_offline');
      expect(event.deviceId).toBe('d1');
      expect(event.projectId).toBe('p1');
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('parseRedisStatus', () => {
    it('returns online for "online" string', () => {
      expect(ObservabilityDomainService.parseRedisStatus('online')).toBe(
        'online',
      );
    });

    it('returns offline for null', () => {
      expect(ObservabilityDomainService.parseRedisStatus(null)).toBe('offline');
    });

    it('returns offline for any other string', () => {
      expect(ObservabilityDomainService.parseRedisStatus('unknown')).toBe(
        'offline',
      );
    });
  });

  describe('extractLagFromGroup', () => {
    it('extracts lag value from group info array', () => {
      expect(
        ObservabilityDomainService.extractLagFromGroup([
          'name',
          'mygroup',
          'lag',
          '42',
        ]),
      ).toBe(42);
    });

    it('returns 0 when lag key is not present', () => {
      expect(
        ObservabilityDomainService.extractLagFromGroup(['name', 'mygroup']),
      ).toBe(0);
    });

    it('returns 0 when lag value is not a number', () => {
      expect(
        ObservabilityDomainService.extractLagFromGroup(['lag', 'invalid']),
      ).toBe(0);
    });
  });

  describe('extractStreamLength', () => {
    it('extracts length from XINFO array', () => {
      expect(
        ObservabilityDomainService.extractStreamLength([
          'length',
          '500',
          'groups',
          '1',
        ]),
      ).toBe(500);
    });

    it('returns 0 when length value is not a number', () => {
      expect(
        ObservabilityDomainService.extractStreamLength(['length', 'nan']),
      ).toBe(0);
    });

    it('returns 0 when length key is absent', () => {
      expect(
        ObservabilityDomainService.extractStreamLength(['groups', '1']),
      ).toBe(0);
    });
  });

  describe('buildDeviceStateUpdate', () => {
    it('returns the correct Redis key and offline data', () => {
      const result =
        ObservabilityDomainService.buildDeviceStateUpdate('dev123');
      expect(result.key).toBe('device:state:dev123');
      expect(result.data).toEqual({ status: 'offline' });
    });
  });
});
