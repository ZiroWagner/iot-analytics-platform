import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { IngestDomainService } from '@/ingest/domain/services/ingest-domain.service';
import { ParsedStreamMessage } from '@/ingest/domain/entities/parsed-stream-message.entity';
import { DataPointInsert } from '@/ingest/domain/entities/data-point-insert.entity';

const BLOCK_TIMEOUT_MS = 2000;
const BATCH_SIZE = 100;
const ERROR_RETRY_DELAY_MS = 1000;

@Injectable()
export class StreamIngestProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamIngestProcessor.name);
  private isRunning = false;
  private readonly streamName = 'telemetry:ingest';
  private readonly groupName = 'ingest-group';
  private readonly consumerName = `worker-${process.pid}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    this.isRunning = true;
    await this.ensureConsumerGroup();
    this.processLoop();
  }

  onModuleDestroy() {
    this.isRunning = false;
  }

  private async ensureConsumerGroup(): Promise<void> {
    try {
      await this.redisService.client.xgroup(
        'CREATE',
        this.streamName,
        this.groupName,
        '$',
        'MKSTREAM',
      );
      this.logger.log(
        `Created consumer group ${this.groupName} on stream ${this.streamName}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('BUSYGROUP')) {
        this.logger.error('Failed to create consumer group', error);
      }
    }
  }

  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const result = (await (this.redisService.client as any).xreadgroup(
          'GROUP',
          this.groupName,
          this.consumerName,
          'BLOCK',
          BLOCK_TIMEOUT_MS,
          'COUNT',
          BATCH_SIZE,
          'STREAMS',
          this.streamName,
          '>',
        )) as Array<[string, Array<[string, string[]]>]> | null;

        if (result && result.length > 0) {
          const messages = result[0][1];
          if (messages.length > 0) {
            this.logger.log(
              `Received batch of ${messages.length} payloads from stream`,
            );
            await this.processBatch(messages);
          }
        }
      } catch (err) {
        this.logger.error('Error in stream processing loop', err);
        await this.delay(ERROR_RETRY_DELAY_MS);
      }
    }
  }

  private async processBatch(messages: any): Promise<void> {
    const parsedMessages = IngestDomainService.parseStreamMessages(messages);
    const { dataPoints, messageIds } =
      await this.prepareInsertData(parsedMessages);

    if (dataPoints.length > 0) {
      try {
        await this.prisma.dataPoint.createMany({ data: dataPoints });
        this.logger.log(`Persisted ${dataPoints.length} data points to DB`);
      } catch (error) {
        this.logger.error('Failed to bulk insert data points', error);
        return;
      }
    }

    await this.updateDeviceTimestamps(parsedMessages);

    if (messageIds.length > 0) {
      await this.redisService.client.xack(
        this.streamName,
        this.groupName,
        ...messageIds,
      );
    }
  }

  private async prepareInsertData(
    parsedMessages: ParsedStreamMessage[],
  ): Promise<{
    dataPoints: DataPointInsert[];
    messageIds: string[];
  }> {
    const sensorNames = new Set<string>();
    const deviceIds = new Set<string>();

    for (const msg of parsedMessages) {
      msg.sensors.forEach((s) => sensorNames.add(s.sensorId));
      deviceIds.add(msg.deviceId);
    }

    const dbSensors = await this.prisma.sensor.findMany({
      where: {
        deviceId: { in: Array.from(deviceIds) },
        name: { in: Array.from(sensorNames) },
      },
    });

    const sensorMap = new Map(
      dbSensors.map((s) => [`${s.deviceId}:${s.name}`, s.id]),
    );
    const { dataPoints, messageIds } = IngestDomainService.prepareDataPoints(
      parsedMessages,
      sensorMap,
    );

    return { dataPoints, messageIds };
  }

  private async updateDeviceTimestamps(
    parsedMessages: ParsedStreamMessage[],
  ): Promise<void> {
    const deviceTimestamps =
      IngestDomainService.getLatestTimestamps(parsedMessages);
    const updatePromises = Array.from(deviceTimestamps.entries()).map(
      ([devId, ts]) =>
        this.prisma.device
          .update({
            where: { id: devId },
            data: { lastSeenAt: ts },
          })
          .catch((error) =>
            this.logger.warn(`Failed to update lastSeenAt for ${devId}`, error),
          ),
    );
    await Promise.all(updatePromises);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
