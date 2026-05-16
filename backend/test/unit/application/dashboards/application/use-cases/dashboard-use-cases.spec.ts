import { Test, TestingModule } from '@nestjs/testing';
import { GetDashboardConfigUseCase } from '@/dashboards/application/use-cases/get-dashboard-config.use-case';
import { SaveDashboardConfigUseCase } from '@/dashboards/application/use-cases/save-dashboard-config.use-case';
import { DASHBOARD_REPOSITORY_TOKEN } from '@/dashboards/domain/repositories/dashboard.repository.interface';

describe('Dashboards Use Cases', () => {
  let repository: any;

  beforeEach(() => {
    repository = {
      getConfig: jest.fn(),
      saveConfig: jest.fn(),
    };
  });

  describe('GetDashboardConfigUseCase', () => {
    it('should return config from repository', async () => {
      const module = await Test.createTestingModule({
        providers: [
          GetDashboardConfigUseCase,
          { provide: DASHBOARD_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      const useCase = module.get<GetDashboardConfigUseCase>(
        GetDashboardConfigUseCase,
      );

      repository.getConfig.mockResolvedValue({ id: 'c1' });
      const result = await useCase.execute('u1', 'p1');
      expect(result?.id).toBe('c1');
    });
  });

  describe('SaveDashboardConfigUseCase', () => {
    it('should save config via repository', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SaveDashboardConfigUseCase,
          { provide: DASHBOARD_REPOSITORY_TOKEN, useValue: repository },
        ],
      }).compile();
      const useCase = module.get<SaveDashboardConfigUseCase>(
        SaveDashboardConfigUseCase,
      );

      repository.saveConfig.mockResolvedValue({ id: 'c1' });
      const result = await useCase.execute('u1', 'p1', { widgets: [] });
      expect(result.id).toBe('c1');
      expect(repository.saveConfig).toHaveBeenCalledWith('p1', 'u1', {
        widgets: [],
      });
    });
  });
});
