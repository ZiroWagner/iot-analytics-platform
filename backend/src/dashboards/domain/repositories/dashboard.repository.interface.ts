import { DashboardConfig } from '@/dashboards/domain/entities/dashboard-config.entity';

export const DASHBOARD_REPOSITORY_TOKEN = 'DASHBOARD_REPOSITORY_TOKEN';

export interface DashboardRepositoryInterface {
  getConfig(projectId: string, userId: string): Promise<DashboardConfig | null>;
  saveConfig(
    projectId: string,
    userId: string,
    layoutConfig: Record<string, unknown>,
  ): Promise<DashboardConfig>;
}
