import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { OAuthCallbackPage } from '@/features/auth/presentation/pages/OAuthCallbackPage'
import { useRouter, useSearchParams } from 'next/navigation'
import { handleOAuthCallbackUseCase } from '@/features/auth/application'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('@/features/auth/application', () => ({
  handleOAuthCallbackUseCase: vi.fn(),
}))

describe('OAuthCallbackPage', () => {
  const mockRouter = { push: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.useFakeTimers()
  })

  it('redirects to dashboard if token is valid', async () => {
    const mockParams = new URLSearchParams('token=valid-token')
    vi.mocked(useSearchParams).mockReturnValue(mockParams as any)
    vi.mocked(handleOAuthCallbackUseCase).mockReturnValue(true)

    render(<OAuthCallbackPage />)
    
    expect(handleOAuthCallbackUseCase).toHaveBeenCalledWith('valid-token')
    
    vi.advanceTimersByTime(501)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to login if token is missing or invalid', async () => {
    const mockParams = new URLSearchParams('')
    vi.mocked(useSearchParams).mockReturnValue(mockParams as any)
    vi.mocked(handleOAuthCallbackUseCase).mockReturnValue(false)

    render(<OAuthCallbackPage />)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('renders authenticating state', () => {
    const mockParams = new URLSearchParams('token=any')
    vi.mocked(useSearchParams).mockReturnValue(mockParams as any)
    
    render(<OAuthCallbackPage />)
    expect(screen.getByText('Autenticando...')).toBeDefined()
    expect(screen.getByText('Validando tus credenciales de acceso.')).toBeDefined()
  })
})
