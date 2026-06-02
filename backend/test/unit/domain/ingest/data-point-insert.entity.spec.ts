import { DataPointInsert } from '@/ingest/domain/entities/data-point-insert.entity';
import { testData } from '@test/utils/test-data';

describe('DataPointInsert Entity', () => {
  describe('create', () => {
    it('creates a data point insert with sensorId, timestamp and payload', () => {
      const sensorId = testData.uuid();
      const timestamp = new Date('2026-01-15T10:00:00.000Z');
      const payload = { temperature: 22.5, humidity: 60 };

      const dataPoint = DataPointInsert.create(sensorId, timestamp, payload);

      expect(dataPoint.sensorId).toBe(sensorId);
      expect(dataPoint.timestamp).toEqual(timestamp);
      expect(dataPoint.payload).toEqual(payload);
    });

    it('creates a data point insert with numeric values', () => {
      const dataPoint = DataPointInsert.create(
        testData.uuid(),
        new Date(),
        { value: 42 },
      );
      expect(dataPoint.payload).toEqual({ value: 42 });
    });

    it('creates a data point insert with string values', () => {
      const dataPoint = DataPointInsert.create(
        testData.uuid(),
        new Date(),
        { status: 'online', message: 'all good' },
      );
      expect(dataPoint.payload).toEqual({ status: 'online', message: 'all good' });
    });

    it('creates a data point insert with array payload', () => {
      const dataPoint = DataPointInsert.create(
        testData.uuid(),
        new Date(),
        { values: [1, 2, 3, 4, 5] },
      );
      expect(dataPoint.payload).toEqual({ values: [1, 2, 3, 4, 5] });
    });

    it('creates a data point insert with nested object payload', () => {
      const payload = {
        location: { lat: 19.43, lng: -99.13, alt: 2250 },
        readings: [{ sensor: 'a', value: 10 }, { sensor: 'b', value: 20 }],
      };
      const dataPoint = DataPointInsert.create(testData.uuid(), new Date(), payload);
      expect(dataPoint.payload).toEqual(payload);
    });
  });
});
