import { Test, TestingModule } from '@nestjs/testing';
import { PrismaSensorRepository } from '@/sensors/infrastructure/repositories/prisma-sensor.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { Sensor } from '@/sensors/domain/entities/sensor.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PrismaSensorRepository Integration', () => {
  let repository: PrismaSensorRepository;
  let prismaService: any;

  const prismaMock = {
    device: {
      findUnique: jest.fn(),
    },
    sensor: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dataPoint: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaSensorRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<PrismaSensorRepository>(PrismaSensorRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    // Default valid ownership
    prismaMock.device.findUnique.mockResolvedValue({
      project: { userId: 'u1' },
    });
  });

  describe('create', () => {
    it('should create and return a domain sensor', async () => {
      const dbSensor = {
        id: '1',
        name: 'Test',
        deviceId: 'd1',
        metadata: { unit: 'C' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.sensor.create.mockResolvedValue(dbSensor);

      const result = await repository.create({
        name: 'Test',
        deviceId: 'd1',
        metadata: { unit: 'C' },
        userId: 'u1',
      });

      expect(result).toBeInstanceOf(Sensor);
      expect(result.id).toBe('1');
    });

    it('should throw if device ownership fails', async () => {
      prismaMock.device.findUnique.mockResolvedValue(null);
      await expect(
        repository.create({
          name: 'Test',
          deviceId: 'd1',
          metadata: {},
          userId: 'u1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return mapped sensor if found', async () => {
      const dbSensor = {
        id: '1',
        name: 'Test',
        deviceId: 'd1',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        device: { project: { userId: 'u1' } },
      };
      prismaMock.sensor.findUnique.mockResolvedValue(dbSensor);

      const result = await repository.findById('1', 'u1');

      expect(result).toBeInstanceOf(Sensor);
      expect(result?.id).toBe('1');
    });

    it('should throw ForbiddenException if user mismatch', async () => {
      const dbSensor = { device: { project: { userId: 'u2' } } };
      prismaMock.sensor.findUnique.mockResolvedValue(dbSensor);
      await expect(repository.findById('1', 'u1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByDevice', () => {
    it('should return array of domain sensors', async () => {
      const dbSensors = [
        {
          id: '1',
          name: 'S1',
          deviceId: 'd1',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaMock.sensor.findMany.mockResolvedValue(dbSensors);

      const result = await repository.findByDevice('d1', 'u1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Sensor);
    });
  });

  describe('update', () => {
    it('should update and return the domain sensor', async () => {
      const dbSensor = {
        id: '1',
        name: 'Updated',
        device: { project: { userId: 'u1' } },
        metadata: {},
      };
      // FindById validation passes
      prismaMock.sensor.findUnique.mockResolvedValue(dbSensor);
      prismaMock.sensor.update.mockResolvedValue(dbSensor);

      const result = await repository.update('1', 'u1', { name: 'Updated' });

      expect(result).toBeInstanceOf(Sensor);
      expect(prismaMock.sensor.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete the sensor successfully', async () => {
      const dbSensor = { device: { project: { userId: 'u1' } } };
      prismaMock.sensor.findUnique.mockResolvedValue(dbSensor);
      prismaMock.sensor.delete.mockResolvedValue({ id: '1' });

      await repository.delete('1', 'u1');
      expect(prismaMock.sensor.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getDataPoints', () => {
    it('should get data points for a sensor', async () => {
      const dbSensor = { device: { project: { userId: 'u1' } } };
      prismaMock.sensor.findUnique.mockResolvedValue(dbSensor);
      prismaMock.dataPoint.findMany.mockResolvedValue([{ value: 10 }]);

      const result = await repository.getDataPoints('1', 'u1', { limit: 10 });
      expect(result).toHaveLength(1);
      expect(prismaMock.dataPoint.findMany).toHaveBeenCalled();
    });
  });
});
