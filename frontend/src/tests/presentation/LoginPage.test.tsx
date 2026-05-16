import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginPage } from '@/features/auth/presentation/pages/LoginPage'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('@/components/auth/ParticleNetwork', () => ({
  ParticleNetwork: () => <div data-testid="particles">Particles</div>,
}))

vi.mock('@/components/auth/AuthForm', () => ({
  AuthForm: () => <div data-testid="auth-form">Auth Form</div>,
}))

describe('LoginPage', () => {
  it('renders correctly with particles and auth form', () => {
    render(<LoginPage />)
    
    expect(screen.getByText(/IoT Analytics/i)).toBeDefined()
    expect(screen.getByText(/Platform/i)).toBeDefined()
    expect(screen.getByTestId('particles')).toBeDefined()
    expect(screen.getByTestId('auth-form')).toBeDefined()
  })
})
