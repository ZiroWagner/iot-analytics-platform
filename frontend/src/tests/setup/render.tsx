import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <>
        {children}
      </>
    )
  }
  return render(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'

export { renderWithProviders as render }
