import { Injectable, Inject } from '@nestjs/common';
import { DEVICE_REPOSITORY_TOKEN } from '@/devices/domain/repositories/device.repository.interface';
import type { DeviceRepositoryInterface } from '@/devices/domain/repositories/device.repository.interface';
import type { Device } from '@/devices/domain/entities/device.entity';

@Injectable()
export class UpdateDeviceUseCase {
  constructor(
    @Inject(DEVICE_REPOSITORY_TOKEN)
    private readonly deviceRepository: DeviceRepositoryInterface,
  ) { }

  async execute(
    userId: string,
    deviceId: string,
    data: { name?: string; type?: string; macAddress?: string },
  ): Promise<Device> {
    return this.deviceRepository.update(deviceId, userId, {
      name: data.name,
      type: data.type,
      macAddress: data.macAddress ?? null,
    });
  }
}
