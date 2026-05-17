import { Test, TestingModule } from '@nestjs/testing';
import { PrismaAnalyticsRepository } from '@/analytics/infrastructure/repositories/prisma-analytics.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  SensorMetric,
  MetricStats,
} from '@/analytics/domain/entities/analytics.entities';

describe('PrismaAnalyticsRepository Integration', () => {
  let repository: PrismaAnalyticsRepository;
  let prismaService: any;

  const prismaMock = {
    project: { findUnique: jest.fn() },
    sensor: { findMany: jest.fn(), findFirst: jest.fn() },
    dataPoint: { findFirst: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaAnalyticsRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get<PrismaAnalyticsRepository>(
      PrismaAnalyticsRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    // Default valid ownership
    prismaMock.project.findUnique.mockResolvedValue({ userId: 'u1' });
  });

  describe('getAvailableMetrics', () => {
    it('should return metrics with numeric keys from payload', async () => {
      prismaMock.sensor.findMany.mockResolvedValue([
        { id: 's1', name: 'S1', device: { id: 'd1', name: 'D1' } },
      ]);
      prismaMock.dataPoint.findFirst.mockResolvedValue({
        payload: { temp: 25, status: 'ok' },
      });

      const result = await repository.getAvailableMetrics('u1', 'p1');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SensorMetric);
      expect(result[0].availableMetrics).toEqual(['temp']);
    });
  });

  describe('getTimeseries', () => {
    it('should return timeseries points', async () => {
      prismaMock.sensor.findFirst.mockResolvedValue({ id: 's1' });
      prismaMock.dataPoint.findMany.mockResolvedValue([
        { timestamp: new Date(), payload: { temp: 20 } },
      ]);

      const result = await repository.getTimeseries('u1', 'p1', 's1', 'temp');
      expect(result).toHaveLength(1);
      expect(result[0].temp).toBe(20);
    });

    it('should throw if sensor not found in project', async () => {
      prismaMock.sensor.findFirst.mockResolvedValue(null);
      await expect(
        repository.getTimeseries('u1', 'p1', 's1', 'temp'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should calculate min, max, avg correctly', async () => {
      prismaMock.dataPoint.findMany.mockResolvedValue([
        { payload: { v: 10 } },
        { payload: { v: 20 } },
        { payload: { v: 30 } },
      ]);

      const result = await repository.getStats('u1', 'p1', 's1', 'v');
      expect(result.avg).toBe(20);
      expect(result.min).toBe(10);
      expect(result.max).toBe(30);
      expect(result.count).toBe(3);
    });

    it('should return zeroed stats if no values found', async () => {
      prismaMock.dataPoint.findMany.mockResolvedValue([]);
      const result = await repository.getStats('u1', 'p1', 's1', 'v');
      expect(result.count).toBe(0);
      expect(result.avg).toBe(0);
    });
  });

  describe('getMultiTimeseries', () => {
    it('should aggregate data from multiple sensors', async () => {
      const now = new Date();
      prismaMock.sensor.findFirst
        .mockResolvedValueOnce({ id: 's1', name: 'TempSensor' })
        .mockResolvedValueOnce({ id: 's2', name: 'HumSensor' });

      prismaMock.dataPoint.findMany
        .mockResolvedValueOnce([{ timestamp: now, payload: { temp: 25 } }])
        .mockResolvedValueOnce([{ timestamp: now, payload: { hum: 60 } }]);

      const result = await repository.getMultiTimeseries('u1', 'p1', [
        { sensorId: 's1', metric: 'temp' },
        { sensorId: 's2', metric: 'hum' },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        'TempSensor:temp': 25,
        'HumSensor:hum': 60,
      });
    });

    it('should handle non-existing sensor in multi-series', async () => {
      prismaMock.sensor.findFirst.mockResolvedValue(null);
      const result = await repository.getMultiTimeseries('u1', 'p1', [
        { sensorId: 's1', metric: 'v' },
      ]);
      expect(result).toHaveLength(0);
    });

    it('should handle non-numeric values in payload', async () => {
      prismaMock.sensor.findFirst.mockResolvedValue({ id: 's1', name: 'S1' });
      prismaMock.dataPoint.findMany.mockResolvedValue([
        { timestamp: new Date(), payload: { v: 'invalid' } },
      ]);
      const result = await repository.getMultiTimeseries('u1', 'p1', [
        { sensorId: 's1', metric: 'v' },
      ]);
      expect(result[0]['S1:v']).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle missing metric in payload for single timeseries', async () => {
      prismaMock.sensor.findFirst.mockResolvedValue({ id: 's1' });
      prismaMock.dataPoint.findMany.mockResolvedValue([
        { timestamp: new Date(), payload: {} },
      ]);
      const result = await repository.getTimeseries('u1', 'p1', 's1', 'temp');
      expect(result[0].temp).toBeNull();
    });

    it('should throw NotFoundException if project does not exist', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await expect(repository.getAvailableMetrics('u1', 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
