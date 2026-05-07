export class SensorReading {
    constructor(
        public readonly sensorId: string,
        public readonly payload: Record<string, unknown>,
    ) {}

    static fromPlain(plain: { sensorId: string; payload: Record<string, unknown> }): SensorReading {
        return new SensorReading(plain.sensorId, plain.payload);
    }

    toPlain(): { sensorId: string; payload: Record<string, unknown> } {
        return {
            sensorId: this.sensorId,
            payload: this.payload,
        };
    }
}
