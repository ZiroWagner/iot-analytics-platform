import { SensorReading } from '@/ingest/domain/entities/sensor-reading.entity';

export const INGEST_REPOSITORY_TOKEN = Symbol('IngestRepositoryInterface');

export interface IngestRepositoryInterface {
  resolveDeviceId(apiKey: string): Promise<string>;
  resolveProjectId(deviceId: string): Promise<string>;
  publishToStream(data: {
    deviceId: string;
    projectId: string;
    timestamp: string;
    sensors: SensorReading[];
  }): Promise<void>;
  updateDeviceState(deviceId: string, timestamp: string): Promise<void>;
  broadcastTelemetry(data: {
    deviceId: string;
    projectId: string;
    timestamp: string;
    sensors: SensorReading[];
  }): Promise<void>;
  incrementEps(): Promise<void>;
}
