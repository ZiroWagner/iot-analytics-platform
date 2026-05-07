export class DeviceSnapshot {
    constructor(
        public readonly deviceId: string,
        public readonly status: 'online' | 'offline',
        public readonly lastSeenAt: string,
    ) {}

    static fromRedis(state: Record<string, string>): DeviceSnapshot {
        const status = (state.status as 'online' | 'offline') || 'offline';
        const lastSeenAt = state.lastSeenAt || '';
        return new DeviceSnapshot('', status, lastSeenAt);
    }

    isOnline(): boolean {
        return this.status === 'online';
    }
}