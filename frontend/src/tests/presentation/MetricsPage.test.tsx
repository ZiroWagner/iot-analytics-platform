import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MetricsPage } from '@/features/observability/presentation/pages/MetricsPage'
import { useSystemMetrics } from '@/features/observability/presentation/hooks/useSystemMetrics'
import { useSocketStatus } from '@/features/telemetry'

// Mock dependencies
vi.mock('@/features/observability/presentation/hooks/useSystemMetrics', () => ({
  useSystemMetrics: vi.fn(),
}))

vi.mock('@/features/telemetry', () => ({
  useTelemetry: vi.fn(),
  useSocketStatus: vi.fn(),
}))

describe('MetricsPage', () => {
  const mockMetrics = {
    streamSize: 1000,
    consumerLag: 5,
    eventsPerSecond: 10,
    onlineDevices: 3,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSystemMetrics).mockReturnValue({
      metrics: mockMetrics,
      loading: false,
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useSystemMetrics>)
    vi.mocked(useSocketStatus).mockReturnValue(true)
  })

  it('renders metrics cards correctly', () => {
    render(<MetricsPage />)
    expect(screen.getByText('Métricas del Sistema')).toBeDefined()
    expect(screen.getByText('1,000')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
  })

  it('renders loading state for metrics', () => {
    vi.mocked(useSystemMetrics).mockReturnValue({
      metrics: null,
      loading: true,
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useSystemMetrics>)

    render(<MetricsPage />)
    const values = screen.getAllByText('—')
    expect(values.length).toBeGreaterThan(0)
  })

  it('shows socket connection status', () => {
    vi.mocked(useSocketStatus).mockReturnValue(false)
    render(<MetricsPage />)
    expect(screen.getByText('WebSocket Inactivo')).toBeDefined()
    
    vi.mocked(useSocketStatus).mockReturnValue(true)
    render(<MetricsPage />)
    expect(screen.getByText('WebSocket Activo')).toBeDefined()
  })

  it('calls refresh when button clicked', () => {
    const refresh = vi.fn()
    vi.mocked(useSystemMetrics).mockReturnValue({
      metrics: mockMetrics,
      loading: false,
      refresh,
    } as unknown as ReturnType<typeof useSystemMetrics>)

    render(<MetricsPage />)
    fireEvent.click(screen.getByText('Sincronizar'))
    expect(refresh).toHaveBeenCalled()
  })

  it('renders architecture flowchart', () => {
    render(<MetricsPage />)
    expect(screen.getByText('Estado de la Arquitectura V2')).toBeDefined()
    expect(screen.getByText('HTTP Ingesta')).toBeDefined()
    expect(screen.getByText('Redis Stream')).toBeDefined()
    expect(screen.getByText('PostgreSQL')).toBeDefined()
  })
})
