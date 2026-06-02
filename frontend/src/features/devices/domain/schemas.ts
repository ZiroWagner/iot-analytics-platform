import { z } from 'zod'

export const createDeviceSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  type: z.string().min(2, 'Tipo (Ej. ESP32, Raspberry)'),
  macAddress: z.string().optional(),
})

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>
