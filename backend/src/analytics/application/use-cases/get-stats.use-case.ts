import { Injectable, Inject } from '@nestjs/common';
import { ANALYTICS_REPOSITORY_TOKEN } from '../../domain/repositories/analytics.repository.interface';
import type { AnalyticsRepositoryInterface } from '../../domain/repositories/analytics.repository.interface';
import type { MetricStats } from '../../domain/entities/analytics.entities';

@Injectable()
export class GetStatsUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: AnalyticsRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    projectId: string,
    sensorId: string,
    metric: string,
    from?: Date,
    to?: Date,
  ): Promise<MetricStats> {
    return this.analyticsRepository.getStats(
      userId,
      projectId,
      sensorId,
      metric,
      from,
      to,
    );
  }
}
