import { Injectable, Inject } from '@nestjs/common';
import { DEVICE_REPOSITORY_TOKEN } from '../../domain/repositories/device.repository.interface';
import type { DeviceRepositoryInterface } from '../../domain/repositories/device.repository.interface';
import type { Device } from '../../domain/entities/device.entity';

@Injectable()
export class CreateDeviceUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY_TOKEN)
    private readonly deviceRepository: DeviceRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    data: {
      name: string;
      type: string;
      macAddress?: string;
      projectId: string;
    },
  ): Promise<Device> {
    return this.deviceRepository.create({
      userId,
      name: data.name,
      type: data.type,
      macAddress: data.macAddress ?? null,
      projectId: data.projectId,
    });
  }
}
