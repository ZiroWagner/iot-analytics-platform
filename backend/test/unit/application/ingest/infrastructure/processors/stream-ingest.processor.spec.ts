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
      redisClient.xgroup.mockRejectedValue(
        new Error('BUSYGROUP Consumer Group name already exists'),
      );
      await expect(
        (processor as any).ensureConsumerGroup(),
      ).resolves.not.toThrow();
    });
  });

  describe('processBatch', () => {
    it('should process messages and insert to DB', async () => {
      const messages: any = [
        [
          '1-0',
          [
            'deviceId',
            'd1',
            'timestamp',
            '2026-05-16T10:00:00Z',
            'sensors',
            '[{"sensorId":"s1","payload":{"v":1}}]',
          ],
        ],
      ];

      prismaService.sensor.findMany.mockResolvedValue([
        { id: 'db_s1', name: 's1', deviceId: 'd1' },
      ]);
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
        [
          '1-0',
          [
            'deviceId',
            'd1',
            'timestamp',
            '2026-05-16T10:00:00Z',
            'sensors',
            '[]',
          ],
        ],
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

  describe('lifecycle', () => {
    it('should start and stop correctly', async () => {
      jest
        .spyOn(processor as any, 'ensureConsumerGroup')
        .mockResolvedValue(undefined);
      jest
        .spyOn(processor as any, 'processLoop')
        .mockImplementation(async () => {});

      await processor.onModuleInit();
      expect((processor as any).isRunning).toBe(true);

      processor.onModuleDestroy();
      expect((processor as any).isRunning).toBe(false);
    });
  });

  describe('processBatch errors', () => {
    it('should log error if database insert fails', async () => {
      const messages: any = [
        [
          '1-0',
          [
            'deviceId',
            'd1',
            'timestamp',
            '2026-05-16T10:00:00Z',
            'sensors',
            '[{"sensorId":"s1","payload":{"v":1}}]',
          ],
        ],
      ];
      prismaService.sensor.findMany.mockResolvedValue([
        { id: 's1', name: 's1', deviceId: 'd1' },
      ]);
      prismaService.dataPoint.createMany.mockRejectedValue(
        new Error('DB Fail'),
      );
      const loggerSpy = jest.spyOn((processor as any).logger, 'error');

      await (processor as any).processBatch(messages);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to bulk insert'),
        expect.anything(),
      );
    });
  });

  describe('updateDeviceTimestamps', () => {
    it('should handle individual update errors', async () => {
      const parsed = [{ deviceId: 'd1', timestamp: new Date() }];
      prismaService.device.update.mockRejectedValue(new Error('Update failed'));
      const loggerSpy = jest.spyOn((processor as any).logger, 'warn');

      await (processor as any).updateDeviceTimestamps(parsed);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update lastSeenAt'),
        expect.anything(),
      );
    });
  });

  describe('processLoop', () => {
    it('should handle loop errors and delay', async () => {
      (processor as any).isRunning = true;
      redisClient.xreadgroup.mockRejectedValueOnce(new Error('Redis Down'));
      const loggerSpy = jest.spyOn((processor as any).logger, 'error');
      const delaySpy = jest
        .spyOn(processor as any, 'delay')
        .mockResolvedValue(undefined);

      // We manually trigger one iteration
      const loopPromise = (processor as any).processLoop();
      (processor as any).isRunning = false; // Stop loop after first iteration
      await loopPromise;

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in stream processing loop'),
        expect.anything(),
      );
      expect(delaySpy).toHaveBeenCalled();
    });
  });
});
