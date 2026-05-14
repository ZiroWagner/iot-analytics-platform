import { Project } from '../entities/project.entity';

export const PROJECT_REPOSITORY_TOKEN = Symbol('ProjectRepositoryInterface');

export interface ProjectRepositoryInterface {
  create(data: {
    name: string;
    description: string | null;
    userId: string;
  }): Promise<Project>;
  findAllByUserId(userId: string): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  update(
    id: string,
    data: Partial<Pick<Project, 'name' | 'description'>>,
  ): Promise<Project>;
  delete(id: string): Promise<void>;

  // Specific methods for dashboard overview
  getOverviewMetrics(userId: string): Promise<{
    totalProjects: number;
    totalDevices: number;
    totalSensors: number;
    eventsLast24h: number;
    recentEvents: any[];
  }>;
}
