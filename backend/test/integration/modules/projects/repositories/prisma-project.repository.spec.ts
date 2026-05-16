import { Test, TestingModule } from '@nestjs/testing';
import { PrismaProjectRepository } from '@/projects/infrastructure/repositories/prisma-project.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { Project } from '@/projects/domain/entities/project.entity';

describe('PrismaProjectRepository Integration', () => {
  let repository: PrismaProjectRepository;
  let prismaService: any;

  const prismaMock = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    device: {
      count: jest.fn(),
    },
    sensor: {
      count: jest.fn(),
    },
    dataPoint: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaProjectRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<PrismaProjectRepository>(PrismaProjectRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create and return a domain project', async () => {
      const dbProject = {
        id: '1',
        name: 'Test',
        description: 'Desc',
        userId: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.project.create.mockResolvedValue(dbProject);

      const result = await repository.create({
        name: 'Test',
        description: 'Desc',
        userId: 'u1',
      });

      expect(result).toBeInstanceOf(Project);
      expect(result.id).toBe('1');
      expect(prismaMock.project.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return mapped project if found', async () => {
      const dbProject = {
        id: '1',
        name: 'Test',
        description: 'Desc',
        userId: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
        devices: [],
      };
      prismaMock.project.findUnique.mockResolvedValue(dbProject);

      const result = await repository.findById('1');

      expect(result).toBeInstanceOf(Project);
      expect(result?.id).toBe('1');
    });

    it('should return null if not found', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      const result = await repository.findById('1');
      expect(result).toBeNull();
    });
  });

  describe('findAllByUserId', () => {
    it('should return array of domain projects', async () => {
      const dbProjects = [
        {
          id: '1',
          name: 'P1',
          userId: 'u1',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { devices: 0 },
          devices: [],
        },
      ];
      prismaMock.project.findMany.mockResolvedValue(dbProjects);

      const result = await repository.findAllByUserId('u1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Project);
    });
  });

  describe('update', () => {
    it('should update and return the domain project', async () => {
      const dbProject = {
        id: '1',
        name: 'Updated',
        description: 'Updated Desc',
        userId: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
        devices: [],
      };
      prismaMock.project.update.mockResolvedValue(dbProject);

      const result = await repository.update('1', {
        name: 'Updated',
        description: 'Updated Desc',
      });

      expect(result).toBeInstanceOf(Project);
      expect(result?.name).toBe('Updated');
      expect(prismaMock.project.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated', description: 'Updated Desc' },
      });
    });

    it('should throw if update fails (e.g., not found)', async () => {
      prismaMock.project.update.mockRejectedValue(
        new Error('Record to update not found'),
      );
      await expect(
        repository.update('999', { name: 'Updated' }),
      ).rejects.toThrow('Record to update not found');
    });
  });

  describe('delete', () => {
    it('should delete the project successfully', async () => {
      prismaMock.project.delete.mockResolvedValue({ id: '1' });
      const result = await repository.delete('1');
      expect(result).toBeUndefined();
      expect(prismaMock.project.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw if deletion fails', async () => {
      prismaMock.project.delete.mockRejectedValue(
        new Error('Record to delete does not exist'),
      );
      await expect(repository.delete('999')).rejects.toThrow(
        'Record to delete does not exist',
      );
    });
  });

  describe('getOverviewMetrics', () => {
    it('should calculate overview metrics for a user', async () => {
      prismaMock.project.count.mockResolvedValue(2);
      prismaMock.device.count.mockResolvedValue(5);
      prismaMock.sensor.count.mockResolvedValue(10);
      prismaMock.dataPoint.count.mockResolvedValue(150);
      prismaMock.dataPoint.findMany.mockResolvedValue([]);

      const result = await repository.getOverviewMetrics('u1');

      expect(result).toEqual({
        totalProjects: 2,
        totalDevices: 5,
        totalSensors: 10,
        eventsLast24h: 150,
        recentEvents: [],
      });

      expect(prismaMock.project.count).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(prismaMock.device.count).toHaveBeenCalledWith({
        where: { project: { userId: 'u1' } },
      });
      expect(prismaMock.sensor.count).toHaveBeenCalledWith({
        where: { device: { project: { userId: 'u1' } } },
      });
      expect(prismaMock.dataPoint.findMany).toHaveBeenCalled();
    });
  });
});
