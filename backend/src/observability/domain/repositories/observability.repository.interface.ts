export const OBSERVABILITY_REPOSITORY_TOKEN = Symbol(
  'ObservabilityRepositoryInterface',
);

export interface ObservabilityRepositoryInterface {
  getStreamLength(): Promise<number>;
  getConsumerLag(): Promise<number>;
  getEventsPerSecond(): Promise<number>;
  countOnlineDevices(): Promise<number>;
  countOnlineDevicesForUser(userId: string): Promise<number>;
  getPendingMessages(): Promise<number>;
  getRedisMemoryUsage(): Promise<number>;
  scanActiveDeviceIds(): Promise<string[]>;
  getDeviceStates(deviceIds: string[]): Promise<
    Array<{
      deviceId: string;
      status: string | null;
      lastSeenAt: string | null;
      projectId: string | null;
    }>
  >;
  markDeviceOffline(deviceId: string): Promise<void>;
  broadcastOfflineEvent(deviceId: string, projectId: string): Promise<void>;
}
