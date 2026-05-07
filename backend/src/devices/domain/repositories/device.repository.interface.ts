import { Device } from '../entities/device.entity';

export const DEVICE_REPOSITORY_TOKEN = 'DEVICE_REPOSITORY_TOKEN';

export interface DeviceRepositoryInterface {
  create(data: {
    name: string;
    type: string;
    macAddress: string | null;
    projectId: string;
    userId: string;
  }): Promise<Device>;
  findByProject(projectId: string, userId: string): Promise<Device[]>;
  findById(id: string, userId: string): Promise<Device | null>;
  update(
    id: string,
    userId: string,
    data: { name?: string; type?: string; macAddress?: string | null },
  ): Promise<Device>;
  delete(id: string, userId: string): Promise<void>;
}