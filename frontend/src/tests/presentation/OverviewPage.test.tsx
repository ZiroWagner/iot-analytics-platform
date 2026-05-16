import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OverviewPage } from '@/features/projects/presentation/pages/OverviewPage'
import { useOverview } from '@/features/projects/presentation/hooks/useOverview'
import { useRouter } from 'next/navigation'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/features/projects/presentation/hooks/useOverview', () => ({
  useOverview: vi.fn(),
}))

describe('OverviewPage', () => {
  const mockRouter = { push: vi.fn() }
  const mockStats = {
    totalProjects: 2,
    totalDevices: 10,
    totalSensors: 25,
    eventsLast24h: 1500,
    recentEvents: [
      {
        id: 'e1',
        timestamp: new Date().toISOString(),
        payload: { temp: 22.5 },
        sensor: { name: 'S1', device: { name: 'G1' } },
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>)
    vi.mocked(useOverview).mockReturnValue({
      stats: mockStats,
      loading: false,
      unauthorized: false,
    } as unknown as ReturnType<typeof useOverview>)
  })

  it('renders stats cards correctly', () => {
    render(<OverviewPage />)
    expect(screen.getByText('Proyectos Activos')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('Dispositivos (Gateways)')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
    expect(screen.getByText('Nodos de Sensores')).toBeDefined()
    expect(screen.getByText('25')).toBeDefined()
    expect(screen.getByText('1500')).toBeDefined()
  })

  it('renders recent events table', () => {
    render(<OverviewPage />)
    expect(screen.getByText('Flujo de Actividad Reciente')).toBeDefined()
    expect(screen.getByText('G1')).toBeDefined()
    expect(screen.getByText('S1')).toBeDefined()
    expect(screen.getByText(/"temp": 22.5/i)).toBeDefined()
  })

  it('renders empty state when no projects', () => {
    vi.mocked(useOverview).mockReturnValue({
      stats: { totalProjects: 0 },
      loading: false,
      unauthorized: false,
    } as unknown as ReturnType<typeof useOverview>)

    render(<OverviewPage />)
    expect(screen.getByText('Bienvenido a Vortex IoT')).toBeDefined()
    
    fireEvent.click(screen.getByText('Crear tu primer Proyecto'))
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/projects')
  })

  it('renders loading state', () => {
    vi.mocked(useOverview).mockReturnValue({
      stats: null,
      loading: true,
      unauthorized: false,
    } as unknown as ReturnType<typeof useOverview>)

    render(<OverviewPage />)
    expect(document.querySelector('.animate-spin')).toBeDefined()
  })

  it('redirects to login if unauthorized', () => {
    vi.mocked(useOverview).mockReturnValue({
      stats: null,
      loading: false,
      unauthorized: true,
    } as unknown as ReturnType<typeof useOverview>)

    render(<OverviewPage />)
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })
})
