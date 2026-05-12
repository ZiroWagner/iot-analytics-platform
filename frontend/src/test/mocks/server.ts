import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * MSW server used across tests. Feature-level test files can override or add
 * handlers via `server.use(...)`.
 */
export const server = setupServer(...handlers)
