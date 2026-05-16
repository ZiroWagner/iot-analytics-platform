import { Test, TestingModule } from '@nestjs/testing';
import { StreamIngestProcessor } from '@/ingest/infrastructure/processors/stream-ingest.processor';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';

describe('StreamIngestProcessor', () => {
  let processor: StreamIngestProcessor;
  let redisClient: any;
  let prismaService: any;

  beforeEach(async () => {
    redisClient = {
      xgroup: jest.fn(),
      xreadgroup: jest.fn(),
      xack: jest.fn(),
    };

    prismaService = {
      dataPoint: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      sensor: { findMany: jest.fn().mockResolvedValue([]) },
      device: { update: jest.fn().mockResolvedValue({}) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamIngestProcessor,
        { provide: PrismaService, useValue: prismaService },
        { provide: RedisService, useValue: { client: redisClient } },
      ],
    }).compile();

    processor = module.get<StreamIngestProcessor>(StreamIngestProcessor);
  });

  describe('ensureConsumerGroup', () => {
    it('should call xgroup create', async () => {
      redisClient.xgroup.mockResolvedValue('OK');
      await (processor as any).ensureConsumerGroup();
      expect(redisClient.xgroup).toHaveBeenCalled();
    });

    it('should ignore BUSYGROUP error', async () => {
      redisClient.xgroup.mockRejectedValue(new Error('BUSYGROUP Consumer Group name already exists'));
      await expect((processor as any).ensureConsumerGroup()).resolves.not.toThrow();
    });
  });

  describe('processBatch', () => {
    it('should process messages and insert to DB', async () => {
      const messages: any = [
        ['1-0', ['deviceId', 'd1', 'timestamp', '2026-05-16T10:00:00Z', 'sensors', '[{"sensorId":"s1","payload":{"v":1}}]']]
      ];
      
      prismaService.sensor.findMany.mockResolvedValue([{ id: 'db_s1', name: 's1', deviceId: 'd1' }]);
      prismaService.dataPoint.createMany.mockResolvedValue({ count: 1 });
      prismaService.device.update.mockResolvedValue({});
      redisClient.xack.mockResolvedValue(1);

      await (processor as any).processBatch(messages);

      expect(prismaService.dataPoint.createMany).toHaveBeenCalled();
      expect(prismaService.device.update).toHaveBeenCalled();
      expect(redisClient.xack).toHaveBeenCalled();
    });

    it('should skip DB insert if no data points matched', async () => {
       const messages: any = [
        ['1-0', ['deviceId', 'd1', 'timestamp', '2026-05-16T10:00:00Z', 'sensors', '[]']]
      ];
      prismaService.sensor.findMany.mockResolvedValue([]);
      
      await (processor as any).processBatch(messages);
      expect(prismaService.dataPoint.createMany).not.toHaveBeenCalled();
    });
  });

  describe('updateDeviceTimestamps', () => {
    it('should update multiple devices', async () => {
      const parsed = [
        { deviceId: 'd1', timestamp: new Date() },
        { deviceId: 'd2', timestamp: new Date() },
      ];
      await (processor as any).updateDeviceTimestamps(parsed);
      expect(prismaService.device.update).toHaveBeenCalledTimes(2);
    });
  });
});
