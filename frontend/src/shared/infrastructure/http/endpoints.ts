/**
 * Centralized API endpoint registry.
 * All endpoints are relative to the `/api/v1` prefix applied by `apiClient`.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GOOGLE: '/auth/google',
    GITHUB: '/auth/github',
    CALLBACK: '/auth/callback',
  },

  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    OVERVIEW: '/projects/overview',
    DETAIL: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
  },

  DEVICES: {
    CREATE: '/devices',
    LIST_BY_PROJECT: (projectId: string) => `/devices/project/${projectId}`,
    DETAIL: (id: string) => `/devices/${id}`,
    UPDATE: (id: string) => `/devices/${id}`,
    DELETE: (id: string) => `/devices/${id}`,
  },

  SENSORS: {
    CREATE: '/sensors',
    LIST_BY_DEVICE: (deviceId: string) => `/sensors/device/${deviceId}`,
    DETAIL: (id: string) => `/sensors/${id}`,
    DATA: (id: string) => `/sensors/${id}/data`,
    UPDATE: (id: string) => `/sensors/${id}`,
    DELETE: (id: string) => `/sensors/${id}`,
  },

  ANALYTICS: {
    METRICS: (projectId: string) => `/analytics/${projectId}/metrics`,
    TIMESERIES: (projectId: string) => `/analytics/${projectId}/timeseries`,
    MULTI_TIMESERIES: (projectId: string) =>
      `/analytics/${projectId}/multi-timeseries`,
    STATS: (projectId: string) => `/analytics/${projectId}/stats`,
  },

  DASHBOARDS: {
    GET: (projectId: string) => `/dashboards/project/${projectId}`,
    SAVE: (projectId: string) => `/dashboards/project/${projectId}`,
  },

  OBSERVABILITY: {
    METRICS: '/observability/metrics',
  },

  INGEST: {
    DATA: '/ingest',
  },
} as const
