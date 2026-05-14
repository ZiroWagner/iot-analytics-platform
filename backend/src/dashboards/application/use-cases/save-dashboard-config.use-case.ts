import { Injectable, Inject } from '@nestjs/common';
import { DASHBOARD_REPOSITORY_TOKEN } from '../../domain/repositories/dashboard.repository.interface';
import type { DashboardRepositoryInterface } from '../../domain/repositories/dashboard.repository.interface';
import type { DashboardConfig } from '../../domain/entities/dashboard-config.entity';

@Injectable()
export class SaveDashboardConfigUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY_TOKEN)
    private readonly dashboardRepository: DashboardRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    projectId: string,
    layoutConfig: Record<string, unknown>,
  ): Promise<DashboardConfig> {
    return this.dashboardRepository.saveConfig(projectId, userId, layoutConfig);
  }
}
