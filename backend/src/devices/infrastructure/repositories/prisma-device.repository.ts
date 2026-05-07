import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeviceRepositoryInterface } from '../../domain/repositories/device.repository.interface';
import { Device } from '../../domain/entities/device.entity';
import * as crypto from 'crypto';

@Injectable()
export class PrismaDeviceRepository implements DeviceRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    type: string;
    macAddress: string | null;
    projectId: string;
    userId: string;
  }): Promise<Device> {
    await this.verifyProjectOwnership(data.userId, data.projectId);

    const uniqueHash = crypto.randomBytes(16).toString('hex');
    const apiKey = `iot_${uniqueHash}`;

    const created = await this.prisma.device.create({
      data: {
        name: data.name,
        type: data.type,
        mac_address: data.macAddress,
        api_key: apiKey,
        projectId: data.projectId,
      },
    });

    return this.mapToDomain(created);
  }

  async findByProject(projectId: string, userId: string): Promise<Device[]> {
    await this.verifyProjectOwnership(userId, projectId);

    const devices = await this.prisma.device.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { sensors: true },
    });

    return devices.map(d => this.mapToDomain(d));
  }

  async findById(id: string, userId: string): Promise<Device | null> {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: { project: true, sensors: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }
    if (device.project.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este device');
    }

    return this.mapToDomain(device);
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; type?: string; macAddress?: string | null },
  ): Promise<Device> {
    await this.findById(id, userId);

    const updated = await this.prisma.device.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        mac_address: data.macAddress,
      },
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findById(id, userId);

    await this.prisma.device.delete({
      where: { id },
    });
  }

  private async verifyProjectOwnership(userId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este proyecto para gestionar devices');
    }
  }

  private mapToDomain(prismaModel: any): Device {
    return Device.createFromPersistence({
      id: prismaModel.id,
      name: prismaModel.name,
      apiKey: prismaModel.api_key,
      macAddress: prismaModel.mac_address,
      type: prismaModel.type,
      projectId: prismaModel.projectId,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      lastSeenAt: prismaModel.lastSeenAt,
      sensors: prismaModel.sensors,
    });
  }
}