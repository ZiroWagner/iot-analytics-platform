import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { AuthForm } from '@/components/auth/AuthForm'
import { useRouter } from 'next/navigation'
import { loginUseCase, registerUseCase } from '@/features/auth'


// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/features/auth', async () => {
  const { z } = await vi.importActual<typeof import('zod')>('zod')
  return {
    loginSchema: z.object({
      email: z.email(),
      password: z.string().min(6),
    }),
    registerSchema: z.object({
      name: z.string().min(2),
      email: z.email(),
      password: z.string().min(6),
    }),
    loginUseCase: vi.fn(),
    registerUseCase: vi.fn(),
  }
})

vi.mock('@/shared/infrastructure/http', () => ({
  getAuthUrl: vi.fn((url) => `http://mock${url}`),
  API_ENDPOINTS: { AUTH: { GOOGLE: '/google', GITHUB: '/github' } },
}))

import userEvent from '@testing-library/user-event'

describe('AuthForm', () => {
  const mockRouter = { push: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>)
  })

  it('renders login form by default', () => {
    render(<AuthForm />)
    expect(screen.getByText('Inicia sesión para acceder a tu panel')).toBeDefined()
    expect(screen.queryByLabelText('Nombre')).toBeNull()
  })

  it('toggles to register mode', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)
    const toggleBtn = screen.getByText(/¿No tienes cuenta\? Regístrate/i)
    await user.click(toggleBtn)

    expect(screen.getByText('Crea tu cuenta para acceder a la plataforma')).toBeDefined()
    expect(screen.getByLabelText('Nombre')).toBeDefined()
  })

  it('submits login successfully', async () => {
    const user = userEvent.setup()
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 12 })
    vi.mocked(loginUseCase).mockResolvedValue({ token: 'fake-token' })

    render(<AuthForm />)

    await user.type(screen.getByLabelText('Correo electrónico'), email)
    await user.type(screen.getByLabelText('Contraseña'), password)

    const submitBtn = screen.getByRole('button', { name: /Iniciar sesión/i })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    await user.click(submitBtn)

    await waitFor(() => {
      expect(loginUseCase).toHaveBeenCalledWith({
        email,
        password,
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('submits registration successfully', async () => {
    const user = userEvent.setup()
    const name = faker.person.fullName()
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 12 })
    vi.mocked(registerUseCase).mockResolvedValue({ token: 'fake-token' })

    render(<AuthForm />)
    await user.click(screen.getByText(/¿No tienes cuenta\? Regístrate/i))

    await user.type(screen.getByLabelText('Nombre'), name)
    await user.type(screen.getByLabelText('Correo electrónico'), email)
    await user.type(screen.getByLabelText('Contraseña'), password)

    const submitBtn = screen.getByRole('button', { name: /Crear cuenta/i })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    await user.click(submitBtn)

    await waitFor(() => {
      expect(registerUseCase).toHaveBeenCalledWith({
        name,
        email,
        password,
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles auth error', async () => {
    const user = userEvent.setup()
    vi.mocked(loginUseCase).mockRejectedValue(new Error('Invalid credentials'))

    render(<AuthForm />)
    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'wrong-pass')

    const submitBtn = screen.getByRole('button', { name: /Iniciar sesión/i })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })
  })
});
