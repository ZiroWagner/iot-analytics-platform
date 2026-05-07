import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProjectRepositoryInterface } from '../../domain/repositories/project.repository.interface';
import { Project } from '../../domain/entities/project.entity';

@Injectable()
export class PrismaProjectRepository implements ProjectRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; description: string | null; userId: string }): Promise<Project> {
    const created = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        userId: data.userId,
      },
    });
    return this.mapToDomain(created);
  }

  async findAllByUserId(userId: string): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { devices: true },
        },
        devices: {
          select: { id: true, lastSeenAt: true },
        },
      },
    });
    
    return projects.map(p => this.mapToDomain(p, p._count?.devices, p.devices));
  }

  async findById(id: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        devices: {
          include: { sensors: true }
        }
      }
    });
    return project ? this.mapToDomain(project, undefined, project.devices) : null;
  }

  async update(id: string, data: Partial<Pick<Project, 'name' | 'description'>>): Promise<Project> {
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async getOverviewMetrics(userId: string) {
    const totalProjects = await this.prisma.project.count({ where: { userId } });
    const totalDevices = await this.prisma.device.count({ where: { project: { userId } } });
    const totalSensors = await this.prisma.sensor.count({ where: { device: { project: { userId } } } });
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const eventsLast24h = await this.prisma.dataPoint.count({
      where: {
        timestamp: { gte: yesterday },
        sensor: { device: { project: { userId } } }
      }
    });

    const recentEvents = await this.prisma.dataPoint.findMany({
      where: {
        sensor: { device: { project: { userId } } }
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        sensor: {
          select: { name: true, device: { select: { name: true } } }
        }
      }
    });

    return {
      totalProjects,
      totalDevices,
      totalSensors,
      eventsLast24h,
      recentEvents,
    };
  }

  private mapToDomain(prismaModel: any, deviceCount?: number, devices?: any[]): Project {
    return new Project(
      prismaModel.id,
      prismaModel.name,
      prismaModel.description,
      prismaModel.userId,
      prismaModel.createdAt,
      prismaModel.updatedAt,
      deviceCount,
      devices
    );
  }
}
