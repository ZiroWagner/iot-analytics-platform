import { Sensor } from '../entities/sensor.entity';

describe('Sensor Entity', () => {
  const validProps = {
    id: 's1',
    name: 'Temperature Sensor',
    deviceId: 'd1',
    metadata: { tags: ['indoor'] },
  };

  describe('create', () => {
    it('creates a sensor with valid properties', () => {
      const sensor = Sensor.create(validProps);
      expect(sensor.id).toBe('s1');
      expect(sensor.name).toBe('Temperature Sensor');
      expect(sensor.deviceId).toBe('d1');
      expect(sensor.metadata).toEqual({ tags: ['indoor'] });
      expect(sensor.createdAt).toBeInstanceOf(Date);
    });

    it('throws when name is empty', () => {
      expect(() => Sensor.create({ ...validProps, name: '' })).toThrow(
        'Sensor name is required',
      );
    });

    it('throws when deviceId is missing', () => {
      expect(() => Sensor.create({ ...validProps, deviceId: '' })).toThrow(
        'Device ID is required',
      );
    });
  });

  describe('createFromPersistence', () => {
    it('reconstructs a sensor from persisted data', () => {
      const now = new Date();
      const sensor = Sensor.createFromPersistence({
        id: 's1',
        name: 'Temp',
        deviceId: 'd1',
        metadata: {},
        createdAt: now,
        updatedAt: now,
        dataPoints: [{ id: 'dp1' }],
      });
      expect(sensor.dataPoints).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates the name', () => {
      const sensor = Sensor.create(validProps);
      sensor.update({ name: 'Humidity Sensor' });
      expect(sensor.name).toBe('Humidity Sensor');
    });

    it('updates metadata', () => {
      const sensor = Sensor.create(validProps);
      sensor.update({ metadata: { tags: ['outdoor'] } });
      expect(sensor.metadata).toEqual({ tags: ['outdoor'] });
    });

    it('throws when updating name to empty', () => {
      const sensor = Sensor.create(validProps);
      expect(() => sensor.update({ name: '' })).toThrow(
        'Sensor name cannot be empty',
      );
    });

    it('does not change name when undefined is passed', () => {
      const sensor = Sensor.create(validProps);
      sensor.update({ metadata: { x: 1 } });
      expect(sensor.name).toBe('Temperature Sensor');
    });
  });
});
