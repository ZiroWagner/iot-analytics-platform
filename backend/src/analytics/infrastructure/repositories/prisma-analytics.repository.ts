import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsRepositoryInterface } from '../../domain/repositories/analytics.repository.interface';
import {
  SensorMetric,
  TimeseriesPoint,
  SeriesRequest,
  MetricStats,
} from '../../domain/entities/analytics.entities';

@Injectable()
export class PrismaAnalyticsRepository implements AnalyticsRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableMetrics(
    userId: string,
    projectId: string,
  ): Promise<SensorMetric[]> {
    await this.verifyProjectOwnership(userId, projectId);

    const sensors = await this.prisma.sensor.findMany({
      where: { device: { projectId } },
      select: {
        id: true,
        name: true,
        device: { select: { id: true, name: true } },
      },
    });

    const metrics: SensorMetric[] = [];

    for (const sensor of sensors) {
      const latestData = await this.prisma.dataPoint.findFirst({
        where: { sensorId: sensor.id },
        orderBy: { timestamp: 'desc' },
      });

      if (latestData?.payload) {
        const payloadObj = latestData.payload as Record<string, unknown>;
        const numericKeys = Object.keys(payloadObj).filter(
          (key) => typeof payloadObj[key] === 'number',
        );

        metrics.push(
          SensorMetric.create({
            sensorId: sensor.id,
            sensorName: sensor.name,
            gatewayId: sensor.device.id,
            gatewayName: sensor.device.name,
            availableMetrics: numericKeys,
          }),
        );
      }
    }

    return metrics;
  }

  async getTimeseries(
    userId: string,
    projectId: string,
    sensorId: string,
    metric: string,
    limit = 50,
  ): Promise<TimeseriesPoint[]> {
    await this.verifyProjectOwnership(userId, projectId);

    const sensor = await this.prisma.sensor.findFirst({
      where: { id: sensorId, device: { projectId } },
    });

    if (!sensor) {
      throw new NotFoundException('Sensor no encontrado en este proyecto');
    }

    const dataPoints = await this.prisma.dataPoint.findMany({
      where: { sensorId },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
    });

    return dataPoints
      .reverse()
      .map((dp) => {
        const payloadObj = dp.payload as Record<string, unknown>;
        return {
          timestamp: dp.timestamp,
          timeLabel: new Date(dp.timestamp).toLocaleTimeString(),
          [metric]: payloadObj[metric] ?? null,
        };
      })
      .map(
        (props) =>
          new TimeseriesPoint({
            timestamp: props.timestamp,
            timeLabel: props.timeLabel,
            [metric]: props[metric],
          }),
      );
  }

  async getMultiTimeseries(
    userId: string,
    projectId: string,
    seriesRequests: SeriesRequest[],
    from?: Date,
    to?: Date,
    limit = 100,
  ): Promise<TimeseriesPoint[]> {
    await this.verifyProjectOwnership(userId, projectId);

    const allPoints = new Map<number, Record<string, unknown>>();

    for (const req of seriesRequests) {
      await this.collectSeriesPoints(projectId, req, allPoints, from, to, limit);
    }

    return this.sortTimeseriesMap(allPoints);
  }

  /**
   * Fetches data points for a single series request and merges them into the
   * shared timestamp map.
   */
  private async collectSeriesPoints(
    projectId: string,
    req: SeriesRequest,
    allPoints: Map<number, Record<string, unknown>>,
    from?: Date,
    to?: Date,
    limit = 100,
  ): Promise<void> {
    const sensor = await this.prisma.sensor.findFirst({
      where: { id: req.sensorId, device: { projectId } },
      select: { id: true, name: true },
    });

    if (!sensor) return;

    const dataPoints = await this.prisma.dataPoint.findMany({
      where: this.buildTimeseriesWhereClause(req.sensorId, from, to),
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
    });

    const seriesKey = `${sensor.name}:${req.metric}`;

    for (const dp of dataPoints) {
      const payloadObj = dp.payload as Record<string, unknown>;
      const value = typeof payloadObj[req.metric] === 'number' ? payloadObj[req.metric] : null;
      this.mergeDataPointIntoMap(allPoints, dp, seriesKey, value);
    }
  }

  /** Builds a Prisma `where` clause with optional time range filters. */
  private buildTimeseriesWhereClause(
    sensorId: string,
    from?: Date,
    to?: Date,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { sensorId };
    const timeFilter = this.buildTimeFilter(from, to);
    if (timeFilter) {
      where.timestamp = timeFilter;
    }
    return where;
  }

  /** Returns a Prisma date range filter or `null` if no bounds are set. */
  private buildTimeFilter(
    from?: Date,
    to?: Date,
  ): Record<string, Date> | null {
    if (!from && !to) return null;
    const filter: Record<string, Date> = {};
    if (from) filter.gte = from;
    if (to) filter.lte = to;
    return filter;
  }

  /** Merges a single data point into the aggregated timestamp map. */
  private mergeDataPointIntoMap(
    map: Map<number, Record<string, unknown>>,
    dp: { timestamp: Date; payload: unknown },
    seriesKey: string,
    value: unknown,
  ): void {
    const ts = (dp.timestamp as Date).getTime();
    const existing = map.get(ts);
    if (existing) {
      existing[seriesKey] = value;
    } else {
      map.set(ts, {
        timestamp: dp.timestamp,
        timeLabel: new Date(dp.timestamp).toLocaleTimeString(),
        [seriesKey]: value,
      });
    }
  }

  /** Converts the aggregated map into a sorted array of TimeseriesPoint. */
  private sortTimeseriesMap(
    map: Map<number, Record<string, unknown>>,
  ): TimeseriesPoint[] {
    return Array.from(map.values())
      .map(
        (props) =>
          new TimeseriesPoint({
            timestamp: props.timestamp as Date,
            timeLabel: props.timeLabel as string,
            ...props,
          }),
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getStats(
    userId: string,
    projectId: string,
    sensorId: string,
    metric: string,
    from?: Date,
    to?: Date,
  ): Promise<MetricStats> {
    await this.verifyProjectOwnership(userId, projectId);

    const dataPoints = await this.prisma.dataPoint.findMany({
      where: this.buildTimeseriesWhereClause(sensorId, from, to),
      orderBy: { timestamp: 'desc' },
      take: 500,
    });

    const values: number[] = [];
    for (const dp of dataPoints) {
      const payloadObj = dp.payload as Record<string, unknown>;
      const val = payloadObj[metric];
      if (typeof val === 'number') values.push(val);
    }

    if (values.length === 0) {
      return MetricStats.create({
        sensorId,
        metric,
        min: 0,
        max: 0,
        avg: 0,
        stddev: 0,
        count: 0,
      });
    }

    const count = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / count;
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / count;
    const stddev = Math.sqrt(variance);

    return MetricStats.create({
      sensorId,
      metric,
      min,
      max,
      avg,
      stddev,
      count,
    });
  }

  private async verifyProjectOwnership(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Sin acceso a este proyecto');
    }
  }
}
