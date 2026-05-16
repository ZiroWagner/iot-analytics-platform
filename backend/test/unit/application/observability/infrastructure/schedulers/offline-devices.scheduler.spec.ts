import { Test, TestingModule } from '@nestjs/testing';
import { OfflineDevicesScheduler } from '@/observability/infrastructure/schedulers/offline-devices.scheduler';
import { CheckOfflineDevicesUseCase } from '@/observability/application/use-cases/check-offline-devices.use-case';

describe('OfflineDevicesScheduler', () => {
  let scheduler: OfflineDevicesScheduler;
  let useCase: any;

  beforeEach(async () => {
    useCase = { execute: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfflineDevicesScheduler,
        { provide: CheckOfflineDevicesUseCase, useValue: useCase },
      ],
    }).compile();

    scheduler = module.get<OfflineDevicesScheduler>(OfflineDevicesScheduler);
  });

  it('should call useCase execute during cron job', async () => {
    await scheduler.handleCron();
    expect(useCase.execute).toHaveBeenCalled();
  });
});
