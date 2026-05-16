import { Test, TestingModule } from '@nestjs/testing';
import { GetStatsUseCase } from '@/analytics/application/use-cases/get-stats.use-case';
import { GetTimeseriesUseCase } from '@/analytics/application/use-cases/get-timeseries.use-case';
import { GetAvailableMetricsUseCase } from '@/analytics/application/use-cases/get-available-metrics.use-case';
import { GetMultiTimeseriesUseCase } from '@/analytics/application/use-cases/get-multi-timeseries.use-case';
import { ANALYTICS_REPOSITORY_TOKEN } from '@/analytics/domain/repositories/analytics.repository.interface';

describe('Analytics Use Cases', () => {
  let repository: any;

  beforeEach(() => {
    repository = {
      getStats: jest.fn(),
      getTimeseries: jest.fn(),
      getAvailableMetrics: jest.fn(),
      getMultiTimeseries: jest.fn(),
    };
  });

  describe('GetStatsUseCase', () => {
    it('should return stats from repository', async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetStatsUseCase,
          { provide: ANALYTICS_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      const useCase = module.get<GetStatsUseCase>(GetStatsUseCase);

      repository.getStats.mockResolvedValue({ avg: 10 });
      const result = await useCase.execute('u1', 'p1', 's1', 'temp');
      expect(result.avg).toBe(10);
      expect(repository.getStats).toHaveBeenCalledWith(
        'u1',
        'p1',
        's1',
        'temp',
        undefined,
        undefined,
      );
    });
  });

  describe('GetTimeseriesUseCase', () => {
    it('should return timeseries points', async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetTimeseriesUseCase,
          { provide: ANALYTICS_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      const useCase = module.get<GetTimeseriesUseCase>(GetTimeseriesUseCase);

      repository.getTimeseries.mockResolvedValue([{ timestamp: new Date() }]);
      const result = await useCase.execute('u1', 'p1', 's1', 'temp');
      expect(result).toHaveLength(1);
    });
  });

  describe('GetAvailableMetricsUseCase', () => {
    it('should return available metrics', async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetAvailableMetricsUseCase,
          { provide: ANALYTICS_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      const useCase = module.get<GetAvailableMetricsUseCase>(
        GetAvailableMetricsUseCase,
      );

      repository.getAvailableMetrics.mockResolvedValue([
        { sensorId: 's1', availableMetrics: ['v'] },
      ]);
      const result = await useCase.execute('u1', 'p1');
      expect(result).toHaveLength(1);
    });
  });
});
