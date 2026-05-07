export class DeviceStatus {
    constructor(
        public readonly deviceId: string,
        public readonly status: 'online' | 'offline',
        public readonly lastSeenAt: string | null,
    ) {}

    static create(props: {
        deviceId: string;
        status?: 'online' | 'offline';
        lastSeenAt?: string | null;
    }): DeviceStatus {
        return new DeviceStatus(
            props.deviceId,
            props.status || 'offline',
            props.lastSeenAt || null,
        );
    }

    isOnline(): boolean {
        return this.status === 'online';
    }

    isOffline(): boolean {
        return this.status === 'offline';
    }

    toBroadcastEvent(): { type: 'device_offline'; deviceId: string; timestamp: string } {
        return {
            type: 'device_offline',
            deviceId: this.deviceId,
            timestamp: new Date().toISOString(),
        };
    }
}