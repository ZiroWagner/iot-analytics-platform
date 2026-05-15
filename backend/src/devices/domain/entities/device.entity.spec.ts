import { Device } from '../entities/device.entity';

describe('Device Entity', () => {
  const validProps = {
    id: 'd1',
    name: 'ESP32-Node',
    type: 'ESP32',
    macAddress: null as string | null,
    projectId: 'p1',
  };

  describe('create', () => {
    it('creates a device with a generated API key', () => {
      const device = Device.create(validProps);
      expect(device.id).toBe('d1');
      expect(device.name).toBe('ESP32-Node');
      expect(device.type).toBe('ESP32');
      expect(device.projectId).toBe('p1');
      expect(device.apiKey).toMatch(/^iot_[0-9a-f]{32}$/);
      expect(device.macAddress).toBeNull();
      expect(device.lastSeenAt).toBeNull();
    });

    it('validates and normalizes a MAC address', () => {
      const device = Device.create({
        ...validProps,
        macAddress: '00-1A-2B-3C-4D-5E',
      });
      expect(device.macAddress).toBe('00:1a:2b:3c:4d:5e');
    });

    it('throws when name is empty', () => {
      expect(() => Device.create({ ...validProps, name: '' })).toThrow(
        'Device name is required',
      );
    });

    it('throws when type is empty', () => {
      expect(() => Device.create({ ...validProps, type: '' })).toThrow(
        'Device type is required',
      );
    });

    it('throws when projectId is missing', () => {
      expect(() =>
        Device.create({ ...validProps, projectId: '' }),
      ).toThrow('Project ID is required');
    });
  });

  describe('createFromPersistence', () => {
    it('reconstructs a device from persisted data', () => {
      const now = new Date();
      const device = Device.createFromPersistence({
        id: 'd1',
        name: 'Node',
        apiKey: 'iot_abc',
        macAddress: '00:11:22:33:44:55',
        type: 'Raspberry',
        projectId: 'p1',
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      });
      expect(device.apiKey).toBe('iot_abc');
      expect(device.lastSeenAt).toBe(now);
    });
  });

  describe('update', () => {
    it('updates name and type', () => {
      const device = Device.create(validProps);
      device.update({ name: 'New Name', type: 'Raspberry Pi' });
      expect(device.name).toBe('New Name');
      expect(device.type).toBe('Raspberry Pi');
    });

    it('updates mac address', () => {
      const device = Device.create(validProps);
      device.update({ macAddress: 'AA:BB:CC:DD:EE:FF' });
      expect(device.macAddress).toBe('aa:bb:cc:dd:ee:ff');
    });

    it('clears mac address when set to null', () => {
      const device = Device.create({
        ...validProps,
        macAddress: '00:1A:2B:3C:4D:5E',
      });
      device.update({ macAddress: null });
      expect(device.macAddress).toBeNull();
    });

    it('throws when updating name to empty', () => {
      const device = Device.create(validProps);
      expect(() => device.update({ name: '' })).toThrow(
        'Device name cannot be empty',
      );
    });

    it('throws when updating type to empty', () => {
      const device = Device.create(validProps);
      expect(() => device.update({ type: '' })).toThrow(
        'Device type cannot be empty',
      );
    });
  });
});
