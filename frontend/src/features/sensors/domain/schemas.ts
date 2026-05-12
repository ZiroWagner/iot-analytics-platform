import { z } from 'zod'

export const createSensorFormSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  /**
   * Free-form comma-separated tags from the UI. Turned into structured
   * metadata via {@link parseSensorMetadata}.
   */
  metadata: z.string().optional(),
})

export type CreateSensorFormInput = z.infer<typeof createSensorFormSchema>
