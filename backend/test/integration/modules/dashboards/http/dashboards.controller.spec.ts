import { Test, TestingModule } from '@nestjs/testing';
import { DashboardsController } from '@/dashboards/interfaces/http/dashboards.controller';
import { GetDashboardConfigUseCase } from '@/dashboards/application/use-cases/get-dashboard-config.use-case';
import { SaveDashboardConfigUseCase } from '@/dashboards/application/use-cases/save-dashboard-config.use-case';

describe('DashboardsController', () => {
  let controller: DashboardsController;
  let getUseCase: any;
  let saveUseCase: any;

  const mockUser = { sub: 'u1', email: 'test@example.com' };

  beforeEach(async () => {
    getUseCase = { execute: jest.fn() };
    saveUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardsController],
      providers: [
        { provide: GetDashboardConfigUseCase, useValue: getUseCase },
        { provide: SaveDashboardConfigUseCase, useValue: saveUseCase },
      ],
    }).compile();

    controller = module.get<DashboardsController>(DashboardsController);
  });

  describe('getConfig', () => {
    it('should return config if found', async () => {
      getUseCase.execute.mockResolvedValue({
        id: 'c1',
        projectId: 'p1',
        layoutConfig: [],
      });
      const result = await controller.getConfig({ user: mockUser }, 'p1');
      expect(result.id).toBe('c1');
    });

    it('should return empty layout if not found', async () => {
      getUseCase.execute.mockResolvedValue(null);
      const result = await controller.getConfig({ user: mockUser }, 'p1');
      expect(result.layout_config).toEqual([]);
    });
  });

  describe('saveConfig', () => {
    it('should save and return config', async () => {
      saveUseCase.execute.mockResolvedValue({
        id: 'c1',
        projectId: 'p1',
        layoutConfig: { a: 1 },
      });
      const result = await controller.saveConfig({ user: mockUser }, 'p1', {
        layoutConfig: { a: 1 },
      });
      expect(result.layout_config).toEqual({ a: 1 });
    });
  });
});
