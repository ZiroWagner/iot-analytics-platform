import type { HttpHandler } from 'msw'

/**
 * Default MSW handlers shared across the test suite.
 * Feature-specific handlers should live next to each feature's tests and be
 * registered on demand via `server.use(...)`.
 */
export const handlers: HttpHandler[] = []
