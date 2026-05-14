import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { SensorsController } from './interfaces/http/sensors.controller';

// Use Cases
import { CreateSensorUseCase } from './application/use-cases/create-sensor.use-case';
import { GetSensorsByDeviceUseCase } from './application/use-cases/get-sensors-by-device.use-case';
import { GetSensorUseCase } from './application/use-cases/get-sensor.use-case';
import { UpdateSensorUseCase } from './application/use-cases/update-sensor.use-case';
import { DeleteSensorUseCase } from './application/use-cases/delete-sensor.use-case';
import { GetSensorDataPointsUseCase } from './application/use-cases/get-sensor-data-points.use-case';

// Repositories
import { SENSOR_REPOSITORY_TOKEN } from './domain/repositories/sensor.repository.interface';
import { PrismaSensorRepository } from './infrastructure/repositories/prisma-sensor.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SensorsController],
  providers: [
    // Repositories
    {
      provide: SENSOR_REPOSITORY_TOKEN,
      useClass: PrismaSensorRepository,
    },
    // Use Cases
    CreateSensorUseCase,
    GetSensorsByDeviceUseCase,
    GetSensorUseCase,
    UpdateSensorUseCase,
    DeleteSensorUseCase,
    GetSensorDataPointsUseCase,
  ],
  exports: [SENSOR_REPOSITORY_TOKEN],
})
export class SensorsModule {}
