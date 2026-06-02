import { TelemetryEvent } from '@/telemetry/domain/entities/telemetry-event.entity';
import { DeviceSnapshot } from '@/telemetry/domain/entities/device-snapshot.entity';

export class TelemetryDomainService {
  static parsePubSubMessage(message: string): TelemetryEvent | null {
    try {
      const plain = JSON.parse(message);
      return TelemetryEvent.fromPubSub(plain);
    } catch {
      return null;
    }
  }

  static groupEventsByProject(
    events: TelemetryEvent[],
  ): Map<string, TelemetryEvent[]> {
    const grouped = new Map<string, TelemetryEvent[]>();

    for (const event of events) {
      const projectId = event.projectId || 'unknown';
      if (!grouped.has(projectId)) {
        grouped.set(projectId, []);
      }
      grouped.get(projectId)!.push(event);
    }

    return grouped;
  }

  static buildTelemetryBatch(
    projectId: string,
    events: TelemetryEvent[],
  ): {
    projectId: string;
    events: any[];
    count: number;
    timestamp: string;
  } {
    return {
      projectId,
      events: events.map((e) => ({
        type: e.type,
        deviceId: e.deviceId,
        projectId: e.projectId,
        timestamp: e.timestamp,
        sensors: e.sensors,
      })),
      count: events.length,
      timestamp: new Date().toISOString(),
    };
  }

  static buildTelemetryBatchWithStatus(
    projectId: string,
    events: TelemetryEvent[],
  ): {
    projectId: string;
    devices: Record<
      string,
      { status: string; lastSeenAt: string; sensors: any[] }
    >;
    count: number;
    timestamp: string;
  } {
    // Group events by device
    const deviceEvents = new Map<string, TelemetryEvent[]>();
    for (const event of events) {
      const deviceId = event.deviceId;
      if (!deviceEvents.has(deviceId)) {
        deviceEvents.set(deviceId, []);
      }
      deviceEvents.get(deviceId)!.push(event);
    }

    // Build device snapshots with status
    const devices = Object.fromEntries(
      Array.from(deviceEvents.entries()).map(([deviceId, devEvents]) => [
        deviceId,
        {
          status: 'online', // Device is online if sending data
          lastSeenAt: devEvents[devEvents.length - 1].timestamp,
          sensors: devEvents[devEvents.length - 1].sensors,
        },
      ]),
    );

    return {
      projectId,
      devices, // Now includes device status for real-time updates
      count: events.length,
      timestamp: new Date().toISOString(),
    };
  }

  static serializeSnapshotForRedis(
    snapshot: DeviceSnapshot,
  ): Record<string, string> {
    return {
      status: snapshot.status,
      lastSeenAt: snapshot.lastSeenAt,
    };
  }
}
