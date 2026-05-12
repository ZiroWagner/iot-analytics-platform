import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(50, 'El nombre no puede tener más de 50 caracteres.'),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
