import { Injectable, Inject } from '@nestjs/common';
import { ANALYTICS_REPOSITORY_TOKEN } from '@/analytics/domain/repositories/analytics.repository.interface';
import type { AnalyticsRepositoryInterface } from '@/analytics/domain/repositories/analytics.repository.interface';
import type { TimeseriesPoint } from '@/analytics/domain/entities/analytics.entities';

@Injectable()
export class GetTimeseriesUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: AnalyticsRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    projectId: string,
    sensorId: string,
    metric: string,
    limit = 50,
  ): Promise<TimeseriesPoint[]> {
    return this.analyticsRepository.getTimeseries(
      userId,
      projectId,
      sensorId,
      metric,
      limit,
    );
  }
}
