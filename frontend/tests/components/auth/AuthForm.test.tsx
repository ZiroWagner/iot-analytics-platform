import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'

const mockRouterPush = vi.fn()
const mockLoginUseCase = vi.fn()
const mockRegisterUseCase = vi.fn()

const mockLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const mockRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1),
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

vi.mock('@/features/auth', () => ({
  loginSchema: mockLoginSchema,
  registerSchema: mockRegisterSchema,
  loginUseCase: (...args: unknown[]) => mockLoginUseCase(...args),
  registerUseCase: (...args: unknown[]) => mockRegisterUseCase(...args),
}))

vi.mock('@/shared/infrastructure/http', () => ({
  getAuthUrl: (endpoint: string) => `http://localhost:3000${endpoint}`,
  API_ENDPOINTS: {
    AUTH: {
      GOOGLE: '/api/auth/google',
      GITHUB: '/api/auth/github',
    },
  },
}))

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form by default', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm')
    render(<AuthForm />)

    expect(screen.getByText('Inicia sesión para acceder a tu panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Formulario de inicio de sesión')).toBeInTheDocument()
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
  })

  it('renders email and password fields in login mode', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm')
    render(<AuthForm />)

    expect(screen.getByText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByText('Contraseña')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('m@ejemplo.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('switches to register mode when toggle is clicked', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm')
    const user = userEvent.setup()
    render(<AuthForm />)

    await user.click(screen.getByText('¿No tienes cuenta? Regístrate'))

    await waitFor(() => {
      expect(screen.getByText('Crea tu cuenta para acceder a la plataforma')).toBeInTheDocument()
      expect(screen.getByLabelText('Formulario de registro')).toBeInTheDocument()
      expect(screen.getByText('Crear cuenta')).toBeInTheDocument()
    })

    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument()
  })

  it('calls loginUseCase on login form submit', async () => {
    mockLoginUseCase.mockResolvedValue(undefined)
    const { AuthForm } = await import('@/components/auth/AuthForm')
    const user = userEvent.setup()
    render(<AuthForm />)

    await user.type(screen.getByPlaceholderText('m@ejemplo.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

    await user.click(screen.getByText('Iniciar sesión'))

    await waitFor(() => {
      expect(mockLoginUseCase).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
  })

  it('calls registerUseCase on register form submit', async () => {
    mockRegisterUseCase.mockResolvedValue(undefined)
    const { AuthForm } = await import('@/components/auth/AuthForm')
    const user = userEvent.setup()
    render(<AuthForm />)

    await user.click(screen.getByText('¿No tienes cuenta? Regístrate'))

    await waitFor(() => {
      expect(screen.getByText('Crear cuenta')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Tu nombre'), 'Test User')
    await user.type(screen.getByPlaceholderText('m@ejemplo.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

    await user.click(screen.getByText('Crear cuenta'))

    await waitFor(() => {
      expect(mockRegisterUseCase).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })
    })

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
  })

  it('displays error message on failed login', async () => {
    mockLoginUseCase.mockRejectedValue(new Error('Credenciales inválidas'))
    const { AuthForm } = await import('@/components/auth/AuthForm')
    const user = userEvent.setup()
    render(<AuthForm />)

    await user.type(screen.getByPlaceholderText('m@ejemplo.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

    await user.click(screen.getByText('Iniciar sesión'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas')
    })
  })

  it('renders OAuth buttons for Google and GitHub', async () => {
    const { AuthForm } = await import('@/components/auth/AuthForm')
    render(<AuthForm />)

    const socialLinks = screen.getAllByRole('link')
    const googleLink = socialLinks.find(l => l.getAttribute('href')?.includes('google'))
    const githubLink = socialLinks.find(l => l.getAttribute('href')?.includes('github'))

    expect(googleLink).toBeInTheDocument()
    expect(githubLink).toBeInTheDocument()
    expect(googleLink).toHaveAttribute('href', 'http://localhost:3000/api/auth/google')
    expect(githubLink).toHaveAttribute('href', 'http://localhost:3000/api/auth/github')
  })
})
