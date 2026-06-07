import { Injectable, Inject } from '@nestjs/common';
import { DEVICE_REPOSITORY_TOKEN } from '@/devices/domain/repositories/device.repository.interface';
import type { DeviceRepositoryInterface } from '@/devices/domain/repositories/device.repository.interface';
import type { Device } from '@/devices/domain/entities/device.entity';

@Injectable()
export class GetDevicesByProjectUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY_TOKEN)
    private readonly deviceRepository: DeviceRepositoryInterface,
  ) {}

  async execute(userId: string, projectId: string): Promise<Device[]> {
    return this.deviceRepository.findByProject(projectId, userId);
  }
}
