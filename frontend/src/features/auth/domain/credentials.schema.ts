import { z } from 'zod'

/** Minimum password length accepted by backend auth endpoints. */
export const PASSWORD_MIN_LENGTH = 6

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`),
})

export const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`),
  name: z.string().min(1, 'Nombre requerido').optional(),
})

export type LoginCredentials = z.infer<typeof loginSchema>
export type RegisterCredentials = z.infer<typeof registerSchema>
