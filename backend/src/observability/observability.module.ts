import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { ObservabilityController } from './interfaces/http/observability.controller';

// Use Cases
import { GetSystemMetricsUseCase } from './application/use-cases/get-system-metrics.use-case';
import { CheckOfflineDevicesUseCase } from './application/use-cases/check-offline-devices.use-case';

// Repositories
import { OBSERVABILITY_REPOSITORY_TOKEN } from './domain/repositories/observability.repository.interface';
import { RedisObservabilityRepository } from './infrastructure/repositories/redis-observability.repository';

// Infrastructure schedulers
import { OfflineDevicesScheduler } from './infrastructure/schedulers/offline-devices.scheduler';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [ObservabilityController],
  providers: [
    // Repositories
    {
      provide: OBSERVABILITY_REPOSITORY_TOKEN,
      useClass: RedisObservabilityRepository,
    },
    // Use Cases
    GetSystemMetricsUseCase,
    CheckOfflineDevicesUseCase,
    // Infrastructure schedulers
    OfflineDevicesScheduler,
  ],
  exports: [GetSystemMetricsUseCase],
})
export class ObservabilityModule {}
