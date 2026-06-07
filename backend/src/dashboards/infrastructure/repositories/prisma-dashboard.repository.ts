import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DashboardRepositoryInterface } from '@/dashboards/domain/repositories/dashboard.repository.interface';
import { DashboardConfig } from '@/dashboards/domain/entities/dashboard-config.entity';

@Injectable()
export class PrismaDashboardRepository implements DashboardRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(
    projectId: string,
    userId: string,
  ): Promise<DashboardConfig | null> {
    await this.verifyProjectOwnership(userId, projectId);

    const config = await this.prisma.dashboardConfig.findFirst({
      where: { projectId },
    });

    if (!config) {
      return null;
    }

    return this.mapToDomain(config);
  }

  async saveConfig(
    projectId: string,
    userId: string,
    layoutConfig: Record<string, unknown>,
  ): Promise<DashboardConfig> {
    await this.verifyProjectOwnership(userId, projectId);

    const existing = await this.prisma.dashboardConfig.findFirst({
      where: { projectId },
    });

    let result: any;

    if (existing) {
      result = await this.prisma.dashboardConfig.update({
        where: { id: existing.id },
        data: { layout_config: layoutConfig as any },
      });
    } else {
      result = await this.prisma.dashboardConfig.create({
        data: {
          projectId,
          layout_config: layoutConfig as any,
        },
      });
    }

    return this.mapToDomain(result);
  }

  private async verifyProjectOwnership(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Sin acceso a este proyecto');
    }
  }

  private mapToDomain(prismaModel: any): DashboardConfig {
    return DashboardConfig.createFromPersistence({
      id: prismaModel.id,
      projectId: prismaModel.projectId,
      layoutConfig: prismaModel.layout_config as Record<string, unknown>,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }
}
