import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SensorDataModal } from '@/features/sensors/presentation/components/SensorDataModal'
import { useSensorData } from '@/features/sensors/presentation/hooks/useSensorData'
import type { Sensor, DataPoint } from '@/features/sensors/domain/types'
import type { ReactNode } from 'react'

// Mock dependencies
vi.mock('@/features/sensors/presentation/hooks/useSensorData', () => ({
  useSensorData: vi.fn(),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children }: { children: ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: ReactNode }) => <th>{children}</th>,
  TableCell: ({ children }: { children: ReactNode }) => <td>{children}</td>,
}))

describe('SensorDataModal', () => {
  const mockSensor: Sensor = {
    id: 's1',
    name: 'Test Sensor',
    metadata: {},
    createdAt: 'now'
  }

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
    const mockData: DataPoint[] = [
      { id: 'dp1', timestamp: '2023-01-01T10:00:00Z', payload: { value: 10 } }
    ]
    vi.mocked(useSensorData).mockReturnValue({
      dataPoints: mockData,
      loading: false,
    })

    render(<SensorDataModal sensor={mockSensor} onClose={vi.fn()} />)
    expect(screen.getByText(/10/)).toBeDefined()
    expect(screen.getByText(/Sensor: Test Sensor/)).toBeDefined()
  })
})
