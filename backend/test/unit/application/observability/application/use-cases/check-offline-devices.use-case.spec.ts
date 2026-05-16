import { Test, TestingModule } from '@nestjs/testing';
import { CheckOfflineDevicesUseCase } from '@/observability/application/use-cases/check-offline-devices.use-case';
import { OBSERVABILITY_REPOSITORY_TOKEN } from '@/observability/domain/repositories/observability.repository.interface';

describe('CheckOfflineDevicesUseCase', () => {
  let useCase: CheckOfflineDevicesUseCase;
  let repository: any;

  beforeEach(async () => {
    repository = {
      scanActiveDeviceIds: jest.fn().mockResolvedValue([]),
      getDeviceStates: jest.fn(),
      markDeviceOffline: jest.fn().mockResolvedValue(undefined),
      broadcastOfflineEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckOfflineDevicesUseCase,
        { provide: OBSERVABILITY_REPOSITORY_TOKEN, useValue: repository },
      ],
    }).compile();

    useCase = module.get<CheckOfflineDevicesUseCase>(CheckOfflineDevicesUseCase);
  });

  it('should do nothing if no active devices', async () => {
    repository.scanActiveDeviceIds.mockResolvedValue([]);
    await useCase.execute();
    expect(repository.getDeviceStates).not.toHaveBeenCalled();
  });

  it('should mark stale devices as offline', async () => {
    const now = Date.now();
    repository.scanActiveDeviceIds.mockResolvedValue(['d1', 'd2']);
    repository.getDeviceStates.mockResolvedValue([
      { deviceId: 'd1', status: 'online', lastSeenAt: new Date(now - 30000).toISOString(), projectId: 'p1' }, // Stale
      { deviceId: 'd2', status: 'online', lastSeenAt: new Date(now - 1000).toISOString(), projectId: 'p1' }, // Fresh
    ]);

    await useCase.execute();

    expect(repository.markDeviceOffline).toHaveBeenCalledWith('d1');
    expect(repository.markDeviceOffline).not.toHaveBeenCalledWith('d2');
    expect(repository.broadcastOfflineEvent).toHaveBeenCalledWith('d1', 'p1');
  });

  it('should handle devices with no lastSeenAt or invalid date', async () => {
    repository.scanActiveDeviceIds.mockResolvedValue(['d3']);
    repository.getDeviceStates.mockResolvedValue([
      { deviceId: 'd3', status: 'online', lastSeenAt: null, projectId: 'p1' },
    ]);

    await useCase.execute();
    expect(repository.markDeviceOffline).toHaveBeenCalledWith('d3');
  });

  it('should catch and log errors', async () => {
    repository.scanActiveDeviceIds.mockRejectedValue(new Error('scan failed'));
    const loggerSpy = jest.spyOn((useCase as any).logger, 'error');
    
    await useCase.execute();
    expect(loggerSpy).toHaveBeenCalled();
  });
});
