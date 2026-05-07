import { Sensor } from '../entities/sensor.entity';

export const SENSOR_REPOSITORY_TOKEN = 'SENSOR_REPOSITORY_TOKEN';

export interface SensorRepositoryInterface {
  create(data: {
    name: string;
    deviceId: string;
    metadata: Record<string, unknown>;
    userId: string;
  }): Promise<Sensor>;
  findByDevice(deviceId: string, userId: string): Promise<Sensor[]>;
  findById(id: string, userId: string): Promise<Sensor | null>;
  update(
    id: string,
    userId: string,
    data: { name?: string; metadata?: Record<string, unknown> },
  ): Promise<Sensor>;
  delete(id: string, userId: string): Promise<void>;
  getDataPoints(
    sensorId: string,
    userId: string,
    filters?: { from?: Date; to?: Date; limit?: number },
  ): Promise<any[]>;
}