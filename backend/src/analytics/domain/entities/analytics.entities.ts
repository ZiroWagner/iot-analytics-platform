export interface SensorMetricProps {
  sensorId: string;
  sensorName: string;
  gatewayId: string;
  gatewayName: string;
  availableMetrics: string[];
}

export class SensorMetric {
  constructor(
    public readonly sensorId: string,
    public readonly sensorName: string,
    public readonly gatewayId: string,
    public readonly gatewayName: string,
    public readonly availableMetrics: string[],
  ) {}

  static create(props: SensorMetricProps): SensorMetric {
    return new SensorMetric(
      props.sensorId,
      props.sensorName,
      props.gatewayId,
      props.gatewayName,
      props.availableMetrics,
    );
  }
}

export interface TimeseriesPointProps {
  timestamp: Date;
  timeLabel: string;
  [metric: string]: unknown;
}

export class TimeseriesPoint {
  public timestamp: Date;
  public timeLabel: string;
  [metric: string]: unknown;

  constructor(props: TimeseriesPointProps) {
    this.timestamp = props.timestamp;
    this.timeLabel = props.timeLabel;
    for (const key of Object.keys(props)) {
      if (key !== 'timestamp' && key !== 'timeLabel') {
        this[key] = props[key];
      }
    }
  }
}

export interface SeriesRequestProps {
  sensorId: string;
  metric: string;
}

export class SeriesRequest {
  constructor(
    public readonly sensorId: string,
    public readonly metric: string,
  ) {}

  static create(props: SeriesRequestProps): SeriesRequest {
    return new SeriesRequest(props.sensorId, props.metric);
  }
}

export interface MetricStatsProps {
  sensorId: string;
  metric: string;
  min: number;
  max: number;
  avg: number;
  stddev: number;
  count: number;
}

export class MetricStats {
  constructor(
    public readonly sensorId: string,
    public readonly metric: string,
    public readonly min: number,
    public readonly max: number,
    public readonly avg: number,
    public readonly stddev: number,
    public readonly count: number,
  ) {}

  static create(props: MetricStatsProps): MetricStats {
    return new MetricStats(
      props.sensorId,
      props.metric,
      props.min,
      props.max,
      props.avg,
      props.stddev,
      props.count,
    );
  }
}