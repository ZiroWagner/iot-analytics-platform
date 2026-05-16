import { Sensor } from '../../src/sensors/domain/entities/sensor.entity';

export class SensorBuilder {
  private props = {
    id: 'sens_123',
    deviceId: 'dev_123',
    name: 'Test Sensor',
    type: 'TEMPERATURE',
    unit: 'C',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  static aSensor() {
    return new SensorBuilder();
  }

  withName(name: string) {
    this.props.name = name;
    return this;
  }

  withDevice(deviceId: string) {
    this.props.deviceId = deviceId;
    return this;
  }

  withUnit(unit: string) {
    this.props.unit = unit;
    return this;
  }

  build(): Sensor {
    return new (Sensor as any)(...Object.values(this.props));
  }
}
