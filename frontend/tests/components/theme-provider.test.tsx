import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-theme-provider">{children}</div>
  ),
}))

describe('ThemeProvider', () => {
  it('renders children inside the theme provider', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Hello</div>
      </ThemeProvider>,
    )
    expect(screen.getByTestId('mock-theme-provider')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  it('forwards additional props to NextThemesProvider', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <span>content</span>
      </ThemeProvider>,
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})
