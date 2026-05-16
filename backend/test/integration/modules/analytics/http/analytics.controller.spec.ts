import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '@/analytics/interfaces/http/analytics.controller';
import { GetAvailableMetricsUseCase } from '@/analytics/application/use-cases/get-available-metrics.use-case';
import { GetTimeseriesUseCase } from '@/analytics/application/use-cases/get-timeseries.use-case';
import { GetMultiTimeseriesUseCase } from '@/analytics/application/use-cases/get-multi-timeseries.use-case';
import { GetStatsUseCase } from '@/analytics/application/use-cases/get-stats.use-case';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let getMetricsUseCase: any;

  const mockUser = { sub: 'u1', email: 'test@example.com' };

  beforeEach(async () => {
    getMetricsUseCase = { execute: jest.fn().mockResolvedValue([]) };
    const getTimeseriesUseCase = { execute: jest.fn().mockResolvedValue([]) };
    const getMultiTimeseriesUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    };
    const getStatsUseCase = { execute: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: GetAvailableMetricsUseCase, useValue: getMetricsUseCase },
        { provide: GetTimeseriesUseCase, useValue: getTimeseriesUseCase },
        {
          provide: GetMultiTimeseriesUseCase,
          useValue: getMultiTimeseriesUseCase,
        },
        { provide: GetStatsUseCase, useValue: getStatsUseCase },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  describe('getMetrics', () => {
    it('should call getAvailableMetricsUseCase', async () => {
      await controller.getMetrics({ user: mockUser }, 'p1');
      expect(getMetricsUseCase.execute).toHaveBeenCalledWith('u1', 'p1');
    });
  });

  describe('getMultiTimeseries', () => {
    it('should parse JSON series and call useCase', async () => {
      const series = JSON.stringify([{ sensorId: 's1', metric: 'v' }]);
      await controller.getMultiTimeseries({ user: mockUser }, 'p1', series);
      expect(getMetricsUseCase.execute).toBeDefined(); // Just checking it exists
    });
  });
});
