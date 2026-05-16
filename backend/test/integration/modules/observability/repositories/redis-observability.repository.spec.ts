import { Test, TestingModule } from '@nestjs/testing';
import { RedisObservabilityRepository } from '@/observability/infrastructure/repositories/redis-observability.repository';
import { RedisService } from '@/redis/redis.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('RedisObservabilityRepository Integration', () => {
  let repository: RedisObservabilityRepository;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = {
      xinfo: jest.fn(),
      pipeline: jest.fn().mockReturnValue({
        get: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      scan: jest.fn().mockResolvedValue(['0', []]),
      publish: jest.fn(),
      hset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisObservabilityRepository,
        { provide: RedisService, useValue: { client: redisClient } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    repository = module.get<RedisObservabilityRepository>(RedisObservabilityRepository);
  });

  describe('getStreamLength', () => {
    it('should return length from xinfo', async () => {
      redisClient.xinfo.mockResolvedValue(['length', '50']);
      const result = await repository.getStreamLength();
      expect(result).toBe(50);
    });

    it('should return 0 on error', async () => {
      redisClient.xinfo.mockRejectedValue(new Error('fail'));
      const result = await repository.getStreamLength();
      expect(result).toBe(0);
    });
  });

  describe('getEventsPerSecond', () => {
    it('should calculate avg from pipeline results', async () => {
      redisClient.pipeline.mockReturnValue({
        get: jest.fn(),
        exec: jest.fn().mockResolvedValue([ [null, '10'], [null, '20'], [null, '30'] ]),
      });
      const result = await repository.getEventsPerSecond();
      expect(result).toBe(20);
    });
  });
});
