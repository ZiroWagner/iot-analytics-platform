export class TelemetryEvent {
    constructor(
        public readonly type: 'device_data' | 'device_offline',
        public readonly deviceId: string,
        public readonly projectId: string | null,
        public readonly timestamp: string,
        public readonly sensors: Array<{ sensorId: string; payload: Record<string, unknown> }>,
    ) {}

    static fromPubSub(plain: {
        type: string;
        deviceId: string;
        projectId?: string;
        timestamp: string;
        sensors?: Array<{ sensor_id: string; payload: Record<string, unknown> }>;
    }): TelemetryEvent {
        return new TelemetryEvent(
            plain.type as 'device_data' | 'device_offline',
            plain.deviceId,
            plain.projectId || null,  // ✅ Now handles offline events with projectId
            plain.timestamp,
            (plain.sensors || []).map((s) => ({
                sensorId: s.sensor_id,
                payload: s.payload,
            })),
        );
    }

    getRoomName(): string {
        return this.projectId ? `project:${this.projectId}` : 'unknown';
    }
}