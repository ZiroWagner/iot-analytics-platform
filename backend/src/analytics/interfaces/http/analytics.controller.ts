import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetAvailableMetricsUseCase } from '@/analytics/application/use-cases/get-available-metrics.use-case';
import { GetTimeseriesUseCase } from '@/analytics/application/use-cases/get-timeseries.use-case';
import { GetMultiTimeseriesUseCase } from '@/analytics/application/use-cases/get-multi-timeseries.use-case';
import { GetStatsUseCase } from '@/analytics/application/use-cases/get-stats.use-case';
import { SeriesRequest } from '@/analytics/domain/entities/analytics.entities';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard)
@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly getAvailableMetricsUseCase: GetAvailableMetricsUseCase,
    private readonly getTimeseriesUseCase: GetTimeseriesUseCase,
    private readonly getMultiTimeseriesUseCase: GetMultiTimeseriesUseCase,
    private readonly getStatsUseCase: GetStatsUseCase,
  ) {}

  @ApiOperation({ summary: 'Get available metrics for a project' })
  @ApiResponse({ status: 200, description: 'List of available metrics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @Get(':projectId/metrics')
  async getMetrics(
    @Req() req: { user: JwtUser },
    @Param('projectId') projectId: string,
  ) {
    return this.getAvailableMetricsUseCase.execute(req.user.sub, projectId);
  }

  @ApiOperation({ summary: 'Get timeseries data for a sensor metric' })
  @ApiResponse({ status: 200, description: 'Timeseries data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'sensorId', required: true, description: 'Sensor ID' })
  @ApiQuery({ name: 'metric', required: true, description: 'Metric name' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max number of points',
    type: Number,
  })
  @Get(':projectId/timeseries')
  async getTimeseries(
    @Req() req: { user: JwtUser },
    @Param('projectId') projectId: string,
    @Query('sensorId') sensorId: string,
    @Query('metric') metric: string,
    @Query('limit') limit?: number,
  ) {
    return this.getTimeseriesUseCase.execute(
      req.user.sub,
      projectId,
      sensorId,
      metric,
      limit || 50,
    );
  }

  @ApiOperation({ summary: 'Get multi-sensor timeseries data' })
  @ApiResponse({ status: 200, description: 'Multi-timeseries data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({
    name: 'series',
    required: true,
    description: 'JSON array of {sensorId, metric}',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max points per series',
    type: Number,
  })
  @Get(':projectId/multi-timeseries')
  async getMultiTimeseries(
    @Req() req: { user: JwtUser },
    @Param('projectId') projectId: string,
    @Query('series') series: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
  ) {
    const parsed = JSON.parse(series) as Array<{
      sensorId: string;
      metric: string;
    }>;
    const seriesRequests = parsed.map((s) => SeriesRequest.create(s));
    return this.getMultiTimeseriesUseCase.execute(
      req.user.sub,
      projectId,
      seriesRequests,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      limit || 100,
    );
  }

  @ApiOperation({ summary: 'Get statistics for a sensor metric' })
  @ApiResponse({ status: 200, description: 'Metric statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'sensorId', required: true, description: 'Sensor ID' })
  @ApiQuery({ name: 'metric', required: true, description: 'Metric name' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  @Get(':projectId/stats')
  async getStats(
    @Req() req: { user: JwtUser },
    @Param('projectId') projectId: string,
    @Query('sensorId') sensorId: string,
    @Query('metric') metric: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.getStatsUseCase.execute(
      req.user.sub,
      projectId,
      sensorId,
      metric,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
