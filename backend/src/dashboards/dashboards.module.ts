import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { DashboardsController } from './interfaces/http/dashboards.controller';

// Use Cases
import { GetDashboardConfigUseCase } from './application/use-cases/get-dashboard-config.use-case';
import { SaveDashboardConfigUseCase } from './application/use-cases/save-dashboard-config.use-case';

// Repositories
import { DASHBOARD_REPOSITORY_TOKEN } from './domain/repositories/dashboard.repository.interface';
import { PrismaDashboardRepository } from './infrastructure/repositories/prisma-dashboard.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardsController],
  providers: [
    // Repositories
    {
      provide: DASHBOARD_REPOSITORY_TOKEN,
      useClass: PrismaDashboardRepository,
    },
    // Use Cases
    GetDashboardConfigUseCase,
    SaveDashboardConfigUseCase,
  ],
})
export class DashboardsModule {}