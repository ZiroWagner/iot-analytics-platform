import { Injectable, Inject } from '@nestjs/common';
import { SENSOR_REPOSITORY_TOKEN } from '../../domain/repositories/sensor.repository.interface';
import type { SensorRepositoryInterface } from '../../domain/repositories/sensor.repository.interface';
import type { Sensor } from '../../domain/entities/sensor.entity';

@Injectable()
export class UpdateSensorUseCase {
  constructor(
    @Inject(SENSOR_REPOSITORY_TOKEN)
    private readonly sensorRepository: SensorRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    sensorId: string,
    data: { name?: string; metadata?: Record<string, unknown> },
  ): Promise<Sensor> {
    return this.sensorRepository.update(sensorId, userId, data);
  }
}
