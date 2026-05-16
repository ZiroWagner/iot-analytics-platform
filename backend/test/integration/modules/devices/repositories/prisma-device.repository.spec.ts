import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDeviceRepository } from '@/devices/infrastructure/repositories/prisma-device.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { Device } from '@/devices/domain/entities/device.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PrismaDeviceRepository Integration', () => {
  let repository: PrismaDeviceRepository;
  let prismaService: any;

  const prismaMock = {
    project: {
      findUnique: jest.fn(),
    },
    device: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaDeviceRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<PrismaDeviceRepository>(PrismaDeviceRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    // Default valid ownership
    prismaMock.project.findUnique.mockResolvedValue({ userId: 'u1' });
  });

  describe('create', () => {
    it('should create and return a domain device', async () => {
      const dbDevice = {
        id: '1',
        name: 'Test',
        api_key: 'iot_key',
        mac_address: null,
        type: 'TEMP',
        projectId: 'p1',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeenAt: null,
        sensors: [],
      };
      prismaMock.device.create.mockResolvedValue(dbDevice);

      const result = await repository.create({
        name: 'Test',
        type: 'TEMP',
        macAddress: null,
        projectId: 'p1',
        userId: 'u1',
      });

      expect(result).toBeInstanceOf(Device);
      expect(result.id).toBe('1');
      expect(prismaMock.device.create).toHaveBeenCalled();
    });

    it('should throw if project ownership fails', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await expect(
        repository.create({
          name: 'Test',
          type: 'TEMP',
          macAddress: null,
          projectId: 'p1',
          userId: 'u1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return mapped device if found', async () => {
      const dbDevice = {
        id: '1',
        name: 'Test',
        api_key: 'key',
        mac_address: null,
        type: 'TEMP',
        projectId: 'p1',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeenAt: null,
        project: { userId: 'u1' },
        sensors: [],
      };
      prismaMock.device.findUnique.mockResolvedValue(dbDevice);

      const result = await repository.findById('1', 'u1');

      expect(result).toBeInstanceOf(Device);
      expect(result?.id).toBe('1');
    });

    it('should throw ForbiddenException if user mismatch', async () => {
      const dbDevice = { project: { userId: 'u2' } };
      prismaMock.device.findUnique.mockResolvedValue(dbDevice);
      await expect(repository.findById('1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByProject', () => {
    it('should return array of domain devices', async () => {
      const dbDevices = [
        {
          id: '1',
          name: 'D1',
          api_key: 'key',
          projectId: 'p1',
          createdAt: new Date(),
          updatedAt: new Date(),
          sensors: [],
        },
      ];
      prismaMock.device.findMany.mockResolvedValue(dbDevices);

      const result = await repository.findByProject('p1', 'u1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Device);
    });
  });

  describe('update', () => {
    it('should update and return the domain device', async () => {
      const dbDevice = {
        id: '1',
        name: 'Updated',
        project: { userId: 'u1' },
      };
      // FindById validation passes
      prismaMock.device.findUnique.mockResolvedValue(dbDevice);
      prismaMock.device.update.mockResolvedValue(dbDevice);

      const result = await repository.update('1', 'u1', { name: 'Updated' });

      expect(result).toBeInstanceOf(Device);
      expect(prismaMock.device.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete the device successfully', async () => {
      const dbDevice = { project: { userId: 'u1' } };
      prismaMock.device.findUnique.mockResolvedValue(dbDevice);
      prismaMock.device.delete.mockResolvedValue({ id: '1' });

      await repository.delete('1', 'u1');
      expect(prismaMock.device.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
