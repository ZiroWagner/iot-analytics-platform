import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { AnalyticsController } from './interfaces/http/analytics.controller';

// Use Cases
import { GetAvailableMetricsUseCase } from './application/use-cases/get-available-metrics.use-case';
import { GetTimeseriesUseCase } from './application/use-cases/get-timeseries.use-case';
import { GetMultiTimeseriesUseCase } from './application/use-cases/get-multi-timeseries.use-case';
import { GetStatsUseCase } from './application/use-cases/get-stats.use-case';

// Repositories
import { ANALYTICS_REPOSITORY_TOKEN } from './domain/repositories/analytics.repository.interface';
import { PrismaAnalyticsRepository } from './infrastructure/repositories/prisma-analytics.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [
    // Repositories
    {
      provide: ANALYTICS_REPOSITORY_TOKEN,
      useClass: PrismaAnalyticsRepository,
    },
    // Use Cases
    GetAvailableMetricsUseCase,
    GetTimeseriesUseCase,
    GetMultiTimeseriesUseCase,
    GetStatsUseCase,
  ],
})
export class AnalyticsModule {}