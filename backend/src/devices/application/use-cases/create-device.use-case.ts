import { Injectable, Inject } from '@nestjs/common';
import { DEVICE_REPOSITORY_TOKEN } from '@/devices/domain/repositories/device.repository.interface';
import type { DeviceRepositoryInterface } from '@/devices/domain/repositories/device.repository.interface';
import type { Device } from '@/devices/domain/entities/device.entity';

@Injectable()
export class CreateDeviceUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY_TOKEN)
    private readonly deviceRepository: DeviceRepositoryInterface,
  ) { }

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
