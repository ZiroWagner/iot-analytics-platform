import { Prisma } from '@prisma/client';

export class DataPointInsert {
  constructor(
    public readonly sensorId: string,
    public readonly timestamp: Date,
    public readonly payload: Prisma.InputJsonValue,
  ) {}

  static create(
    sensorId: string,
    timestamp: Date,
    payload: Record<string, unknown>,
  ): DataPointInsert {
    return new DataPointInsert(
      sensorId,
      timestamp,
      payload as Prisma.InputJsonValue,
    );
  }
}
