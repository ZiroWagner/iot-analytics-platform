import { SystemMetrics } from '@/observability/domain/entities/system-metrics.entity';

export class ObservabilityDomainService {
  static buildSystemMetrics(props: {
    streamSize: number;
    consumerLag: number;
    eventsPerSecond: number;
    onlineDevices: number;
  }): SystemMetrics {
    return SystemMetrics.create(props);
  }

  static calculateEventsPerSecond(epsValues: number[]): number {
    const total = epsValues.reduce((sum, val) => sum + val, 0);
    return Math.round(total / epsValues.length);
  }

  static extractDeviceIdsFromKeys(keys: string[]): string[] {
    return keys.map((key) => key.replace('device:state:', ''));
  }

  static buildOfflineEvent(
    deviceId: string,
    projectId: string,
  ): {
    type: 'device_offline';
    deviceId: string;
    projectId: string;
    timestamp: string;
  } {
    return {
      type: 'device_offline',
      deviceId,
      projectId,
      timestamp: new Date().toISOString(),
    };
  }

  static parseRedisStatus(status: string | null): 'online' | 'offline' {
    // status comes from HGET 'device:state:', 'status' which returns string or null
    return status === 'online' ? 'online' : 'offline';
  }

  static extractLagFromGroup(group: string[]): number {
    const lagIdx = group.indexOf('lag');
    return lagIdx !== -1 ? parseInt(group[lagIdx + 1]) || 0 : 0;
  }

  static extractStreamLength(xinfo: string[]): number {
    const lengthIndex = xinfo.indexOf('length');
    return lengthIndex !== -1 ? parseInt(xinfo[lengthIndex + 1]) || 0 : 0;
  }

  static buildDeviceStateUpdate(deviceId: string): {
    key: string;
    data: Record<string, string>;
  } {
    return {
      key: `device:state:${deviceId}`,
      data: { status: 'offline' },
    };
  }
}
