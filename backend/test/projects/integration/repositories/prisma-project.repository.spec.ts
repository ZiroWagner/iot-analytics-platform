import { Test, TestingModule } from '@nestjs/testing';
import { PrismaProjectRepository } from '../../../../src/projects/infrastructure/repositories/prisma-project.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Project } from '../../../../src/projects/domain/entities/project.entity';

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

      const result = await repository.create({ name: 'Test', description: 'Desc', userId: 'u1' });

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
        { id: '1', name: 'P1', userId: 'u1', createdAt: new Date(), updatedAt: new Date(), _count: { devices: 0 }, devices: [] },
      ];
      prismaMock.project.findMany.mockResolvedValue(dbProjects);

      const result = await repository.findAllByUserId('u1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Project);
    });
  });
});
