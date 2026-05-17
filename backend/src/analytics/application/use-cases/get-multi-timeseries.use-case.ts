import { Injectable, Inject } from '@nestjs/common';
import { ANALYTICS_REPOSITORY_TOKEN } from '@/analytics/domain/repositories/analytics.repository.interface';
import type { AnalyticsRepositoryInterface } from '@/analytics/domain/repositories/analytics.repository.interface';
import type {
  TimeseriesPoint,
  SeriesRequest,
} from '@/analytics/domain/entities/analytics.entities';

@Injectable()
export class GetMultiTimeseriesUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: AnalyticsRepositoryInterface,
  ) { }

  async execute(
    userId: string,
    projectId: string,
    seriesRequests: SeriesRequest[],
    from?: Date,
    to?: Date,
    limit = 100,
  ): Promise<TimeseriesPoint[]> {
    return this.analyticsRepository.getMultiTimeseries(
      userId,
      projectId,
      seriesRequests,
      from,
      to,
      limit,
    );
  }
}
