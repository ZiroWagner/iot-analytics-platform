export class SystemMetrics {
  constructor(
    public readonly streamSize: number,
    public readonly consumerLag: number,
    public readonly eventsPerSecond: number,
    public readonly onlineDevices: number,
    public readonly timestamp: string,
  ) {}

  static create(props: {
    streamSize: number;
    consumerLag: number;
    eventsPerSecond: number;
    onlineDevices: number;
  }): SystemMetrics {
    return new SystemMetrics(
      props.streamSize,
      props.consumerLag,
      props.eventsPerSecond,
      props.onlineDevices,
      new Date().toISOString(),
    );
  }

  toPlain(): {
    streamSize: number;
    consumerLag: number;
    eventsPerSecond: number;
    onlineDevices: number;
    timestamp: string;
  } {
    return {
      streamSize: this.streamSize,
      consumerLag: this.consumerLag,
      eventsPerSecond: this.eventsPerSecond,
      onlineDevices: this.onlineDevices,
      timestamp: this.timestamp,
    };
  }
}
