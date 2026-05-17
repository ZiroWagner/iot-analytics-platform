import { Injectable, Inject } from '@nestjs/common';
import { DEVICE_REPOSITORY_TOKEN } from '@/devices/domain/repositories/device.repository.interface';
import type { DeviceRepositoryInterface } from '@/devices/domain/repositories/device.repository.interface';
import type { Device } from '@/devices/domain/entities/device.entity';

@Injectable()
export class GetDeviceUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY_TOKEN)
    private readonly deviceRepository: DeviceRepositoryInterface,
  ) { }

  async execute(userId: string, deviceId: string): Promise<Device | null> {
    return this.deviceRepository.findById(deviceId, userId);
  }
}
