import { Test, TestingModule } from '@nestjs/testing';
import { RedisTelemetryAdapter } from '@/telemetry/infrastructure/adapters/redis-telemetry.adapter';
import { RedisService } from '@/redis/redis.service';

describe('RedisTelemetryAdapter', () => {
  let adapter: RedisTelemetryAdapter;
  let redisService: any;
  let mockSubscriber: any;
  let mockPipeline: any;

  beforeEach(async () => {
    mockPipeline = {
      hgetall: jest.fn(),
      get: jest.fn(),
      exec: jest.fn(),
    };

    mockSubscriber = {
      subscribe: jest.fn().mockImplementation((channel, cb) => cb(null)),
      on: jest.fn(),
    };

    const redisMock = {
      client: {
        duplicate: jest.fn().mockReturnValue(mockSubscriber),
        scan: jest.fn(),
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisTelemetryAdapter,
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    adapter = module.get<RedisTelemetryAdapter>(RedisTelemetryAdapter);
    redisService = module.get<RedisService>(RedisService);
  });

  describe('subscribe', () => {
    it('should duplicate client and subscribe to channel', () => {
      const callback = jest.fn();
      adapter.subscribe('test-channel', callback);

      expect(redisService.client.duplicate).toHaveBeenCalled();
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('test-channel', expect.any(Function));
      expect(mockSubscriber.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should trigger callback on message', () => {
      let messageHandler: any;
      mockSubscriber.on.mockImplementation((event, handler) => {
        if (event === 'message') messageHandler = handler;
      });

      const callback = jest.fn();
      adapter.subscribe('test-channel', callback);

      messageHandler('test-channel', 'hello');
      expect(callback).toHaveBeenCalledWith('hello');
    });
  });

  describe('buildInitialState', () => {
    it('should return project state by scanning redis', async () => {
      // First scan returns 1 key, then cursor '0' to stop
      redisService.client.scan.mockResolvedValueOnce(['0', ['device:state:d1']]);
      
      // Pipeline 1: hgetall
      mockPipeline.exec.mockResolvedValueOnce([ [null, { status: 'online' }] ]);
      
      // Pipeline 2: get device project
      mockPipeline.exec.mockResolvedValueOnce([ [null, 'p1'] ]);

      const result = await adapter.buildInitialState('p1');

      expect(result).toEqual({
        projectId: 'p1',
        devices: {
          d1: { status: 'online' }
        }
      });
      expect(redisService.client.scan).toHaveBeenCalled();
      expect(mockPipeline.hgetall).toHaveBeenCalledWith('device:state:d1');
      expect(mockPipeline.get).toHaveBeenCalledWith('device:d1:project');
    });

    it('should handle empty scan results', async () => {
      redisService.client.scan.mockResolvedValueOnce(['0', []]);
      const result = await adapter.buildInitialState('p1');
      expect(result.devices).toEqual({});
    });
  });
});
