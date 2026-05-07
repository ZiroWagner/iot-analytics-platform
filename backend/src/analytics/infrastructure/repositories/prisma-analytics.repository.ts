import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsRepositoryInterface } from '../../domain/repositories/analytics.repository.interface';
import { SensorMetric, TimeseriesPoint, SeriesRequest, MetricStats } from '../../domain/entities/analytics.entities';

@Injectable()
export class PrismaAnalyticsRepository implements AnalyticsRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableMetrics(userId: string, projectId: string): Promise<SensorMetric[]> {
    await this.verifyProjectOwnership(userId, projectId);

    const sensors = await this.prisma.sensor.findMany({
      where: { device: { projectId } },
      select: { id: true, name: true, device: { select: { id: true, name: true } } },
    });

    const metrics: SensorMetric[] = [];

    for (const sensor of sensors) {
      const latestData = await this.prisma.dataPoint.findFirst({
        where: { sensorId: sensor.id },
        orderBy: { timestamp: 'desc' },
      });

      if (latestData?.payload) {
        const payloadObj = latestData.payload as Record<string, unknown>;
        const numericKeys = Object.keys(payloadObj).filter(key => typeof payloadObj[key] === 'number');

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
      .map(dp => {
        const payloadObj = dp.payload as Record<string, unknown>;
        return {
          timestamp: dp.timestamp,
          timeLabel: new Date(dp.timestamp).toLocaleTimeString(),
          [metric]: payloadObj[metric] ?? null,
        };
      })
      .map(
        props =>
          new TimeseriesPoint({
            timestamp: props.timestamp as Date,
            timeLabel: props.timeLabel as string,
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
      const sensor = await this.prisma.sensor.findFirst({
        where: { id: req.sensorId, device: { projectId } },
        select: { id: true, name: true },
      });

      if (!sensor) continue;

      const timeFilter: Record<string, unknown> = {};
      if (from) (timeFilter as any).gte = from;
      if (to) (timeFilter as any).lte = to;

      const dataPoints = await this.prisma.dataPoint.findMany({
        where: {
          sensorId: req.sensorId,
          ...(Object.keys(timeFilter).length > 0 ? { timestamp: timeFilter } : {}),
        },
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
      });

      const seriesKey = `${sensor.name}:${req.metric}`;

      for (const dp of dataPoints) {
        const ts = dp.timestamp.getTime();
        const payloadObj = dp.payload as Record<string, unknown>;
        const value = payloadObj[req.metric];

        if (allPoints.has(ts)) {
          const existing = allPoints.get(ts)!;
          existing[seriesKey] = typeof value === 'number' ? value : null;
        } else {
          allPoints.set(ts, {
            timestamp: dp.timestamp,
            timeLabel: new Date(dp.timestamp).toLocaleTimeString(),
            [seriesKey]: typeof value === 'number' ? value : null,
          });
        }
      }
    }

    return Array.from(allPoints.entries())
      .map(([_, props]) => {
        const entry: Record<string, unknown> = {};
        for (const key of Object.keys(props)) {
          entry[key] = props[key];
        }
        const ts = props.timestamp as Date;
        return new TimeseriesPoint({
          timestamp: ts,
          timeLabel: props.timeLabel as string,
          ...entry,
        });
      })
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

    const timeFilter: Record<string, unknown> = {};
    if (from) (timeFilter as any).gte = from;
    if (to) (timeFilter as any).lte = to;

    const dataPoints = await this.prisma.dataPoint.findMany({
      where: {
        sensorId,
        ...(Object.keys(timeFilter).length > 0 ? { timestamp: timeFilter } : {}),
      },
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

    return MetricStats.create({ sensorId, metric, min, max, avg, stddev, count });
  }

  private async verifyProjectOwnership(userId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Sin acceso a este proyecto');
    }
  }
}