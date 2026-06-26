import { Test, TestingModule } from '@nestjs/testing';
import { GetSystemMetricsUseCase } from '@/observability/application/use-cases/get-system-metrics.use-case';
import { OBSERVABILITY_REPOSITORY_TOKEN } from '@/observability/domain/repositories/observability.repository.interface';

describe('GetSystemMetricsUseCase', () => {
  let useCase: GetSystemMetricsUseCase;
  let repository: any;

  beforeEach(async () => {
    repository = {
      getStreamLength: jest.fn().mockResolvedValue(100),
      getConsumerLag: jest.fn().mockResolvedValue(10),
      getEventsPerSecond: jest.fn().mockResolvedValue(5),
      countOnlineDevices: jest.fn().mockResolvedValue(2),
      countOnlineDevicesForUser: jest.fn().mockResolvedValue(1),
      getPendingMessages: jest.fn().mockResolvedValue(0),
      getRedisMemoryUsage: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSystemMetricsUseCase,
        { provide: OBSERVABILITY_REPOSITORY_TOKEN, useValue: repository },
      ],
    }).compile();

    useCase = module.get<GetSystemMetricsUseCase>(GetSystemMetricsUseCase);
  });

  it('should return system metrics', async () => {
    const result = await useCase.execute();
    expect(result).toBeDefined();
    expect(result?.streamSize).toBe(100);
    expect(repository.countOnlineDevices).toHaveBeenCalled();
  });

  it('should filter by user if userId provided', async () => {
    await useCase.execute('u1');
    expect(repository.countOnlineDevicesForUser).toHaveBeenCalledWith('u1');
  });

  it('should return null on error', async () => {
    repository.getStreamLength = jest.fn(() => Promise.reject(new Error('fail')));
    const result = await useCase.execute();
    expect(result).toBeNull();
  });
});
