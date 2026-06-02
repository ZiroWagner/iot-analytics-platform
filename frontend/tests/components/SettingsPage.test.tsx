import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

const mockRouterPush = vi.fn()
const mockRouterReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockGetProfile = vi.fn()
const mockUpdateProfile = vi.fn()
const mockDeleteProfile = vi.fn()
const mockTokenSet = vi.fn()
const mockTokenClear = vi.fn()

vi.mock('@/features/auth/infrastructure/auth.repository', () => ({
  httpAuthRepository: {
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    deleteProfile: (...args: unknown[]) => mockDeleteProfile(...args),
  },
}))

vi.mock('@/shared/infrastructure/http', () => ({
  tokenStorage: {
    set: (...args: unknown[]) => mockTokenSet(...args),
    clear: (...args: unknown[]) => mockTokenClear(...args),
  },
}))

const mockProfile = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  hasPassword: true,
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetProfile.mockResolvedValue(mockProfile)
  })

  it('shows loading state initially', async () => {
    mockGetProfile.mockImplementationOnce(() => new Promise(() => {}))

    const { default: SettingsPage } = await import('@/app/dashboard/settings/page')
    render(<SettingsPage />)

    expect(screen.getByText('Ajustes del Sistema')).toBeInTheDocument()
  })

  it('loads profile and renders profile form', async () => {
    const { default: SettingsPage } = await import('@/app/dashboard/settings/page')
    render(<SettingsPage />)

    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Perfil de Usuario')).toBeInTheDocument()
  })

  it('renders delete account section', async () => {
    const { default: SettingsPage } = await import('@/app/dashboard/settings/page')
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Zona de Peligro')).toBeInTheDocument()
    })

    expect(
      screen.getByRole('button', { name: 'Eliminar Cuenta Permanentemente' }),
    ).toBeInTheDocument()
  })

  it('renders security tab for password users', async () => {
    const { default: SettingsPage } = await import('@/app/dashboard/settings/page')
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Perfil de Usuario')).toBeInTheDocument()
    })

    const securityTrigger = screen.getByText('Seguridad')
    const user = userEvent.setup()
    await user.click(securityTrigger)

    await waitFor(() => {
      expect(screen.getByText('Seguridad de la Cuenta')).toBeInTheDocument()
    })

    expect(screen.getByText('Contraseña Actual')).toBeInTheDocument()
    expect(screen.getByText('Nueva Contraseña')).toBeInTheDocument()
    expect(screen.getByText('Confirmar Contraseña')).toBeInTheDocument()
  })

  it('shows OAuth message for users without password', async () => {
    mockGetProfile.mockResolvedValue({ ...mockProfile, hasPassword: false })

    const { default: SettingsPage } = await import('@/app/dashboard/settings/page')
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Perfil de Usuario')).toBeInTheDocument()
    })

    const securityTrigger = screen.getByText('Seguridad')
    const user = userEvent.setup()
    await user.click(securityTrigger)

    await waitFor(() => {
      expect(
        screen.getByText(/autenticada mediante un proveedor externo/),
      ).toBeInTheDocument()
    })
  })

  it('redirects to login on profile fetch error', async () => {
    mockGetProfile.mockRejectedValueOnce(new Error('Unauthorized'))

    const { default: SettingsPage } = await import('@/app/dashboard/settings/page')
    render(<SettingsPage />)

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login')
    })
  })

  it('updates profile successfully', async () => {
    mockUpdateProfile.mockResolvedValue({ access_token: 'new-token' })

    const { default: SettingsPage } = await import('@/app/dashboard/settings/page')
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('Test User')
    const user = userEvent.setup()
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Name')

    const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'Updated Name' })
    })

    expect(mockTokenSet).toHaveBeenCalledWith('new-token')
    expect(toast.success).toHaveBeenCalledWith('Perfil actualizado correctamente')
  })

  it('shows delete confirmation dialog and deletes account', async () => {
    mockDeleteProfile.mockResolvedValue(undefined)

    const { default: SettingsPage } = await import('@/app/dashboard/settings/page')
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Zona de Peligro')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const deleteButton = screen.getByRole('button', {
      name: 'Eliminar Cuenta Permanentemente',
    })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Confirmar Eliminación')).toBeInTheDocument()
    })

    const confirmDelete = screen.getByRole('button', { name: 'Eliminar' })
    await user.click(confirmDelete)

    await waitFor(() => {
      expect(mockDeleteProfile).toHaveBeenCalledTimes(1)
    })

    expect(mockTokenClear).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(
      'Cuenta eliminada permanentemente',
    )
    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })
})
