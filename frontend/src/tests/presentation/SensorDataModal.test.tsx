import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SensorDataModal } from '@/features/sensors/presentation/components/SensorDataModal'
import { useSensorData } from '@/features/sensors/presentation/hooks/useSensorData'

// Mock dependencies
vi.mock('@/features/sensors/presentation/hooks/useSensorData', () => ({
  useSensorData: vi.fn(),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children }: any) => <td>{children}</td>,
}))

describe('SensorDataModal', () => {
  const mockSensor = {
    id: 's1',
    name: 'Test Sensor',
    metadata: {},
    created_at: 'now'
  } as unknown as never

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    vi.mocked(useSensorData).mockReturnValue({
      dataPoints: [],
      loading: true,
    })

    render(<SensorDataModal sensor={mockSensor} onClose={vi.fn()} />)
    expect(screen.getByText('Cargando datos...')).toBeDefined()
  })

  it('renders empty state', () => {
    vi.mocked(useSensorData).mockReturnValue({
      dataPoints: [],
      loading: false,
    })

    render(<SensorDataModal sensor={mockSensor} onClose={vi.fn()} />)
    expect(screen.getByText('Sin telemetría registrada aún.')).toBeDefined()
  })

  it('renders data points', () => {
    const mockData = [
      { id: 'dp1', timestamp: '2023-01-01T10:00:00Z', payload: { value: 10 } }
    ]
    vi.mocked(useSensorData).mockReturnValue({
      dataPoints: mockData as any,
      loading: false,
    })

    render(<SensorDataModal sensor={mockSensor} onClose={vi.fn()} />)
    expect(screen.getByText(/10/)).toBeDefined()
    expect(screen.getByText(/Sensor: Test Sensor/)).toBeDefined()
  })
})
