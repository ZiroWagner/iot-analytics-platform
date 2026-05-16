import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
// If you use React Query or other global providers, import them here.
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: false,
//     },
//   },
// })

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <>
        {/* <QueryClientProvider client={queryClient}> */}
        {children}
        {/* </QueryClientProvider> */}
      </>
    )
  }
  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { renderWithProviders as render }
