import {
  SensorMetric,
  TimeseriesPoint,
  SeriesRequest,
  MetricStats,
} from '../entities/analytics.entities';

export const ANALYTICS_REPOSITORY_TOKEN = 'ANALYTICS_REPOSITORY_TOKEN';

export interface AnalyticsRepositoryInterface {
  getAvailableMetrics(
    userId: string,
    projectId: string,
  ): Promise<SensorMetric[]>;
  getTimeseries(
    userId: string,
    projectId: string,
    sensorId: string,
    metric: string,
    limit?: number,
  ): Promise<TimeseriesPoint[]>;
  getMultiTimeseries(
    userId: string,
    projectId: string,
    seriesRequests: SeriesRequest[],
    from?: Date,
    to?: Date,
    limit?: number,
  ): Promise<TimeseriesPoint[]>;
  getStats(
    userId: string,
    projectId: string,
    sensorId: string,
    metric: string,
    from?: Date,
    to?: Date,
  ): Promise<MetricStats>;
}
