import { ApiKey } from './api-key.vo';
import { MacAddress } from './mac-address.vo';

export interface DeviceProps {
  id: string;
  name: string;
  apiKey: string;
  macAddress: string | null;
  type: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date | null;
  sensors?: any[];
}

export class Device {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly apiKey: string,
    public macAddress: string | null,
    public type: string,
    public readonly projectId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public lastSeenAt: Date | null,
    public readonly sensors?: any[],
  ) {}

  static create(props: {
    id: string;
    name: string;
    type: string;
    macAddress: string | null;
    projectId: string;
  }): Device {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Device name is required');
    }
    if (!props.type || props.type.trim().length === 0) {
      throw new Error('Device type is required');
    }
    if (!props.projectId) {
      throw new Error('Project ID is required');
    }

    const apiKey = ApiKey.generate();
    const macAddress = props.macAddress ? MacAddress.create(props.macAddress).getValue() : null;

    return new Device(
      props.id,
      props.name,
      apiKey.getValue(),
      macAddress,
      props.type,
      props.projectId,
      new Date(),
      new Date(),
      null,
    );
  }

  static createFromPersistence(props: DeviceProps): Device {
    return new Device(
      props.id,
      props.name,
      props.apiKey,
      props.macAddress,
      props.type,
      props.projectId,
      props.createdAt,
      props.updatedAt,
      props.lastSeenAt,
      props.sensors,
    );
  }

  update(data: { name?: string; type?: string; macAddress?: string | null }): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Device name cannot be empty');
      }
      this.name = data.name;
    }
    if (data.type !== undefined) {
      if (!data.type || data.type.trim().length === 0) {
        throw new Error('Device type cannot be empty');
      }
      this.type = data.type;
    }
    if (data.macAddress !== undefined) {
      this.macAddress = data.macAddress ? MacAddress.create(data.macAddress).getValue() : null;
    }
  }
}