import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';

export const TELEMETRY_ADAPTER_TOKEN = Symbol('TelemetryAdapterInterface');

export interface TelemetryAdapterInterface {
  subscribe(channel: string, callback: (message: string) => void): void;
  buildInitialState(
    projectId: string,
  ): Promise<{ projectId: string; devices: Record<string, any> }>;
}

@Injectable()
export class RedisTelemetryAdapter implements TelemetryAdapterInterface {
  private readonly logger = new Logger(RedisTelemetryAdapter.name);
  private subscriber: any;

  constructor(private readonly redisService: RedisService) {}

  subscribe(channel: string, callback: (message: string) => void): void {
    this.subscriber = this.redisService.client.duplicate();
    this.subscriber.subscribe(channel, (err: any) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${channel}`, err);
      } else {
        this.logger.log(`Subscribed to Redis Pub/Sub channel: ${channel}`);
      }
    });
    this.subscriber.on('message', (_channel: string, message: string) => {
      callback(message);
    });
  }

  async buildInitialState(
    projectId: string,
  ): Promise<{ projectId: string; devices: Record<string, any> }> {
    const devices: Record<string, any> = {};
    let cursor = '0';

    do {
      const result = await this.redisService.client.scan(
        cursor,
        'MATCH',
        'device:state:*',
        'COUNT',
        200,
      );
      cursor = result[0];
      const keys = result[1];

      if (keys.length === 0) continue;

      const pipeline = this.redisService.client.pipeline();
      keys.forEach((key: string) => pipeline.hgetall(key));
      const states = await pipeline.exec();

      const projPipeline = this.redisService.client.pipeline();
      const deviceIds = keys.map((k: string) => k.replace('device:state:', ''));
      deviceIds.forEach((id: string) =>
        projPipeline.get(`device:${id}:project`),
      );
      const projects = await projPipeline.exec();

      if (!states || !projects) continue;

      for (let i = 0; i < deviceIds.length; i++) {
        const [, devProject] = projects[i];
        if (devProject === projectId) {
          const [, state] = states[i];
          devices[deviceIds[i]] = state;
        }
      }
    } while (cursor !== '0');

    return { projectId, devices };
  }
}
