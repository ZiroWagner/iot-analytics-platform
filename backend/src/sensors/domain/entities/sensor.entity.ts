export interface SensorProps {
  id: string;
  name: string;
  deviceId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  dataPoints?: any[];
}

export class Sensor {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly deviceId: string,
    public metadata: Record<string, unknown>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly dataPoints?: any[],
  ) {}

  static create(props: {
    id: string;
    name: string;
    deviceId: string;
    metadata: Record<string, unknown>;
  }): Sensor {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Sensor name is required');
    }
    if (!props.deviceId) {
      throw new Error('Device ID is required');
    }

    return new Sensor(
      props.id,
      props.name,
      props.deviceId,
      props.metadata ?? {},
      new Date(),
      new Date(),
    );
  }

  static createFromPersistence(props: SensorProps): Sensor {
    return new Sensor(
      props.id,
      props.name,
      props.deviceId,
      props.metadata,
      props.createdAt,
      props.updatedAt,
      props.dataPoints,
    );
  }

  update(data: { name?: string; metadata?: Record<string, unknown> }): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Sensor name cannot be empty');
      }
      this.name = data.name;
    }
    if (data.metadata !== undefined) {
      this.metadata = data.metadata;
    }
  }
}