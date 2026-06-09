import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { SensorReading } from '@/ingest/domain/entities/sensor-reading.entity';
import { IngestDomainService } from '@/ingest/domain/services/ingest-domain.service';
import type { IngestRepositoryInterface } from '@/ingest/domain/repositories/ingest.repository.interface';
import { createHash } from 'crypto';

const DEVICE_STATUS_TTL = 15;
const STREAM_MAX_LENGTH = 100000;
const API_KEY_CACHE_TTL = 3600;
const EPS_COUNTER_TTL = 10;

@Injectable()
export class RedisIngestRepository implements IngestRepositoryInterface {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async resolveDeviceId(apiKey: string): Promise<string> {
    const keyHash = createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
    const cacheKey = `device:apikey:${apiKey}`;
    const invalidKey = `device:invalidkey:${keyHash}`;

    const cachedId = await this.redisService.client.get(cacheKey);
    if (cachedId) return cachedId;

    const isInvalid = await this.redisService.client.get(invalidKey);
    if (isInvalid) {
      throw new UnauthorizedException('Invalid API Key');
    }

    const deviceRecord = await this.prisma.device.findUnique({
      where: { api_key: apiKey },
      select: { id: true, projectId: true },
    });
    if (!deviceRecord) {
      await this.redisService.client.setex(invalidKey, API_KEY_CACHE_TTL, '1');
      throw new UnauthorizedException('Invalid API Key');
    }

    await this.redisService.client.setex(
      cacheKey,
      API_KEY_CACHE_TTL,
      deviceRecord.id,
    );
    await this.redisService.client.setex(
      `device:${deviceRecord.id}:project`,
      API_KEY_CACHE_TTL,
      deviceRecord.projectId,
    );
    return deviceRecord.id;
  }

  async resolveProjectId(deviceId: string): Promise<string> {
    return (
      (await this.redisService.client.get(`device:${deviceId}:project`)) ||
      'unknown'
    );
  }

  async publishToStream(data: {
    deviceId: string;
    projectId: string;
    timestamp: string;
    sensors: SensorReading[];
  }): Promise<void> {
    const sensorsJson = IngestDomainService.serializeSensorsForStream(
      data.sensors,
    );
    await this.redisService.client.xadd(
      'telemetry:ingest',
      'MAXLEN',
      '~',
      STREAM_MAX_LENGTH,
      '*',
      'deviceId',
      data.deviceId,
      'projectId',
      data.projectId,
      'timestamp',
      data.timestamp,
      'sensors',
      sensorsJson,
    );
  }

  async updateDeviceState(deviceId: string, timestamp: string): Promise<void> {
    await this.redisService.client.hset(`device:state:${deviceId}`, {
      lastSeenAt: timestamp,
      status: 'online',
    });
  }

  async broadcastTelemetry(data: {
    deviceId: string;
    projectId: string;
    timestamp: string;
    sensors: SensorReading[];
  }): Promise<void> {
    await this.redisService.client.publish(
      'telemetry:broadcast',
      JSON.stringify({
        type: 'device_data',
        deviceId: data.deviceId,
        projectId: data.projectId,
        timestamp: data.timestamp,
        sensors: data.sensors.map((s) => s.toPlain()),
      }),
    );
  }

  async incrementEps(): Promise<void> {
    const epsKey = `obs:eps:${Math.floor(Date.now() / 1000)}`;
    const pipeline = this.redisService.client.pipeline();
    pipeline.incr(epsKey);
    pipeline.expire(epsKey, EPS_COUNTER_TTL);
    await pipeline.exec();
  }
}
