import { Injectable, Inject } from '@nestjs/common';
import { SENSOR_REPOSITORY_TOKEN } from '@/sensors/domain/repositories/sensor.repository.interface';
import type { SensorRepositoryInterface } from '@/sensors/domain/repositories/sensor.repository.interface';

@Injectable()
export class DeleteSensorUseCase {
  constructor(
    @Inject(SENSOR_REPOSITORY_TOKEN)
    private readonly sensorRepository: SensorRepositoryInterface,
  ) {}

  async execute(userId: string, sensorId: string): Promise<void> {
    await this.sensorRepository.delete(sensorId, userId);
  }
}
