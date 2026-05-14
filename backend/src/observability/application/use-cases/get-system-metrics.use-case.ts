import { Inject, Injectable } from '@nestjs/common';
import { OBSERVABILITY_REPOSITORY_TOKEN } from '../../domain/repositories/observability.repository.interface';
import type { ObservabilityRepositoryInterface } from '../../domain/repositories/observability.repository.interface';
import { ObservabilityDomainService } from '../../domain/services/observability-domain.service';
import { SystemMetrics } from '../../domain/entities/system-metrics.entity';

@Injectable()
export class GetSystemMetricsUseCase {
  constructor(
    @Inject(OBSERVABILITY_REPOSITORY_TOKEN)
    private readonly observabilityRepository: ObservabilityRepositoryInterface,
  ) {}

  async execute(userId?: string): Promise<SystemMetrics | null> {
    try {
      const [streamSize, consumerLag, eventsPerSecond, onlineDevices] =
        await Promise.all([
          this.observabilityRepository.getStreamLength(),
          this.observabilityRepository.getConsumerLag(),
          this.observabilityRepository.getEventsPerSecond(),
          userId
            ? this.observabilityRepository.countOnlineDevicesForUser(userId)
            : this.observabilityRepository.countOnlineDevices(),
        ]);

      return ObservabilityDomainService.buildSystemMetrics({
        streamSize,
        consumerLag,
        eventsPerSecond,
        onlineDevices,
      });
    } catch {
      return null;
    }
  }
}
