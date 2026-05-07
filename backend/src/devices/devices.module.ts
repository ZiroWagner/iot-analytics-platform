import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { DevicesController } from './interfaces/http/devices.controller';

// Use Cases
import { CreateDeviceUseCase } from './application/use-cases/create-device.use-case';
import { GetDevicesByProjectUseCase } from './application/use-cases/get-devices-by-project.use-case';
import { GetDeviceUseCase } from './application/use-cases/get-device.use-case';
import { UpdateDeviceUseCase } from './application/use-cases/update-device.use-case';
import { DeleteDeviceUseCase } from './application/use-cases/delete-device.use-case';

// Repositories
import { DEVICE_REPOSITORY_TOKEN } from './domain/repositories/device.repository.interface';
import { PrismaDeviceRepository } from './infrastructure/repositories/prisma-device.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DevicesController],
  providers: [
    // Repositories
    {
      provide: DEVICE_REPOSITORY_TOKEN,
      useClass: PrismaDeviceRepository,
    },
    // Use Cases
    CreateDeviceUseCase,
    GetDevicesByProjectUseCase,
    GetDeviceUseCase,
    UpdateDeviceUseCase,
    DeleteDeviceUseCase,
  ],
})
export class DevicesModule {}