import { describe, expect, it } from 'vitest'
import { API_ENDPOINTS } from '@/shared/infrastructure/http/endpoints'

describe('API_ENDPOINTS', () => {
  describe('AUTH', () => {
    it('has static auth paths', () => {
      expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login')
      expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/auth/register')
      expect(API_ENDPOINTS.AUTH.GOOGLE).toBe('/auth/google')
      expect(API_ENDPOINTS.AUTH.GITHUB).toBe('/auth/github')
      expect(API_ENDPOINTS.AUTH.CALLBACK).toBe('/auth/callback')
    })
  })

  describe('PROJECTS', () => {
    it('has static list and create paths', () => {
      expect(API_ENDPOINTS.PROJECTS.LIST).toBe('/projects')
      expect(API_ENDPOINTS.PROJECTS.CREATE).toBe('/projects')
      expect(API_ENDPOINTS.PROJECTS.OVERVIEW).toBe('/projects/overview')
    })

    it('generates dynamic paths with project id', () => {
      expect(API_ENDPOINTS.PROJECTS.DETAIL('abc')).toBe('/projects/abc')
      expect(API_ENDPOINTS.PROJECTS.UPDATE('xyz')).toBe('/projects/xyz')
      expect(API_ENDPOINTS.PROJECTS.DELETE('123')).toBe('/projects/123')
    })
  })

  describe('DEVICES', () => {
    it('has static create path', () => {
      expect(API_ENDPOINTS.DEVICES.CREATE).toBe('/devices')
    })

    it('generates dynamic paths', () => {
      expect(API_ENDPOINTS.DEVICES.LIST_BY_PROJECT('p1')).toBe('/devices/project/p1')
      expect(API_ENDPOINTS.DEVICES.DETAIL('d1')).toBe('/devices/d1')
      expect(API_ENDPOINTS.DEVICES.UPDATE('d1')).toBe('/devices/d1')
      expect(API_ENDPOINTS.DEVICES.DELETE('d1')).toBe('/devices/d1')
    })
  })

  describe('SENSORS', () => {
    it('has static create path', () => {
      expect(API_ENDPOINTS.SENSORS.CREATE).toBe('/sensors')
    })

    it('generates dynamic paths', () => {
      expect(API_ENDPOINTS.SENSORS.LIST_BY_DEVICE('dev1')).toBe('/sensors/device/dev1')
      expect(API_ENDPOINTS.SENSORS.DETAIL('s1')).toBe('/sensors/s1')
      expect(API_ENDPOINTS.SENSORS.DATA('s1')).toBe('/sensors/s1/data')
      expect(API_ENDPOINTS.SENSORS.UPDATE('s1')).toBe('/sensors/s1')
      expect(API_ENDPOINTS.SENSORS.DELETE('s1')).toBe('/sensors/s1')
    })
  })

  describe('ANALYTICS', () => {
    it('generates project-scoped analytics paths', () => {
      expect(API_ENDPOINTS.ANALYTICS.METRICS('p1')).toBe('/analytics/p1/metrics')
      expect(API_ENDPOINTS.ANALYTICS.TIMESERIES('p1')).toBe('/analytics/p1/timeseries')
      expect(API_ENDPOINTS.ANALYTICS.MULTI_TIMESERIES('p1')).toBe('/analytics/p1/multi-timeseries')
      expect(API_ENDPOINTS.ANALYTICS.STATS('p1')).toBe('/analytics/p1/stats')
    })
  })

  describe('DASHBOARDS', () => {
    it('generates project-scoped dashboard paths', () => {
      expect(API_ENDPOINTS.DASHBOARDS.GET('p1')).toBe('/dashboards/project/p1')
      expect(API_ENDPOINTS.DASHBOARDS.SAVE('p1')).toBe('/dashboards/project/p1')
    })
  })

  describe('OBSERVABILITY', () => {
    it('has a static metrics path', () => {
      expect(API_ENDPOINTS.OBSERVABILITY.METRICS).toBe('/observability/metrics')
    })
  })

  describe('INGEST', () => {
    it('has a static data path', () => {
      expect(API_ENDPOINTS.INGEST.DATA).toBe('/ingest')
    })
  })
})