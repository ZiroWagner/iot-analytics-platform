import { Injectable, Inject } from '@nestjs/common';
import { DEVICE_REPOSITORY_TOKEN } from '@/devices/domain/repositories/device.repository.interface';
import type { DeviceRepositoryInterface } from '@/devices/domain/repositories/device.repository.interface';

@Injectable()
export class DeleteDeviceUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY_TOKEN)
    private readonly deviceRepository: DeviceRepositoryInterface,
  ) { }

  async execute(userId: string, deviceId: string): Promise<void> {
    await this.deviceRepository.delete(deviceId, userId);
  }
}
