import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient, getApiBaseUrl, getAuthUrl, isAuthenticated } from '../infrastructure/http/api-client'
import { API_BASE_URL, API_PREFIX, API_URL } from '../infrastructure/http/config'
import { API_ENDPOINTS } from '../infrastructure/http/endpoints'
import { tokenStorage } from '../infrastructure/http/token-storage'

const fetchMock = vi.fn<typeof fetch>()

describe('tokenStorage', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('stores, reads and clears the auth token', () => {
    const token = crypto.randomUUID()

    expect(tokenStorage.get()).toBeNull()

    tokenStorage.set(token)
    expect(tokenStorage.get()).toBe(token)
    expect(isAuthenticated()).toBe(true)

    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })
})

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
    fetchMock.mockReset()
  })

  it('builds API helper URLs from shared config', () => {
    expect(getApiBaseUrl()).toBe(API_BASE_URL)
    expect(getAuthUrl(API_ENDPOINTS.AUTH.GOOGLE)).toBe(
      `${API_BASE_URL}${API_PREFIX}${API_ENDPOINTS.AUTH.GOOGLE}`,
    )
  })

  it('adds JSON and authorization headers and unwraps response envelopes', async () => {
    const token = crypto.randomUUID()
    const payload = { id: crypto.randomUUID() }
    tokenStorage.set(token)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: payload }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiClient<typeof payload>(API_ENDPOINTS.PROJECTS.CREATE, {
      method: 'POST',
      body: JSON.stringify({ name: 'Project' }),
    })

    expect(result).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}${API_ENDPOINTS.PROJECTS.CREATE}`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('returns direct JSON responses when no envelope is present', async () => {
    const payload = { value: crypto.randomUUID() }
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient<typeof payload>(API_ENDPOINTS.PROJECTS.LIST)).resolves.toEqual(payload)
  })

  it('throws validation details from error responses', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ details: ['invalid name', 'invalid owner'] }), {
        status: 400,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient(API_ENDPOINTS.PROJECTS.CREATE)).rejects.toThrow(
      'invalid name, invalid owner',
    )
  })

  it('throws message fields from error responses', async () => {
    const message = `Denied ${crypto.randomUUID()}`
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message }), { status: 403 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient(API_ENDPOINTS.PROJECTS.LIST)).rejects.toThrow(message)
  })

  it('falls back to text for non-JSON error responses', async () => {
    const message = `gateway-${crypto.randomUUID()}`
    fetchMock.mockResolvedValueOnce(new Response(message, { status: 502 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient(API_ENDPOINTS.PROJECTS.LIST)).rejects.toThrow(
      `API Error 502: ${message}`,
    )
  })
})

describe('API_ENDPOINTS', () => {
  it('builds dynamic endpoint paths', () => {
    const id = crypto.randomUUID()

    expect(API_ENDPOINTS.PROJECTS.DETAIL(id)).toBe(`/projects/${id}`)
    expect(API_ENDPOINTS.DEVICES.LIST_BY_PROJECT(id)).toBe(`/devices/project/${id}`)
    expect(API_ENDPOINTS.SENSORS.DATA(id)).toBe(`/sensors/${id}/data`)
    expect(API_ENDPOINTS.ANALYTICS.MULTI_TIMESERIES(id)).toBe(
      `/analytics/${id}/multi-timeseries`,
    )
    expect(API_ENDPOINTS.DASHBOARDS.GET(id)).toBe(`/dashboards/project/${id}`)
  })
})
