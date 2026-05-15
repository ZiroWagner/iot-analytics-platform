import {
  SensorMetric,
  TimeseriesPoint,
  SeriesRequest,
  MetricStats,
} from '../entities/analytics.entities';

describe('Analytics Entities', () => {
  describe('SensorMetric', () => {
    it('creates an instance via factory', () => {
      const metric = SensorMetric.create({
        sensorId: 's1',
        sensorName: 'Temp Sensor',
        gatewayId: 'g1',
        gatewayName: 'Gateway 1',
        availableMetrics: ['temperature', 'humidity'],
      });
      expect(metric.sensorId).toBe('s1');
      expect(metric.availableMetrics).toEqual(['temperature', 'humidity']);
    });
  });

  describe('TimeseriesPoint', () => {
    it('sets timestamp and timeLabel from props', () => {
      const ts = new Date('2026-01-01');
      const point = new TimeseriesPoint({
        timestamp: ts,
        timeLabel: '12:00:00',
      });
      expect(point.timestamp).toBe(ts);
      expect(point.timeLabel).toBe('12:00:00');
    });

    it('copies additional metric fields from props', () => {
      const ts = new Date();
      const point = new TimeseriesPoint({
        timestamp: ts,
        timeLabel: '00:00',
        temperature: 22.5,
        humidity: 60,
      });
      expect(point['temperature']).toBe(22.5);
      expect(point['humidity']).toBe(60);
    });
  });

  describe('SeriesRequest', () => {
    it('creates an instance via factory', () => {
      const req = SeriesRequest.create({ sensorId: 's1', metric: 'temp' });
      expect(req.sensorId).toBe('s1');
      expect(req.metric).toBe('temp');
    });
  });

  describe('MetricStats', () => {
    it('creates an instance via factory', () => {
      const stats = MetricStats.create({
        sensorId: 's1',
        metric: 'temperature',
        min: 10,
        max: 40,
        avg: 25,
        stddev: 5,
        count: 100,
      });
      expect(stats.sensorId).toBe('s1');
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(40);
      expect(stats.avg).toBe(25);
      expect(stats.stddev).toBe(5);
      expect(stats.count).toBe(100);
    });
  });
});
