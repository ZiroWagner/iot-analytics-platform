import { Device } from '../../src/devices/domain/entities/device.entity';

export class DeviceBuilder {
  private props = {
    id: 'dev_123',
    projectId: 'proj_123',
    name: 'Test Device',
    macAddress: '00:11:22:33:44:55',
    type: 'TEMPERATURE',
    apiKey: 'iot_testkey123',
    status: 'OFFLINE' as const,
    lastSeenAt: undefined as Date | undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  static aDevice() {
    return new DeviceBuilder();
  }

  withName(name: string) {
    this.props.name = name;
    return this;
  }

  withProject(projectId: string) {
    this.props.projectId = projectId;
    return this;
  }

  withMacAddress(macAddress: string) {
    this.props.macAddress = macAddress;
    return this;
  }

  build(): Device {
    return new (Device as any)(...Object.values(this.props));
  }
}
