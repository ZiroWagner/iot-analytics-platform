import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SensorRepositoryInterface, SENSOR_REPOSITORY_TOKEN } from '../../domain/repositories/sensor.repository.interface';
import { Sensor } from '../../domain/entities/sensor.entity';

@Injectable()
export class PrismaSensorRepository implements SensorRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    deviceId: string;
    metadata: Record<string, unknown>;
    userId: string;
  }): Promise<Sensor> {
    await this.verifyDeviceOwnership(data.userId, data.deviceId);

    const created = await this.prisma.sensor.create({
      data: {
        name: data.name,
        deviceId: data.deviceId,
        metadata: (data.metadata ?? {}) as any,
      },
    });

    return this.mapToDomain(created);
  }

  async findByDevice(deviceId: string, userId: string): Promise<Sensor[]> {
    await this.verifyDeviceOwnership(userId, deviceId);

    const sensors = await this.prisma.sensor.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
    });

    return sensors.map(s => this.mapToDomain(s));
  }

  async findById(id: string, userId: string): Promise<Sensor | null> {
    const sensor = await this.prisma.sensor.findUnique({
      where: { id },
      include: { device: { include: { project: true } } },
    });

    if (!sensor) {
      throw new NotFoundException('Sensor no encontrado');
    }
    if (sensor.device.project.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este sensor');
    }

    return this.mapToDomain(sensor);
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; metadata?: Record<string, unknown> },
  ): Promise<Sensor> {
    await this.findById(id, userId);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    const updated = await this.prisma.sensor.update({
      where: { id },
      data: updateData,
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findById(id, userId);

    await this.prisma.sensor.delete({
      where: { id },
    });
  }

  async getDataPoints(
    sensorId: string,
    userId: string,
    filters?: { from?: Date; to?: Date; limit?: number },
  ): Promise<any[]> {
    await this.findById(sensorId, userId);

    const where: any = { sensorId };
    if (filters?.from || filters?.to) {
      where.timestamp = {};
      if (filters.from) where.timestamp.gte = filters.from;
      if (filters.to) where.timestamp.lte = filters.to;
    }

    const dataPoints = await this.prisma.dataPoint.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters?.limit ?? 50,
    });

    return dataPoints;
  }

  private async verifyDeviceOwnership(userId: string, deviceId: string): Promise<void> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: { project: true },
    });
    if (!device) {
      throw new NotFoundException('Device no encontrado');
    }
    if (device.project.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este device para añadir sensores');
    }
  }

  private mapToDomain(prismaModel: any): Sensor {
    return Sensor.createFromPersistence({
      id: prismaModel.id,
      name: prismaModel.name,
      deviceId: prismaModel.deviceId,
      metadata: prismaModel.metadata as Record<string, unknown>,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      dataPoints: undefined,
    });
  }
}
