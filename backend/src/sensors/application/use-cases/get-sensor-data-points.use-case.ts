import { Injectable, Inject } from '@nestjs/common';
import { SENSOR_REPOSITORY_TOKEN } from '../../domain/repositories/sensor.repository.interface';
import type { SensorRepositoryInterface } from '../../domain/repositories/sensor.repository.interface';

@Injectable()
export class GetSensorDataPointsUseCase {
  constructor(
    @Inject(SENSOR_REPOSITORY_TOKEN)
    private readonly sensorRepository: SensorRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    sensorId: string,
    filters?: { from?: Date; to?: Date; limit?: number },
  ): Promise<any[]> {
    return this.sensorRepository.getDataPoints(sensorId, userId, filters);
  }
}