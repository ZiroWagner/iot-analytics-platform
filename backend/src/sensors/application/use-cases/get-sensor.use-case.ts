import { Injectable, Inject } from '@nestjs/common';
import { SENSOR_REPOSITORY_TOKEN } from '../../domain/repositories/sensor.repository.interface';
import type { SensorRepositoryInterface } from '../../domain/repositories/sensor.repository.interface';
import type { Sensor } from '../../domain/entities/sensor.entity';

@Injectable()
export class GetSensorUseCase {
  constructor(
    @Inject(SENSOR_REPOSITORY_TOKEN)
    private readonly sensorRepository: SensorRepositoryInterface,
  ) {}

  async execute(userId: string, sensorId: string): Promise<Sensor | null> {
    return this.sensorRepository.findById(sensorId, userId);
  }
}