import { IngestDomainService } from '@/ingest/domain/services/ingest-domain.service';
import { SensorReading } from '@/ingest/domain/entities/sensor-reading.entity';

describe('IngestDomainService', () => {
  describe('validatePayload', () => {
    it('should validate correctly with valid data', () => {
      const payload = {
        device: { apiKey: 'key1' },
        timestamp: new Date().toISOString(),
        sensors: [{ sensor_id: 's1', payload: { v: 10 } }],
      };
      const result = IngestDomainService.validatePayload(payload);
      expect(result.isValid).toBe(true);
      expect(result.sensors).toHaveLength(1);
      expect(result.sensors[0]).toBeInstanceOf(SensorReading);
    });

    it('should fail if apiKey is missing', () => {
      const payload = { device: { apiKey: '' }, sensors: [] } as any;
      const result = IngestDomainService.validatePayload(payload);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API Key missing');
    });
  });

  describe('parseStreamMessages', () => {
    it('should parse redis stream messages', () => {
      const messages: Array<[string, string[]]> = [
        [
          '1-0',
          [
            'deviceId',
            'd1',
            'timestamp',
            '2026-05-16T10:00:00Z',
            'sensors',
            '[]',
          ],
        ],
      ];
      const result = IngestDomainService.parseStreamMessages(messages);
      expect(result).toHaveLength(1);
      expect(result[0].deviceId).toBe('d1');
    });
  });

  describe('serializeSensorsForStream', () => {
    it('should stringify sensors data', () => {
      const readings = [
        SensorReading.fromPlain({ sensorId: 's1', payload: { v: 1 } }),
      ];
      const result = IngestDomainService.serializeSensorsForStream(readings);
      const parsed = JSON.parse(result);
      expect(parsed[0].sensorId).toBe('s1');
    });
  });
});
