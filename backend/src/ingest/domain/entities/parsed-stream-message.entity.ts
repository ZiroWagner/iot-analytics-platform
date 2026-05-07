import { SensorReading } from './sensor-reading.entity';

export class ParsedStreamMessage {
    constructor(
        public readonly id: string,
        public readonly deviceId: string,
        public readonly timestamp: Date,
        public readonly sensors: SensorReading[],
    ) {}

    static fromStreamData(
        id: string,
        deviceId: string,
        timestamp: string,
        sensorsJson: string,
    ): ParsedStreamMessage {
        const sensors = JSON.parse(sensorsJson || '[]').map((s: any) =>
            SensorReading.fromPlain(s),
        );
        return new ParsedStreamMessage(id, deviceId, new Date(timestamp), sensors);
    }
}
