import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsTab } from '@/features/analytics/presentation/AnalyticsTab'

const mockGetDashboardConfig = vi.fn()
const mockSaveDashboardConfig = vi.fn()
const mockMigrateLegacyConfig = vi.fn()

vi.mock('@/features/analytics/infrastructure/analytics.repository', () => ({
  httpAnalyticsRepository: {
    availableMetrics: vi.fn().mockResolvedValue([]),
    getDashboardConfig: (...args: unknown[]) => mockGetDashboardConfig(...args),
    saveDashboardConfig: (...args: unknown[]) => mockSaveDashboardConfig(...args),
    multiTimeseries: vi.fn(),
    stats: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

let legacyIsLegacy = false
vi.mock('@/features/analytics/domain/legacy', () => ({
  isLegacyFormat: () => legacyIsLegacy,
  migrateLegacyConfig: (...args: unknown[]) => mockMigrateLegacyConfig(...args),
}))

vi.mock('@/features/analytics/presentation/components/ChartWidget', () => ({
  ChartWidget: ({ config: { title }, onRemove, onEdit }: { config: { title: string }; onRemove: () => void; onEdit: () => void }) => (
    <div data-testid="chart-widget">
      <span>{title}</span>
      <button data-testid="remove-widget" onClick={onRemove}>Remove</button>
      <button data-testid="edit-widget" onClick={onEdit}>Edit</button>
    </div>
  ),
}))

vi.mock('@/features/analytics/presentation/components/ChartConfigDialog', () => ({
  ChartConfigDialog: ({ open, onSave }: { open: boolean; onSave: (config: Record<string, unknown>) => void }) => {
    if (!open) return null
    return (
      <div data-testid="chart-config-dialog">
        <button data-testid="save-widget" onClick={() => onSave({
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
        })}>Save Widget</button>
      </div>
    )
  },
}))

vi.mock('@/features/analytics/presentation/components/TimeRangeSelector', () => ({
  TimeRangeSelector: () => <div data-testid="time-range-selector" />,
}))

vi.mock('@/components/DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) => {
    if (!open) return null
    return (
      <div data-testid="delete-confirm-dialog">
        <button data-testid="confirm-delete" onClick={onConfirm}>Confirm Delete</button>
      </div>
    )
  },
}))

describe('AnalyticsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSaveDashboardConfig.mockResolvedValue(undefined)
    legacyIsLegacy = false
  })

  it('renders loading spinner while fetching config', () => {
    mockGetDashboardConfig.mockReturnValue(new Promise(() => {}))
    render(<AnalyticsTab projectId="project-1" />)
    expect(screen.getByText('Cargando motor analítico...')).toBeInTheDocument()
  })

  it('shows empty state when no widgets are configured', async () => {
    mockGetDashboardConfig.mockResolvedValue({})
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Tu dashboard está vacío')).toBeInTheDocument()
    })
    expect(screen.getByText('Crear Primer Widget')).toBeInTheDocument()
  })

  it('renders widgets when dashboard config has widgets', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [{ id: 'widget-1', title: 'Temperature Chart', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 30000 }],
    })
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Temperature Chart')).toBeInTheDocument())
    expect(screen.getByText('1 widget activo')).toBeInTheDocument()
  })

  it('renders multiple widgets and shows plural count', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [
        { id: 'widget-1', title: 'Temperature Chart', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 30000 },
        { id: 'widget-2', title: 'Humidity Chart', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 30000 },
      ],
    })
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Temperature Chart')).toBeInTheDocument())
    expect(screen.getByText('2 widgets activos')).toBeInTheDocument()
  })

  it('opens create dialog when clicking create button', async () => {
    mockGetDashboardConfig.mockResolvedValue({})
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Crear Primer Widget')).toBeInTheDocument())
    await user.click(screen.getByText('Crear Primer Widget'))
    expect(screen.getByTestId('chart-config-dialog')).toBeInTheDocument()
  })

  it('creates a new widget via dialog', async () => {
    mockGetDashboardConfig.mockResolvedValue({})
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Crear Primer Widget')).toBeInTheDocument())
    await user.click(screen.getByText('Crear Primer Widget'))
    await user.click(screen.getByTestId('save-widget'))

    await waitFor(() => expect(screen.getByText('New Metric Widget')).toBeInTheDocument())
    expect(mockSaveDashboardConfig).toHaveBeenCalledTimes(1)
  })

  it('opens delete confirmation when remove is clicked', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [{ id: 'widget-1', title: 'Temperature Chart', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 30000 }],
    })
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Temperature Chart')).toBeInTheDocument())
    await user.click(screen.getByTestId('remove-widget'))
    expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument()
  })

  it('deletes widget after confirmation', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [{ id: 'widget-1', title: 'Temperature Chart', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 30000 }],
    })
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Temperature Chart')).toBeInTheDocument())
    await user.click(screen.getByTestId('remove-widget'))
    await user.click(screen.getByTestId('confirm-delete'))

    await waitFor(() => expect(screen.getByText('Tu dashboard está vacío')).toBeInTheDocument())
    expect(mockSaveDashboardConfig).toHaveBeenCalledWith('project-1', [])
  })

  it('opens edit dialog when edit button is clicked', async () => {
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [{ id: 'widget-1', title: 'Temperature Chart', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 30000 }],
    })
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Temperature Chart')).toBeInTheDocument())
    await user.click(screen.getByTestId('edit-widget'))
    expect(screen.getByTestId('chart-config-dialog')).toBeInTheDocument()
  })

  it('handles legacy config migration', async () => {
    legacyIsLegacy = true
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [{ id: 'old-widget', type: 'line', metric: 'temperature', title: 'Legacy Widget' }],
    })
    mockMigrateLegacyConfig.mockReturnValue([{ id: 'migrated-1', title: 'Migrated Widget', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 30000 }])
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Migrated Widget')).toBeInTheDocument())
    expect(mockMigrateLegacyConfig).toHaveBeenCalled()
    expect(mockSaveDashboardConfig).toHaveBeenCalled()
  })

  it('handles error loading config gracefully', async () => {
    mockGetDashboardConfig.mockRejectedValue(new Error('Network error'))
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => {
      expect(screen.getByText('Tu dashboard está vacío')).toBeInTheDocument()
    })
  })

  it('handles error during save when deleting widget', async () => {
    mockSaveDashboardConfig.mockRejectedValue(new Error('Save failed'))
    mockGetDashboardConfig.mockResolvedValue({
      layout_config: [{ id: 'widget-1', title: 'Temperature Chart', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 30000 }],
    })
    const user = userEvent.setup()
    render(<AnalyticsTab projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('Temperature Chart')).toBeInTheDocument())
    await user.click(screen.getByTestId('remove-widget'))
    await user.click(screen.getByTestId('confirm-delete'))

    await waitFor(() => {
      expect(screen.getByText('Tu dashboard está vacío')).toBeInTheDocument()
    })
  })
})
