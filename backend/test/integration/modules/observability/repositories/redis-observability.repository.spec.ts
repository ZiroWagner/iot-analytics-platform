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

    repository = module.get<RedisObservabilityRepository>(
      RedisObservabilityRepository,
    );
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
        exec: jest.fn().mockResolvedValue([
          [null, '10'],
          [null, '20'],
          [null, '30'],
        ]),
      });
      const result = await repository.getEventsPerSecond();
      expect(result).toBe(20);
    });

    it('should return 0 on error', async () => {
      redisClient.pipeline.mockReturnValue({
        get: jest.fn(),
        exec: jest.fn().mockRejectedValue(new Error('fail')),
      });
      const result = await repository.getEventsPerSecond();
      expect(result).toBe(0);
    });
  });

  describe('getConsumerLag', () => {
    it('should return lag from GROUPS info', async () => {
      redisClient.xinfo.mockResolvedValue([
        ['name', 'ingest-group', 'lag', '5'],
      ]);
      const result = await repository.getConsumerLag();
      expect(result).toBe(5);
    });

    it('should return 0 if group not found', async () => {
      redisClient.xinfo.mockResolvedValue([['name', 'other-group']]);
      const result = await repository.getConsumerLag();
      expect(result).toBe(0);
    });
  });

  describe('countOnlineDevices', () => {
    it('should scan and filter online devices', async () => {
      redisClient.scan.mockResolvedValueOnce([
        '0',
        ['device:state:d1', 'device:state:d2'],
      ]);
      const now = new Date().toISOString();
      redisClient.pipeline.mockReturnValue({
        hmget: jest.fn(),
        exec: jest.fn().mockResolvedValue([
          [null, ['online', now]],
          [null, ['offline', now]],
        ]),
      });

      const result = await repository.countOnlineDevices();
      expect(result).toBe(1);
    });
  });

  describe('countOnlineDevicesForUser', () => {
    it('should return 0 if user has no devices', async () => {
      const prisma = (repository as any).prisma;
      prisma.device = { findMany: jest.fn().mockResolvedValue([]) };
      const result = await repository.countOnlineDevicesForUser('u1');
      expect(result).toBe(0);
    });

    it('should count online devices for user using pipeline', async () => {
      const prisma = (repository as any).prisma;
      prisma.device = { findMany: jest.fn().mockResolvedValue([{ id: 'd1' }]) };
      const now = new Date().toISOString();
      redisClient.pipeline.mockReturnValue({
        hmget: jest.fn(),
        exec: jest.fn().mockResolvedValue([[null, ['online', now]]]),
      });

      const result = await repository.countOnlineDevicesForUser('u1');
      expect(result).toBe(1);
    });
  });

  describe('scanActiveDeviceIds', () => {
    it('should loop scan until cursor is 0', async () => {
      redisClient.scan
        .mockResolvedValueOnce(['10', ['device:state:d1']])
        .mockResolvedValueOnce(['0', ['device:state:d2']]);

      const result = await repository.scanActiveDeviceIds();
      expect(result).toEqual(['d1', 'd2']);
      expect(redisClient.scan).toHaveBeenCalledTimes(2);
    });
  });

  describe('getDeviceStates', () => {
    it('should fetch states and projects using pipeline', async () => {
      const deviceIds = ['d1'];
      const now = new Date().toISOString();
      redisClient.pipeline.mockReturnValue({
        hmget: jest.fn(),
        get: jest.fn(),
        exec: jest.fn().mockResolvedValue([
          [null, ['online', now]], // hmget
          [null, 'p1'], // get project
        ]),
      });

      const result = await repository.getDeviceStates(deviceIds);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        deviceId: 'd1',
        status: 'online',
        lastSeenAt: now,
        projectId: 'p1',
      });
    });
  });

  describe('markDeviceOffline', () => {
    it('should set status to offline in redis', async () => {
      redisClient.hset = jest.fn().mockResolvedValue(1);
      await repository.markDeviceOffline('d1');
      expect(redisClient.hset).toHaveBeenCalledWith(
        'device:state:d1',
        expect.objectContaining({ status: 'offline' }),
      );
    });
  });

  describe('broadcastOfflineEvent', () => {
    it('should publish to telemetry:broadcast', async () => {
      await repository.broadcastOfflineEvent('d1', 'p1');
      expect(redisClient.publish).toHaveBeenCalledWith(
        'telemetry:broadcast',
        expect.stringContaining('d1'),
      );
    });
  });

  describe('isStateOnline edge cases', () => {
    it('should return false if status not online', () => {
      const result = (repository as any).isStateOnline(
        { status: 'offline', lastSeenAt: new Date().toISOString() },
        Date.now(),
      );
      expect(result).toBe(false);
    });

    it('should return false if lastSeenAt missing or invalid', () => {
      expect(
        (repository as any).isStateOnline(
          { status: 'online', lastSeenAt: null },
          Date.now(),
        ),
      ).toBe(false);
      expect(
        (repository as any).isStateOnline(
          { status: 'online', lastSeenAt: 'invalid' },
          Date.now(),
        ),
      ).toBe(false);
    });

    it('should return false if TTL expired', () => {
      const oldDate = new Date(Date.now() - 60000).toISOString();
      const result = (repository as any).isStateOnline(
        { status: 'online', lastSeenAt: oldDate },
        Date.now(),
      );
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return 0 or empty for various failures', async () => {
      redisClient.xinfo.mockRejectedValue(new Error('lag fail'));
      expect(await repository.getConsumerLag()).toBe(0);

      redisClient.scan.mockRejectedValue(new Error('scan fail'));
      expect(await repository.countOnlineDevices()).toBe(0);
      await expect(repository.scanActiveDeviceIds()).rejects.toThrow();

      redisClient.pipeline.mockReturnValue({
        hmget: jest.fn(),
        get: jest.fn(),
        exec: jest.fn().mockResolvedValue(null),
      });
      expect(await repository.getDeviceStates(['d1'])).toEqual([]);
    });
  });
});
