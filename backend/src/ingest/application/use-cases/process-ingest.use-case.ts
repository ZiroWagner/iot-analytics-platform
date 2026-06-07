import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { INGEST_REPOSITORY_TOKEN } from '@/ingest/domain/repositories/ingest.repository.interface';
import type { IngestRepositoryInterface } from '@/ingest/domain/repositories/ingest.repository.interface';
import { IngestDomainService } from '@/ingest/domain/services/ingest-domain.service';

@Injectable()
export class ProcessIngestUseCase {
  constructor(
    @Inject(INGEST_REPOSITORY_TOKEN)
    private readonly ingestRepository: IngestRepositoryInterface,
  ) {}

  async execute(payload: {
    device: { api_key: string; mac_address?: string; type?: string };
    timestamp?: string;
    sensors: Array<{ sensor_id: string; payload: Record<string, unknown> }>;
  }) {
    const validation = IngestDomainService.validatePayload({
      device: { apiKey: payload.device.api_key },
      timestamp: payload.timestamp,
      sensors: payload.sensors,
    });

    if (!validation.isValid) {
      throw new UnauthorizedException(validation.error);
    }

    const deviceId = await this.ingestRepository.resolveDeviceId(
      payload.device.api_key,
    );
    const projectId = await this.ingestRepository.resolveProjectId(deviceId);

    if (!validation.sensors.length) {
      return { status: 'accepted', message: 'No sensors data to ingest' };
    }

    const ingestTime = validation.timestamp;

    await this.ingestRepository.publishToStream({
      deviceId,
      projectId,
      timestamp: ingestTime,
      sensors: validation.sensors,
    });

    await this.ingestRepository.updateDeviceState(deviceId, ingestTime);
    await this.ingestRepository.broadcastTelemetry({
      deviceId,
      projectId,
      timestamp: ingestTime,
      sensors: validation.sensors,
    });
    await this.ingestRepository.incrementEps();

    return { status: 'accepted', message: 'Payload safely stored in stream' };
  }
}
