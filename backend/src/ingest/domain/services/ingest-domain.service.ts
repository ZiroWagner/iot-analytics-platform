import { SensorReading } from '@/ingest/domain/entities/sensor-reading.entity';
import { ParsedStreamMessage } from '@/ingest/domain/entities/parsed-stream-message.entity';
import { DataPointInsert } from '@/ingest/domain/entities/data-point-insert.entity';

interface PayloadSensorInput {
  sensorId: string;
  payload: Record<string, unknown>;
}

interface StreamSensorInput {
  sensor_id: string;
  payload: Record<string, unknown>;
}

export class IngestDomainService {
  static validatePayload(payload: {
    device: { apiKey: string; macAddress?: string; type?: string };
    timestamp?: string;
    sensors: StreamSensorInput[];
  }): {
    isValid: boolean;
    timestamp: string;
    sensors: SensorReading[];
    error?: string;
  } {
    if (!payload?.device?.apiKey) {
      return {
        isValid: false,
        timestamp: '',
        sensors: [],
        error: 'API Key missing',
      };
    }

    const sensors = (payload.sensors || []).map((s) =>
      SensorReading.fromPlain({ sensorId: s.sensor_id, payload: s.payload }),
    );

    return {
      isValid: true,
      timestamp: payload.timestamp || new Date().toISOString(),
      sensors,
    };
  }

  static parseStreamMessages(
    messages: Array<[string, string[]]>,
  ): ParsedStreamMessage[] {
    return messages.map(([id, fields]) => {
      const data: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }
      return ParsedStreamMessage.fromStreamData(
        id,
        data.deviceId,
        data.timestamp,
        data.sensors || '[]',
      );
    });
  }

  static prepareDataPoints(
    parsedMessages: ParsedStreamMessage[],
    sensorMap: Map<string, string>,
  ): { dataPoints: DataPointInsert[]; messageIds: string[] } {
    const dataPoints: DataPointInsert[] = [];
    const messageIds: string[] = [];

    for (const msg of parsedMessages) {
      for (const s of msg.sensors) {
        const dbSensorId = sensorMap.get(`${msg.deviceId}:${s.sensorId}`);
        if (dbSensorId) {
          dataPoints.push(
            DataPointInsert.create(dbSensorId, msg.timestamp, s.payload),
          );
        }
      }
      messageIds.push(msg.id);
    }

    return { dataPoints, messageIds };
  }

  static getLatestTimestamps(
    parsedMessages: ParsedStreamMessage[],
  ): Map<string, Date> {
    const deviceTimestamps = new Map<string, Date>();

    for (const msg of parsedMessages) {
      const existing = deviceTimestamps.get(msg.deviceId);
      if (!existing || msg.timestamp > existing) {
        deviceTimestamps.set(msg.deviceId, msg.timestamp);
      }
    }

    return deviceTimestamps;
  }

  static serializeSensorsForStream(sensors: SensorReading[]): string {
    return JSON.stringify(
      sensors.map((s) => ({
        sensorId: s.sensorId,
        payload: s.payload,
      })),
    );
  }
}
