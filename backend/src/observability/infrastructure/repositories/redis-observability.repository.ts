import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ObservabilityDomainService } from '@/observability/domain/services/observability-domain.service';
import type { ObservabilityRepositoryInterface } from '@/observability/domain/repositories/observability.repository.interface';

const EPS_WINDOW_SECONDS = 3;
const STREAM_NAME = 'telemetry:ingest';
const GROUP_NAME = 'ingest-group';
const DEVICE_ONLINE_TTL_MS = 15_000;

@Injectable()
export class RedisObservabilityRepository implements ObservabilityRepositoryInterface {
  private readonly logger = new Logger(RedisObservabilityRepository.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async getStreamLength(): Promise<number> {
    try {
      const xinfo = (await (this.redisService.client as any).xinfo(
        'STREAM',
        STREAM_NAME,
      )) as string[];
      return ObservabilityDomainService.extractStreamLength(xinfo);
    } catch {
      return 0;
    }
  }

  async getConsumerLag(): Promise<number> {
    try {
      const groups = (await (this.redisService.client as any).xinfo(
        'GROUPS',
        STREAM_NAME,
      )) as string[][];
      const ingestGroup = groups.find((g: string[]) => g.includes(GROUP_NAME));
      if (ingestGroup) {
        return ObservabilityDomainService.extractLagFromGroup(ingestGroup);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  async getPendingMessages(): Promise<number> {
    try {
      const pending = (await (this.redisService.client as any).xpending(
        STREAM_NAME,
        GROUP_NAME,
      )) as [string, string, string, string][];
      return Array.isArray(pending) ? Number(pending[1] ?? 0) : 0;
    } catch {
      return 0;
    }
  }

  async getRedisMemoryUsage(): Promise<number> {
    try {
      const info = await this.redisService.client.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }

  async getEventsPerSecond(): Promise<number> {
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const pipeline = this.redisService.client.pipeline();
      for (let i = 1; i <= EPS_WINDOW_SECONDS; i++) {
        pipeline.get(`obs:eps:${nowSec - i}`);
      }
      const results = await pipeline.exec();
      if (!results) return 0;
      const epsValues = results.map((r) => parseInt(r[1] as string) || 0);
      return ObservabilityDomainService.calculateEventsPerSecond(epsValues);
    } catch {
      return 0;
    }
  }

  async countOnlineDevices(): Promise<number> {
    try {
      const states = await this.scanDeviceStates();
      const now = Date.now();
      return states.filter((s) => this.isStateOnline(s, now)).length;
    } catch (error) {
      this.logger.error('countOnlineDevices failed', error);
      return 0;
    }
  }

  async countOnlineDevicesForUser(userId: string): Promise<number> {
    try {
      const devices = await this.prisma.device.findMany({
        where: { project: { userId } },
        select: { id: true },
      });
      if (devices.length === 0) return 0;

      const pipeline = this.redisService.client.pipeline();
      devices.forEach((d) =>
        pipeline.hmget(`device:state:${d.id}`, 'status', 'lastSeenAt'),
      );
      const results = await pipeline.exec();
      if (!results) return 0;

      const now = Date.now();
      let count = 0;
      for (const [, value] of results) {
        const [status, lastSeenAt] = (value as Array<string | null>) || [
          null,
          null,
        ];
        if (this.isStateOnline({ status, lastSeenAt }, now)) count++;
      }
      return count;
    } catch (error) {
      this.logger.error(`countOnlineDevicesForUser(${userId}) failed`, error);
      return 0;
    }
  }

  async scanActiveDeviceIds(): Promise<string[]> {
    const deviceIds: string[] = [];
    let cursor = '0';
    do {
      const result = await this.redisService.client.scan(
        cursor,
        'MATCH',
        'device:state:*',
        'COUNT',
        100,
      );
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        const ids = ObservabilityDomainService.extractDeviceIdsFromKeys(keys);
        deviceIds.push(...ids);
      }
    } while (cursor !== '0');
    return deviceIds;
  }

  async getDeviceStates(deviceIds: string[]): Promise<
    Array<{
      deviceId: string;
      status: string | null;
      lastSeenAt: string | null;
      projectId: string | null;
    }>
  > {
    const pipeline = this.redisService.client.pipeline();
    deviceIds.forEach((id) => {
      pipeline.hmget(`device:state:${id}`, 'status', 'lastSeenAt');
      pipeline.get(`device:${id}:project`);
    });
    const results = await pipeline.exec();
    if (!results) return [];

    const states: Array<{
      deviceId: string;
      status: string | null;
      lastSeenAt: string | null;
      projectId: string | null;
    }> = [];

    for (let i = 0; i < deviceIds.length; i++) {
      const [, stateValues] = results[i * 2];
      const [, projectId] = results[i * 2 + 1];
      const [status, lastSeenAt] = (stateValues as Array<string | null>) || [
        null,
        null,
      ];
      states.push({
        deviceId: deviceIds[i],
        status,
        lastSeenAt,
        projectId: (projectId as string) || null,
      });
    }
    return states;
  }

  async markDeviceOffline(deviceId: string): Promise<void> {
    const stateUpdate =
      ObservabilityDomainService.buildDeviceStateUpdate(deviceId);
    await this.redisService.client.hset(stateUpdate.key, stateUpdate.data);
  }

  async broadcastOfflineEvent(
    deviceId: string,
    projectId: string,
  ): Promise<void> {
    const event = ObservabilityDomainService.buildOfflineEvent(
      deviceId,
      projectId,
    );
    await this.redisService.client.publish(
      'telemetry:broadcast',
      JSON.stringify(event),
    );
  }

  private async scanDeviceStates(): Promise<
    Array<{ status: string | null; lastSeenAt: string | null }>
  > {
    const states: Array<{ status: string | null; lastSeenAt: string | null }> =
      [];
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
      keys.forEach((key) => pipeline.hmget(key, 'status', 'lastSeenAt'));
      const stateResults = await pipeline.exec();
      if (!stateResults) continue;
      for (const [, value] of stateResults) {
        const [status, lastSeenAt] = (value as Array<string | null>) || [
          null,
          null,
        ];
        states.push({ status, lastSeenAt });
      }
    } while (cursor !== '0');
    return states;
  }

  private isStateOnline(
    state: { status: string | null; lastSeenAt: string | null },
    nowMs: number,
  ): boolean {
    if (state.status !== 'online') return false;
    if (!state.lastSeenAt) return false;
    const lastSeenMs = Date.parse(state.lastSeenAt);
    if (!Number.isFinite(lastSeenMs)) return false;
    return nowMs - lastSeenMs <= DEVICE_ONLINE_TTL_MS;
  }
}
