import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDashboardRepository } from '@/dashboards/infrastructure/repositories/prisma-dashboard.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DashboardConfig } from '@/dashboards/domain/entities/dashboard-config.entity';

describe('PrismaDashboardRepository Integration', () => {
  let repository: PrismaDashboardRepository;
  let prismaService: any;

  const prismaMock = {
    project: { findUnique: jest.fn() },
    dashboardConfig: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaDashboardRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get<PrismaDashboardRepository>(PrismaDashboardRepository);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Default valid ownership
    prismaMock.project.findUnique.mockResolvedValue({ userId: 'u1' });
  });

  describe('getConfig', () => {
    it('should return config if exists', async () => {
      const dbConfig = { id: '1', projectId: 'p1', layout_config: {} };
      prismaMock.dashboardConfig.findFirst.mockResolvedValue(dbConfig);

      const result = await repository.getConfig('p1', 'u1');
      expect(result).toBeInstanceOf(DashboardConfig);
      expect(result?.id).toBe('1');
    });

    it('should return null if not found', async () => {
      prismaMock.dashboardConfig.findFirst.mockResolvedValue(null);
      const result = await repository.getConfig('p1', 'u1');
      expect(result).toBeNull();
    });
  });

  describe('saveConfig', () => {
    it('should update existing config', async () => {
      prismaMock.dashboardConfig.findFirst.mockResolvedValue({ id: '1' });
      prismaMock.dashboardConfig.update.mockResolvedValue({ id: '1', layout_config: { a: 1 } });

      const result = await repository.saveConfig('p1', 'u1', { a: 1 });
      expect(prismaMock.dashboardConfig.update).toHaveBeenCalled();
      expect(result.layoutConfig).toEqual({ a: 1 });
    });

    it('should create new config if not exists', async () => {
      prismaMock.dashboardConfig.findFirst.mockResolvedValue(null);
      prismaMock.dashboardConfig.create.mockResolvedValue({ id: '2', layout_config: { b: 2 } });

      const result = await repository.saveConfig('p1', 'u1', { b: 2 });
      expect(prismaMock.dashboardConfig.create).toHaveBeenCalled();
      expect(result.id).toBe('2');
    });
  });
});
