import { tokenStorage } from '@/shared/infrastructure/http'
import { loginSchema } from '../../domain/credentials.schema'
import type { AuthRepository } from '../../infrastructure/auth.repository'
import { httpAuthRepository } from '../../infrastructure/auth.repository'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginDeps {
  repository?: AuthRepository
  storage?: Pick<typeof tokenStorage, 'set'>
}

/**
 * Validates credentials, authenticates against the backend and persists the
 * resulting access token. Throws when validation fails or the API rejects
 * the request.
 */
export async function loginUseCase(
  input: LoginInput,
  deps: LoginDeps = {},
): Promise<{ token: string }> {
  const credentials = loginSchema.parse(input)
  const repository = deps.repository ?? httpAuthRepository
  const storage = deps.storage ?? tokenStorage

  const { access_token } = await repository.login(credentials)
  if (!access_token) {
    throw new Error('No se recibió el token de acceso')
  }

  storage.set(access_token)
  return { token: access_token }
}
