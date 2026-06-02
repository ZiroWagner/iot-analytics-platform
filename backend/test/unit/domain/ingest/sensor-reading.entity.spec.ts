import { SensorReading } from '@/ingest/domain/entities/sensor-reading.entity';

describe('SensorReading Entity', () => {
  describe('create', () => {
    it('creates a sensor reading with sensorId and payload', () => {
      const reading = new SensorReading('sensor-1', { temperature: 22.5 });
      expect(reading.sensorId).toBe('sensor-1');
      expect(reading.payload).toEqual({ temperature: 22.5 });
    });

    it('creates a sensor reading with empty payload', () => {
      const reading = new SensorReading('sensor-2', {});
      expect(reading.payload).toEqual({});
    });

    it('creates a sensor reading with complex nested payload', () => {
      const payload = {
        temperature: 22.5,
        humidity: 60,
        location: { lat: 19.43, lng: -99.13 },
        tags: ['indoor', 'lab'],
      };
      const reading = new SensorReading('sensor-3', payload);
      expect(reading.payload).toEqual(payload);
    });
  });

  describe('fromPlain', () => {
    it('creates a sensor reading from a plain object', () => {
      const plain = {
        sensorId: 'sensor-1',
        payload: { temperature: 25.0 },
      };
      const reading = SensorReading.fromPlain(plain);
      expect(reading.sensorId).toBe('sensor-1');
      expect(reading.payload).toEqual({ temperature: 25.0 });
    });

    it('creates a sensor reading with empty payload from plain', () => {
      const reading = SensorReading.fromPlain({
        sensorId: 'sensor-2',
        payload: {},
      });
      expect(reading.payload).toEqual({});
    });
  });

  describe('toPlain', () => {
    it('converts a sensor reading to a plain object', () => {
      const reading = new SensorReading('sensor-1', { value: 10 });
      const plain = reading.toPlain();
      expect(plain).toEqual({
        sensorId: 'sensor-1',
        payload: { value: 10 },
      });
    });

    it('returns a plain object with correct sensorId', () => {
      const reading = new SensorReading('sensor-1', { value: 10 });
      const plain = reading.toPlain();
      expect(plain.sensorId).toBe('sensor-1');
    });
  });
});
