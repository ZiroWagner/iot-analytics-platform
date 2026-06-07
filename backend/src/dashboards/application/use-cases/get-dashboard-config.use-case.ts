import { Injectable, Inject } from '@nestjs/common';
import { DASHBOARD_REPOSITORY_TOKEN } from '@/dashboards/domain/repositories/dashboard.repository.interface';
import type { DashboardRepositoryInterface } from '@/dashboards/domain/repositories/dashboard.repository.interface';
import type { DashboardConfig } from '@/dashboards/domain/entities/dashboard-config.entity';

@Injectable()
export class GetDashboardConfigUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY_TOKEN)
    private readonly dashboardRepository: DashboardRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    projectId: string,
  ): Promise<DashboardConfig | null> {
    return this.dashboardRepository.getConfig(projectId, userId);
  }
}
