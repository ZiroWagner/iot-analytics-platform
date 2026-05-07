import { Injectable, Inject } from '@nestjs/common';
import { ANALYTICS_REPOSITORY_TOKEN } from '../../domain/repositories/analytics.repository.interface';
import type { AnalyticsRepositoryInterface } from '../../domain/repositories/analytics.repository.interface';
import type { SensorMetric } from '../../domain/entities/analytics.entities';

@Injectable()
export class GetAvailableMetricsUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: AnalyticsRepositoryInterface,
  ) {}

  async execute(userId: string, projectId: string): Promise<SensorMetric[]> {
    return this.analyticsRepository.getAvailableMetrics(userId, projectId);
  }
}