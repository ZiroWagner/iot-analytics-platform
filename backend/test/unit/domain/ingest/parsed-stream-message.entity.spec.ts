import { ParsedStreamMessage } from '@/ingest/domain/entities/parsed-stream-message.entity';
import { testData } from '@test/utils/test-data';

describe('ParsedStreamMessage Entity', () => {
  describe('create', () => {
    it('creates a parsed stream message with sensors', () => {
      const id = testData.uuid();
      const deviceId = testData.uuid();
      const timestamp = '2026-01-15T10:00:00.000Z';
      const sensorsJson = JSON.stringify([
        { sensorId: 's1', payload: { temperature: 22.5 } },
        { sensorId: 's2', payload: { humidity: 60 } },
      ]);

      const message = ParsedStreamMessage.fromStreamData(
        id,
        deviceId,
        timestamp,
        sensorsJson,
      );

      expect(message.id).toBe(id);
      expect(message.deviceId).toBe(deviceId);
      expect(message.timestamp).toEqual(new Date(timestamp));
      expect(message.sensors).toHaveLength(2);
      expect(message.sensors[0].sensorId).toBe('s1');
      expect(message.sensors[0].payload).toEqual({ temperature: 22.5 });
      expect(message.sensors[1].sensorId).toBe('s2');
      expect(message.sensors[1].payload).toEqual({ humidity: 60 });
    });

    it('creates a parsed stream message with empty sensors array', () => {
      const message = ParsedStreamMessage.fromStreamData(
        testData.uuid(),
        testData.uuid(),
        '2026-01-15T10:00:00.000Z',
        '[]',
      );

      expect(message.sensors).toHaveLength(0);
    });

    it('creates a parsed stream message with null for sensorsJson as empty sensors', () => {
      const message = ParsedStreamMessage.fromStreamData(
        testData.uuid(),
        testData.uuid(),
        '2026-01-15T10:00:00.000Z',
        null as unknown as string,
      );

      expect(message.sensors).toHaveLength(0);
    });

    it('handles empty string for sensorsJson', () => {
      const message = ParsedStreamMessage.fromStreamData(
        testData.uuid(),
        testData.uuid(),
        '2026-01-15T10:00:00.000Z',
        '',
      );

      expect(message.sensors).toHaveLength(0);
    });
  });
});
