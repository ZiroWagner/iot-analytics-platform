import { Test, TestingModule } from '@nestjs/testing';
import { RedisIngestRepository } from '@/ingest/infrastructure/repositories/redis-ingest.repository';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { UnauthorizedException } from '@nestjs/common';
import { SensorReading } from '@/ingest/domain/entities/sensor-reading.entity';

describe('RedisIngestRepository Integration', () => {
  let repository: RedisIngestRepository;
  let redisClient: any;
  let prismaService: any;

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(),
      setex: jest.fn(),
      xadd: jest.fn(),
      hset: jest.fn(),
      publish: jest.fn(),
      pipeline: jest.fn().mockReturnValue({
        incr: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    const prismaMock = {
      device: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisIngestRepository,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: { client: redisClient } },
      ],
    }).compile();

    repository = module.get<RedisIngestRepository>(RedisIngestRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('resolveDeviceId', () => {
    it('should return cached id if available', async () => {
      redisClient.get.mockResolvedValue('d1');
      const result = await repository.resolveDeviceId('key1');
      expect(result).toBe('d1');
      expect(prismaService.device.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from db and cache if not in redis', async () => {
      redisClient.get.mockResolvedValue(null);
      prismaService.device.findUnique.mockResolvedValue({ id: 'd2', projectId: 'p2' });

      const result = await repository.resolveDeviceId('key1');
      expect(result).toBe('d2');
      expect(redisClient.setex).toHaveBeenCalledTimes(2);
    });

    it('should throw if apiKey invalid', async () => {
      redisClient.get.mockResolvedValue(null);
      prismaService.device.findUnique.mockResolvedValue(null);
      await expect(repository.resolveDeviceId('bad')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('publishToStream', () => {
    it('should call xadd with correct parameters', async () => {
      const sensors = [SensorReading.fromPlain({ sensorId: 's1', payload: { v: 1 } })];
      await repository.publishToStream({
        deviceId: 'd1',
        projectId: 'p1',
        timestamp: 'ts',
        sensors,
      });
      expect(redisClient.xadd).toHaveBeenCalledWith(
        'telemetry:ingest',
        'MAXLEN',
        '~',
        100000,
        '*',
        'deviceId',
        'd1',
        'projectId',
        'p1',
        'timestamp',
        'ts',
        'sensors',
        expect.any(String),
      );
    });
  });

  describe('updateDeviceState', () => {
    it('should call hset', async () => {
      await repository.updateDeviceState('d1', 'ts');
      expect(redisClient.hset).toHaveBeenCalled();
    });
  });

  describe('broadcastTelemetry', () => {
    it('should call publish', async () => {
      const sensors = [SensorReading.fromPlain({ sensorId: 's1', payload: { v: 1 } })];
      await repository.broadcastTelemetry({
        deviceId: 'd1',
        projectId: 'p1',
        timestamp: 'ts',
        sensors,
      });
      expect(redisClient.publish).toHaveBeenCalled();
    });
  });

  describe('incrementEps', () => {
    it('should use pipeline to increment', async () => {
      await repository.incrementEps();
      expect(redisClient.pipeline).toHaveBeenCalled();
    });
  });
});
