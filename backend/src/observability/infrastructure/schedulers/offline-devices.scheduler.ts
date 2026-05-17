import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CheckOfflineDevicesUseCase } from '@/observability/application/use-cases/check-offline-devices.use-case';

@Injectable()
export class OfflineDevicesScheduler {
  constructor(
    private readonly checkOfflineDevicesUseCase: CheckOfflineDevicesUseCase,
  ) { }

  @Cron('*/5 * * * * *')
  async handleCron(): Promise<void> {
    await this.checkOfflineDevicesUseCase.execute();
  }
}
