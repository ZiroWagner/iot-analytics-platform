import { TelemetryDomainService } from '@/telemetry/domain/services/telemetry-domain.service';
import { TelemetryEvent } from '@/telemetry/domain/entities/telemetry-event.entity';

describe('TelemetryDomainService', () => {
  describe('parsePubSubMessage', () => {
    it('should parse valid message', () => {
      const message = JSON.stringify({
        deviceId: 'd1',
        projectId: 'p1',
        type: 'DATA',
        timestamp: new Date().toISOString(),
        sensors: [],
      });
      const result = TelemetryDomainService.parsePubSubMessage(message);
      expect(result).toBeInstanceOf(TelemetryEvent);
      expect(result?.deviceId).toBe('d1');
    });

    it('should return null for invalid JSON', () => {
      const result = TelemetryDomainService.parsePubSubMessage('invalid');
      expect(result).toBeNull();
    });
  });

  describe('groupEventsByProject', () => {
    it('should group events by project id', () => {
      const ts = new Date().toISOString();
      const e1 = new TelemetryEvent('device_data', 'd1', 'p1', ts, []);
      const e2 = new TelemetryEvent('device_data', 'd2', 'p2', ts, []);
      const e3 = new TelemetryEvent('device_data', 'd3', 'p1', ts, []);

      const result = TelemetryDomainService.groupEventsByProject([e1, e2, e3]);
      expect(result.get('p1')).toHaveLength(2);
      expect(result.get('p2')).toHaveLength(1);
    });
  });

  describe('buildTelemetryBatch', () => {
    it('should build a batch payload', () => {
      const e1 = new TelemetryEvent(
        'device_data',
        'd1',
        'p1',
        new Date().toISOString(),
        [],
      );
      const result = TelemetryDomainService.buildTelemetryBatch('p1', [e1]);
      expect(result.projectId).toBe('p1');
      expect(result.count).toBe(1);
      expect(result.events).toHaveLength(1);
    });
  });

  describe('buildTelemetryBatchWithStatus', () => {
    it('should build batch with device statuses', () => {
      const ts = new Date().toISOString();
      const e1 = new TelemetryEvent('device_data', 'd1', 'p1', ts, [
        { sensorId: 's1', payload: { value: 10 } },
      ]);
      const result = TelemetryDomainService.buildTelemetryBatchWithStatus(
        'p1',
        [e1],
      );

      expect(result.projectId).toBe('p1');
      expect(result.devices['d1'].status).toBe('online');
      expect(result.devices['d1'].sensors).toHaveLength(1);
    });
  });

  describe('serializeSnapshotForRedis', () => {
    it('should serialize snapshot correctly', () => {
      const ts = new Date().toISOString();
      const result = TelemetryDomainService.serializeSnapshotForRedis({
        deviceId: 'd1',
        status: 'online',
        lastSeenAt: ts,
        sensors: [],
      } as any);

      expect(result.status).toBe('online');
      expect(result.lastSeenAt).toBe(ts);
    });
  });
});
