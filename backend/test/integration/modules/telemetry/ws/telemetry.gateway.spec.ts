import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryGateway } from '@/telemetry/interfaces/ws/telemetry.gateway';
import { TELEMETRY_ADAPTER_TOKEN } from '@/telemetry/infrastructure/adapters/redis-telemetry.adapter';

describe('TelemetryGateway', () => {
  let gateway: TelemetryGateway;
  let adapter: any;
  let mockServer: any;

  beforeEach(async () => {
    adapter = {
      subscribe: jest.fn(),
      buildInitialState: jest.fn(),
    };

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryGateway,
        { provide: TELEMETRY_ADAPTER_TOKEN, useValue: adapter },
      ],
    }).compile();

    gateway = module.get<TelemetryGateway>(TelemetryGateway);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should subscribe to telemetry broadcast on init', () => {
      jest.useFakeTimers();
      gateway.afterInit();
      expect(adapter.subscribe).toHaveBeenCalledWith(
        'telemetry:broadcast',
        expect.any(Function),
      );
      jest.useRealTimers();
    });
  });

  describe('Connection & Disconnection', () => {
    it('should handle connection', () => {
      const client = { id: 'c1' } as any;
      expect(() => gateway.handleConnection(client)).not.toThrow();
    });

    it('should handle disconnection', () => {
      const client = { id: 'c1' } as any;
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('Subscription', () => {
    it('should join room and emit initial state', async () => {
      const client = { id: 'c1', join: jest.fn(), emit: jest.fn() } as any;
      adapter.buildInitialState.mockResolvedValue({
        projectId: 'p1',
        devices: {},
      });

      await gateway.handleSubscribe(client, { projectId: 'p1' });

      expect(client.join).toHaveBeenCalledWith('project:p1');
      expect(adapter.buildInitialState).toHaveBeenCalledWith('p1');
      expect(client.emit).toHaveBeenCalledWith('initial_state', {
        projectId: 'p1',
        devices: {},
      });
    });

    it('should do nothing if no projectId provided on subscribe', async () => {
      const client = { join: jest.fn() } as any;
      await gateway.handleSubscribe(client, { projectId: '' });
      expect(client.join).not.toHaveBeenCalled();
    });
  });

  describe('Unsubscription', () => {
    it('should leave room', () => {
      const client = { id: 'c1', leave: jest.fn() } as any;
      gateway.handleUnsubscribe(client, { projectId: 'p1' });
      expect(client.leave).toHaveBeenCalledWith('project:p1');
    });

    it('should do nothing if no projectId provided on unsubscribe', () => {
      const client = { leave: jest.fn() } as any;
      gateway.handleUnsubscribe(client, { projectId: '' });
      expect(client.leave).not.toHaveBeenCalled();
    });
  });

  describe('Buffering and flushing', () => {
    it('should parse message, buffer it, and flush to room', () => {
      jest.useFakeTimers();
      let subscriberCallback: any;
      adapter.subscribe.mockImplementation((channel, cb) => {
        subscriberCallback = cb;
      });

      gateway.afterInit();

      const message = JSON.stringify({
        deviceId: 'd1',
        projectId: 'p1',
        type: 'DATA',
        timestamp: new Date().toISOString(),
        sensors: [],
      });

      subscriberCallback(message);

      // Advance timers to trigger flush Interval
      jest.advanceTimersByTime(600);

      expect(mockServer.to).toHaveBeenCalledWith('project:p1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'telemetry_batch',
        expect.any(Object),
      );

      jest.useRealTimers();
    });
  });
});
