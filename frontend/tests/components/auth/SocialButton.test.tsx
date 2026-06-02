import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SocialButton } from '@/components/auth/SocialButton'

describe('SocialButton', () => {
  const googleIcon = <svg data-testid="google-icon"><path /></svg>
  const githubIcon = <svg data-testid="github-icon"><path /></svg>

  it('renders a link with the provided href', () => {
    render(<SocialButton href="/auth/google" provider="google" icon={googleIcon} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/auth/google')
  })

  it('renders a button inside the link', () => {
    render(<SocialButton href="/auth/google" provider="google" icon={googleIcon} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders the provided icon', () => {
    render(<SocialButton href="/auth/google" provider="google" icon={googleIcon} />)
    expect(screen.getByTestId('google-icon')).toBeInTheDocument()
  })

  it('shows "Google" label on hover for google provider', () => {
    render(<SocialButton href="/auth/google" provider="google" icon={googleIcon} />)
    expect(screen.getByText('Google')).toBeInTheDocument()
  })

  it('shows "GitHub" label on hover for github provider', () => {
    render(<SocialButton href="/auth/github" provider="github" icon={githubIcon} />)
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })
})
