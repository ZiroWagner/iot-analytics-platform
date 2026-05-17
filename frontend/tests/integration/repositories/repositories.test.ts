import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ENDPOINTS } from '@/shared/infrastructure/http/endpoints'

const apiClientMock = vi.fn()

vi.mock('@/shared/infrastructure/http', async () => {
  const actual = await vi.importActual<typeof import('@/shared/infrastructure/http')>(
    '@/shared/infrastructure/http',
  )

  return {
    ...actual,
    apiClient: apiClientMock,
  }
})

const { httpAnalyticsRepository } = await import(
  '@/features/analytics/infrastructure/analytics.repository'
)
const { httpDevicesRepository } = await import(
  '@/features/devices/infrastructure/devices.repository'
)
const { httpObservabilityRepository } = await import(
  '@/features/observability/infrastructure/observability.repository'
)
const { httpProjectsRepository } = await import(
  '@/features/projects/infrastructure/projects.repository'
)
const { httpSensorsRepository } = await import(
  '@/features/sensors/infrastructure/sensors.repository'
)

describe('HTTP repositories', () => {
  beforeEach(() => {
    apiClientMock.mockReset()
  })

  it('delegates project operations to apiClient', async () => {
    const projectId = faker.string.uuid()
    const project = {
      id: projectId,
      name: faker.company.name(),
      createdAt: faker.date.recent().toISOString(),
    }

    apiClientMock.mockResolvedValueOnce([project])
    await expect(httpProjectsRepository.list()).resolves.toEqual([project])
    expect(apiClientMock).toHaveBeenLastCalledWith(API_ENDPOINTS.PROJECTS.LIST)

    apiClientMock.mockResolvedValueOnce({ totalProjects: 1 })
    await expect(httpProjectsRepository.overview()).resolves.toEqual({ totalProjects: 1 })
    expect(apiClientMock).toHaveBeenLastCalledWith(API_ENDPOINTS.PROJECTS.OVERVIEW)

    apiClientMock.mockResolvedValueOnce(project)
    await expect(httpProjectsRepository.create({ name: project.name })).resolves.toEqual(project)
    expect(apiClientMock).toHaveBeenLastCalledWith(
      API_ENDPOINTS.PROJECTS.CREATE,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: project.name }),
      }),
    )
  })

  it('delegates device operations to apiClient', async () => {
    const projectId = faker.string.uuid()
    const device = {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      type: faker.helpers.arrayElement(['gateway', 'controller']),
      sensors: [],
      createdAt: faker.date.recent().toISOString(),
    }

    apiClientMock.mockResolvedValueOnce([device])
    await expect(httpDevicesRepository.listByProject(projectId)).resolves.toEqual([device])
    expect(apiClientMock).toHaveBeenLastCalledWith(
      API_ENDPOINTS.DEVICES.LIST_BY_PROJECT(projectId),
    )

    apiClientMock.mockResolvedValueOnce(device)
    await expect(
      httpDevicesRepository.create(projectId, { name: device.name, type: device.type }),
    ).resolves.toEqual(device)
    expect(apiClientMock).toHaveBeenLastCalledWith(
      API_ENDPOINTS.DEVICES.CREATE,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: device.name, type: device.type, projectId }),
      }),
    )
  })

  it('delegates sensor operations to apiClient', async () => {
    const sensor = {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      metadata: { unit: 'celsius' },
      createdAt: faker.date.recent().toISOString(),
    }
    const dataPoint = {
      id: faker.string.uuid(),
      timestamp: faker.date.recent().toISOString(),
      payload: { value: faker.number.float() },
    }

    apiClientMock.mockResolvedValueOnce(sensor)
    await expect(
      httpSensorsRepository.create({
        name: sensor.name,
        deviceId: faker.string.uuid(),
        metadata: sensor.metadata,
      }),
    ).resolves.toEqual(sensor)
    expect(apiClientMock).toHaveBeenLastCalledWith(
      API_ENDPOINTS.SENSORS.CREATE,
      expect.objectContaining({ method: 'POST' }),
    )

    apiClientMock.mockResolvedValueOnce([dataPoint])
    await expect(httpSensorsRepository.getData(sensor.id)).resolves.toEqual([dataPoint])
    expect(apiClientMock).toHaveBeenLastCalledWith(API_ENDPOINTS.SENSORS.DATA(sensor.id))
  })

  it('delegates analytics operations to apiClient', async () => {
    const projectId = faker.string.uuid()
    const params = { from: faker.date.past().toISOString(), to: faker.date.recent().toISOString() }
    const layoutConfig = [{ id: faker.string.uuid(), type: 'line' }]

    apiClientMock.mockResolvedValueOnce([])
    await expect(httpAnalyticsRepository.availableMetrics(projectId)).resolves.toEqual([])
    expect(apiClientMock).toHaveBeenLastCalledWith(API_ENDPOINTS.ANALYTICS.METRICS(projectId))

    apiClientMock.mockResolvedValueOnce({ layout_config: layoutConfig })
    await expect(httpAnalyticsRepository.getDashboardConfig(projectId)).resolves.toEqual({
      layout_config: layoutConfig,
    })
    expect(apiClientMock).toHaveBeenLastCalledWith(API_ENDPOINTS.DASHBOARDS.GET(projectId))

    apiClientMock.mockResolvedValueOnce(undefined)
    await expect(
      httpAnalyticsRepository.saveDashboardConfig(projectId, layoutConfig as never),
    ).resolves.toBeUndefined()
    expect(apiClientMock).toHaveBeenLastCalledWith(
      API_ENDPOINTS.DASHBOARDS.SAVE(projectId),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ layout_config: layoutConfig }),
      }),
    )

    apiClientMock.mockResolvedValueOnce([])
    await expect(httpAnalyticsRepository.multiTimeseries(projectId, params)).resolves.toEqual([])
    expect(apiClientMock).toHaveBeenLastCalledWith(
      `${API_ENDPOINTS.ANALYTICS.MULTI_TIMESERIES(projectId)}?${new URLSearchParams(params).toString()}`,
    )

    apiClientMock.mockResolvedValueOnce({})
    await expect(httpAnalyticsRepository.stats(projectId, params)).resolves.toEqual({})
    expect(apiClientMock).toHaveBeenLastCalledWith(
      `${API_ENDPOINTS.ANALYTICS.STATS(projectId)}?${new URLSearchParams(params).toString()}`,
    )
  })

  it('delegates observability metrics to apiClient', async () => {
    const metrics = { cpu: 1, memory: 2 }

    apiClientMock.mockResolvedValueOnce(metrics)
    await expect(httpObservabilityRepository.metrics()).resolves.toEqual(metrics)
    expect(apiClientMock).toHaveBeenLastCalledWith(API_ENDPOINTS.OBSERVABILITY.METRICS)
  })
})