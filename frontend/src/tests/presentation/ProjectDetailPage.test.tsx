import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectDetailPage } from '@/features/devices/presentation/pages/ProjectDetailPage'
import { useDevicesByProject } from '@/features/devices/presentation/hooks/useDevicesByProject'
import { useTelemetry, useSocketStatus, useTelemetryStore } from '@/features/telemetry'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { httpDevicesRepository } from '@/features/devices/infrastructure/devices.repository'
import { httpSensorsRepository } from '@/features/sensors'

import { z } from 'zod'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/features/devices/presentation/hooks/useDevicesByProject', () => ({
  useDevicesByProject: vi.fn(),
}))

vi.mock('@/features/telemetry', () => ({
  useTelemetry: vi.fn(),
  useSocketStatus: vi.fn(),
  useTelemetryStore: vi.fn(),
}))

vi.mock('@/features/devices/infrastructure/devices.repository', () => ({
  httpDevicesRepository: {
    create: vi.fn(),
  },
}))

vi.mock('@/features/sensors', async () => {
  const { z } = await vi.importActual<typeof import('zod')>('zod')
  return {
    httpSensorsRepository: {
      create: vi.fn(),
    },
    SensorDataModal: () => <div data-testid="sensor-modal">Sensor Modal</div>,
    createSensorFormSchema: z.object({ name: z.string(), metadata: z.string().optional() }),
    parseSensorMetadata: vi.fn().mockReturnValue({}),
  }
})

// We need to mock the device schemas because they are imported from relative paths in the component
vi.mock('../../domain/schemas', async () => {
  const { z } = await vi.importActual<typeof import('zod')>('zod')
  return {
    createDeviceSchema: z.object({
      name: z.string().min(2),
      type: z.string().min(2),
      mac_address: z.string().optional(),
    }),
  }
})

// Mock ResizeObserver for Radix components
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as any

describe('ProjectDetailPage', () => {
  const mockRouter = { push: vi.fn() }
  const mockDevices = [
    { id: 'd1', name: 'Gateway 1', type: 'ESP32', mac_address: '00:11', sensors: [], lastSeenAt: new Date().toISOString() },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useParams).mockReturnValue({ id: 'p1' })
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(useSocketStatus).mockReturnValue(true)
    vi.mocked(useTelemetryStore).mockReturnValue({})
    vi.mocked(useDevicesByProject).mockReturnValue({
      devices: mockDevices,
      loading: false,
      unauthorized: false,
      refetch: vi.fn(),
    } as any)
  })

  it('renders loading state', () => {
    vi.mocked(useDevicesByProject).mockReturnValue({
      devices: [],
      loading: true,
      unauthorized: false,
      refetch: vi.fn(),
    } as any)

    render(<ProjectDetailPage />)
    expect(screen.getByText(/Cargando.../i)).toBeDefined()
  })

  it('renders device list and project header', () => {
    render(<ProjectDetailPage />)
    expect(screen.getByText('Gestión del Proyecto')).toBeDefined()
    expect(screen.getByText('Gateway 1')).toBeDefined()
    expect(screen.getByText('ESP32 (00:11)')).toBeDefined()
  })

  it('redirects to login if unauthorized', () => {
    vi.mocked(useDevicesByProject).mockReturnValue({
      devices: [],
      loading: false,
      unauthorized: true,
      refetch: vi.fn(),
    } as any)

    render(<ProjectDetailPage />)
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('opens register gateway dialog and submits form', async () => {
    vi.mocked(httpDevicesRepository.create).mockResolvedValue({ id: 'new-d', api_key: 'secret-key' } as any)
    
    render(<ProjectDetailPage />)
    
    const registerBtn = screen.getByText('Registrar Gateway')
    fireEvent.click(registerBtn)
    
    expect(screen.getByText('Registrar Hardware Gateway')).toBeDefined()
    
    const nameInput = screen.getByPlaceholderText(/Nodo-Central/i)
    fireEvent.change(nameInput, { target: { value: 'New Node' } })
    
    const submitBtn = screen.getByText('Generar Credenciales')
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
      expect(httpDevicesRepository.create).toHaveBeenCalledWith('p1', expect.objectContaining({ name: 'New Node' }))
      expect(screen.getByText('Gateway Creado')).toBeDefined()
      expect(screen.getByText('secret-key')).toBeDefined()
    })
  })

  it('opens new sensor dialog and submits form', async () => {
    vi.mocked(httpSensorsRepository.create).mockResolvedValue({ id: 's1' } as any)
    
    render(<ProjectDetailPage />)
    const row = screen.getByText('Gateway 1')
    fireEvent.click(row)
    
    const newSensorBtn = screen.getByText('Nuevo Sensor')
    fireEvent.click(newSensorBtn)
    
    expect(screen.getByText('Anexar Sensor al Gateway')).toBeDefined()
    
    const sensorNameInput = screen.getByPlaceholderText(/sensor_temp_01/i)
    fireEvent.change(sensorNameInput, { target: { value: 'Temp 1' } })
    
    const submitBtn = screen.getByText('Agregar Sensor')
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
      expect(httpSensorsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Temp 1', deviceId: 'd1' }))
      expect(toast.success).toHaveBeenCalledWith('Sensor lógico registrado al Gateway.')
    })
  })

  it('handles error when gateway registration fails', async () => {
    vi.mocked(httpDevicesRepository.create).mockRejectedValue(new Error('Failed to create'))
    
    render(<ProjectDetailPage />)
    fireEvent.click(screen.getByText('Registrar Gateway'))
    fireEvent.change(screen.getByPlaceholderText(/Nodo-Central/i), { target: { value: 'Fail Node' } })
    fireEvent.click(screen.getByText('Generar Credenciales'))
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create')
    })
  })

  it('handles error when sensor registration fails', async () => {
    vi.mocked(httpSensorsRepository.create).mockRejectedValue(new Error('Sensor fail'))
    
    render(<ProjectDetailPage />)
    const row = screen.getByText('Gateway 1')
    fireEvent.click(row)
    fireEvent.click(screen.getByText('Nuevo Sensor'))
    fireEvent.change(screen.getByPlaceholderText(/sensor_temp_01/i), { target: { value: 'S1' } })
    fireEvent.click(screen.getByText('Agregar Sensor'))
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Sensor fail')
    })
  })

  it('navigates back to projects list', () => {
    render(<ProjectDetailPage />)
    const backBtn = screen.getAllByRole('button')[0]
    fireEvent.click(backBtn)
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/projects')
  })
});
