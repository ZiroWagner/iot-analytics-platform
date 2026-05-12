import { apiClient, API_ENDPOINTS } from '@/shared/infrastructure/http'
import type {
  LoginCredentials,
  RegisterCredentials,
} from '../domain/credentials.schema'

export interface AuthResponse {
  access_token: string
}

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResponse>
  register(credentials: RegisterCredentials): Promise<AuthResponse>
}

/**
 * HTTP implementation of {@link AuthRepository}. Only concerned with issuing
 * requests; validation and token persistence live in application use cases.
 */
export const httpAuthRepository: AuthRepository = {
  login: (credentials) =>
    apiClient<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (credentials) =>
    apiClient<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
}
