import { apiClient, API_ENDPOINTS } from '@/shared/infrastructure/http'
import type {
  LoginCredentials,
  RegisterCredentials,
} from '../domain/credentials.schema'

export interface AuthResponse {
  access_token: string
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  image: string | null
  hasPassword: boolean
}

export interface UpdateProfileInput {
  name?: string
  currentPassword?: string
  newPassword?: string
}

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResponse>
  register(credentials: RegisterCredentials): Promise<AuthResponse>
  getProfile(): Promise<UserProfile>
  updateProfile(data: UpdateProfileInput): Promise<AuthResponse>
  deleteProfile(): Promise<void>
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

  getProfile: () =>
    apiClient<UserProfile>(API_ENDPOINTS.AUTH.PROFILE),

  updateProfile: (data) =>
    apiClient<AuthResponse>(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProfile: () =>
    apiClient<void>(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'DELETE',
    }),
}
