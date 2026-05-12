import { tokenStorage } from '@/shared/infrastructure/http'
import { registerSchema } from '../../domain/credentials.schema'
import type { AuthRepository } from '../../infrastructure/auth.repository'
import { httpAuthRepository } from '../../infrastructure/auth.repository'

export interface RegisterInput {
  email: string
  password: string
  name?: string
}

export interface RegisterDeps {
  repository?: AuthRepository
  storage?: Pick<typeof tokenStorage, 'set'>
}

/**
 * Creates an account, persists the returned access token and returns it.
 * If `name` is not provided, a sensible default derived from the email local
 * part is used (mirrors the previous UI behaviour).
 */
export async function registerUseCase(
  input: RegisterInput,
  deps: RegisterDeps = {},
): Promise<{ token: string }> {
  const credentials = registerSchema.parse({
    ...input,
    name: input.name ?? input.email.split('@')[0],
  })
  const repository = deps.repository ?? httpAuthRepository
  const storage = deps.storage ?? tokenStorage

  const { access_token } = await repository.register(credentials)
  if (!access_token) {
    throw new Error('No se recibió el token de acceso')
  }

  storage.set(access_token)
  return { token: access_token }
}
