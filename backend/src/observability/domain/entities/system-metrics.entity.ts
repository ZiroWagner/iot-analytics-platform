export class SystemMetrics {
  constructor(
    public readonly streamSize: number,
    public readonly consumerLag: number,
    public readonly eventsPerSecond: number,
    public readonly onlineDevices: number,
    public readonly timestamp: string,
    public readonly pendingMessages: number = 0,
    public readonly redisMemoryUsedBytes: number = 0,
    public readonly dbInsertLatencyMs: number = 0,
  ) {}

  static create(props: {
    streamSize: number;
    consumerLag: number;
    eventsPerSecond: number;
    onlineDevices: number;
    pendingMessages?: number;
    redisMemoryUsedBytes?: number;
    dbInsertLatencyMs?: number;
  }): SystemMetrics {
    return new SystemMetrics(
      props.streamSize,
      props.consumerLag,
      props.eventsPerSecond,
      props.onlineDevices,
      new Date().toISOString(),
      props.pendingMessages ?? 0,
      props.redisMemoryUsedBytes ?? 0,
      props.dbInsertLatencyMs ?? 0,
    );
  }

  toPlain(): {
    streamSize: number;
    consumerLag: number;
    eventsPerSecond: number;
    onlineDevices: number;
    timestamp: string;
    pendingMessages: number;
    redisMemoryUsedBytes: number;
    dbInsertLatencyMs: number;
  } {
    return {
      streamSize: this.streamSize,
      consumerLag: this.consumerLag,
      eventsPerSecond: this.eventsPerSecond,
      onlineDevices: this.onlineDevices,
      timestamp: this.timestamp,
      pendingMessages: this.pendingMessages,
      redisMemoryUsedBytes: this.redisMemoryUsedBytes,
      dbInsertLatencyMs: this.dbInsertLatencyMs,
    };
  }
}
