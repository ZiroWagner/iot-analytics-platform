import { Injectable, Inject } from '@nestjs/common';
import { SENSOR_REPOSITORY_TOKEN } from '../../domain/repositories/sensor.repository.interface';
import type { SensorRepositoryInterface } from '../../domain/repositories/sensor.repository.interface';
import type { Sensor } from '../../domain/entities/sensor.entity';

@Injectable()
export class CreateSensorUseCase {
  constructor(
    @Inject(SENSOR_REPOSITORY_TOKEN)
    private readonly sensorRepository: SensorRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    data: { name: string; deviceId: string; metadata?: Record<string, unknown> },
  ): Promise<Sensor> {
    return this.sensorRepository.create({
      userId,
      name: data.name,
      deviceId: data.deviceId,
      metadata: data.metadata ?? {},
    });
  }
}