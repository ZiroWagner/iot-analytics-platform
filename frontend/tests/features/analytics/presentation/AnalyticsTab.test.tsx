import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockAvailableMetrics = vi.fn()
const mockGetDashboardConfig = vi.fn()
const mockSaveDashboardConfig = vi.fn()

vi.mock('@/features/analytics/infrastructure/analytics.repository', () => ({
  httpAnalyticsRepository: {
    availableMetrics: (...args: unknown[]) => mockAvailableMetrics(...args),
    getDashboardConfig: (...args: unknown[]) => mockGetDashboardConfig(...args),
    saveDashboardConfig: (...args: unknown[]) => mockSaveDashboardConfig(...args),
    multiTimeseries: vi.fn(),
    stats: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/analytics/domain/legacy', () => ({
  isLegacyFormat: () => false,
  migrateLegacyConfig: vi.fn(),
}))

vi.mock('@/features/analytics/presentation/components/ChartWidget', () => ({
  ChartWidget: ({ config: { title }, onRemove, onEdit }: {
    config: { title: string }
    onRemove: () => void
    onEdit: () => void
  }) => (
    <div data-testid="chart-widget">
      <span>{title}</span>
      <button data-testid="remove-widget" onClick={onRemove}>Remove</button>
      <button data-testid="edit-widget" onClick={onEdit}>Edit</button>
    </div>
  ),
}))

vi.mock('@/features/analytics/presentation/components/ChartConfigDialog', () => ({
  ChartConfigDialog: ({ open, onSave }: {
    open: boolean
    onSave: (config: Record<string, unknown>) => void
  }) => {
    if (!open) return null
    return (
      <div data-testid="chart-config-dialog">
        <button
          data-testid="save-widget"
          onClick={() => onSave({
            id: 'new-widget-1',
            title: 'New Metric Widget',
            series: [{ id: 's1', sensorId: 'sens-1', sensorName: 'Sensor A', metric: 'temperature', chartType: 'line', color: '#8884d8', yAxisId: 'left', unit: '°C' }],
            size: 'md',
            timeRange: '15m',
            showGrid: true,
            showLegend: true,
            showReferenceLines: false,
            yAxisAutoRange: true,
            refreshInterval: 30000,
          })}
        >
          Save Widget
        </button>
      </div>
    )
  },
}))

vi.mock('@/features/analytics/presentation/components/TimeRangeSelector', () => ({
  TimeRangeSelector: () => <div data-testid="time-range-selector" />,
}))

vi.mock('@/components/DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({ open, onConfirm, loading }: {
    open: boolean
    onConfirm: () => void
    loading: boolean
  }) => {
    if (!open) return null
    return (
      <div data-testid="delete-confirm-dialog">
        <button
          data-testid="confirm-delete"
          onClick={onConfirm}
          disabled={loading}
        >
          Confirm Delete
        </button>
      </div>
    )
  },
}))

const mockWidget = {
  id: 'widget-1',
  title: 'Temperature Chart',
  series: [{ id: 's1', sensorId: 'sens-1', sensorName: 'Sensor A', metric: 'temperature', chartType: 'line', color: '#8884d8', yAxisId: 'left', unit: '' }],
  size: 'md',
  timeRange: '15m' as const,
  showGrid: true,
  showLegend: true,
  showReferenceLines: false,
  yAxisAutoRange: true,
  refreshInterval: 30000,
}

describe('AnalyticsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAvailableMetrics.mockResolvedValue([])
    mockSaveDashboardConfig.mockResolvedValue(undefined)
  })

  it('shows loading state initially', () => {
    mockGetDashboardConfig.mockReturnValue(new Promise(() => {}))
    render(<div data-testid="analytics-tab-wrapper" />)

    // Lazy import inside test to avoid hoisting issues
  })

  it('renders loading spinner while fetching config', async () => {
    mockGetDashboardConfig.mockReturnValue(new Promise(() => {}))
    const { AnalyticsTab } = await import('@/features/analytics/presentation/AnalyticsTab')
    render(<AnalyticsTab projectId="project-1" />)

    expect(screen.getByText('Cargando motor analítico...')).toBeInTheDocument()
  })

  it('shows empty state when no widgets are configured', async () => {
    mockGetDashboardConfig.mockResolvedValue({})
    const { AnalyticsTab } = await import('@/features/analytics/presentation/AnalyticsTab')
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Tu dashboard está vacío')).toBeInTheDocument()
    })

    expect(screen.getByText('Crear Primer Widget')).toBeInTheDocument()
  })

  it('renders widgets when dashboard config has widgets', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [mockWidget],
    })
    const { AnalyticsTab } = await import('@/features/analytics/presentation/AnalyticsTab')
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Temperature Chart')).toBeInTheDocument()
    })

    expect(screen.getByText('1 widget activo')).toBeInTheDocument()
  })

  it('renders multiple widgets and shows plural count', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [
        mockWidget,
        { ...mockWidget, id: 'widget-2', title: 'Humidity Chart' },
      ],
    })
    const { AnalyticsTab } = await import('@/features/analytics/presentation/AnalyticsTab')
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Temperature Chart')).toBeInTheDocument()
    })

    expect(screen.getByText('2 widgets activos')).toBeInTheDocument()
  })

  it('opens create dialog when clicking create button', async () => {
    mockGetDashboardConfig.mockResolvedValue({})
    const { AnalyticsTab } = await import('@/features/analytics/presentation/AnalyticsTab')
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Tu dashboard está vacío')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Crear Primer Widget'))

    expect(screen.getByTestId('chart-config-dialog')).toBeInTheDocument()
  })

  it('creates a new widget via dialog', async () => {
    mockGetDashboardConfig.mockResolvedValue({})
    const { AnalyticsTab } = await import('@/features/analytics/presentation/AnalyticsTab')
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Crear Primer Widget')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Crear Primer Widget'))
    await user.click(screen.getByTestId('save-widget'))

    await waitFor(() => {
      expect(screen.getByText('New Metric Widget')).toBeInTheDocument()
    })

    expect(mockSaveDashboardConfig).toHaveBeenCalledTimes(1)
  })

  it('opens delete confirmation when remove is clicked', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [mockWidget],
    })
    const { AnalyticsTab } = await import('@/features/analytics/presentation/AnalyticsTab')
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Temperature Chart')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('remove-widget'))

    expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument()
  })

  it('deletes widget after confirmation', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [mockWidget],
    })
    const { AnalyticsTab } = await import('@/features/analytics/presentation/AnalyticsTab')
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Temperature Chart')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('remove-widget'))
    await user.click(screen.getByTestId('confirm-delete'))

    await waitFor(() => {
      expect(screen.getByText('Tu dashboard está vacío')).toBeInTheDocument()
    })

    expect(mockSaveDashboardConfig).toHaveBeenCalledWith(
      'project-1',
      [],
    )
  })
})
