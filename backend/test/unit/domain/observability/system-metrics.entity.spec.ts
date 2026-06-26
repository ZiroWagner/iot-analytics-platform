import { SystemMetrics } from '@/observability/domain/entities/system-metrics.entity';

describe('SystemMetrics Entity', () => {
  describe('create', () => {
    it('creates system metrics with all required fields', () => {
      const metrics = SystemMetrics.create({
        streamSize: 1024,
        consumerLag: 50,
        eventsPerSecond: 100,
        onlineDevices: 10,
      });

      expect(metrics.streamSize).toBe(1024);
      expect(metrics.consumerLag).toBe(50);
      expect(metrics.eventsPerSecond).toBe(100);
      expect(metrics.onlineDevices).toBe(10);
      expect(metrics.timestamp).toBeDefined();
      expect(typeof metrics.timestamp).toBe('string');
    });

    it('creates system metrics with zero values', () => {
      const metrics = SystemMetrics.create({
        streamSize: 0,
        consumerLag: 0,
        eventsPerSecond: 0,
        onlineDevices: 0,
      });

      expect(metrics.streamSize).toBe(0);
      expect(metrics.consumerLag).toBe(0);
      expect(metrics.eventsPerSecond).toBe(0);
      expect(metrics.onlineDevices).toBe(0);
    });

    it('creates system metrics with large numbers', () => {
      const metrics = SystemMetrics.create({
        streamSize: 9999999,
        consumerLag: 3600,
        eventsPerSecond: 9999,
        onlineDevices: 500,
      });

      expect(metrics.streamSize).toBe(9999999);
      expect(metrics.consumerLag).toBe(3600);
    });

    it('generates an ISO timestamp on creation', () => {
      const before = new Date();
      const metrics = SystemMetrics.create({
        streamSize: 100,
        consumerLag: 5,
        eventsPerSecond: 50,
        onlineDevices: 3,
      });
      const after = new Date();

      const timestamp = new Date(metrics.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('toPlain', () => {
    it('converts system metrics to a plain object', () => {
      const metrics = SystemMetrics.create({
        streamSize: 2048,
        consumerLag: 30,
        eventsPerSecond: 200,
        onlineDevices: 25,
      });

      const plain = metrics.toPlain();

      expect(plain).toEqual({
        streamSize: 2048,
        consumerLag: 30,
        eventsPerSecond: 200,
        onlineDevices: 25,
        pendingMessages: 0,
        redisMemoryUsedBytes: 0,
        dbInsertLatencyMs: 0,
        timestamp: metrics.timestamp,
      });
    });

    it('returns a new object reference', () => {
      const metrics = SystemMetrics.create({
        streamSize: 100,
        consumerLag: 10,
        eventsPerSecond: 50,
        onlineDevices: 5,
      });

      const plain = metrics.toPlain();
      plain.streamSize = 999;
      expect(metrics.streamSize).toBe(100);
    });
  });
});
