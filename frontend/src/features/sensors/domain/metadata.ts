/**
 * Parses the comma-separated tag input from the sensor creation form into the
 * structured metadata object expected by the backend.
 *
 * Empty / whitespace-only entries are discarded; the resulting object is
 * always a plain `Record<string, unknown>` so it is safe to `JSON.stringify`.
 */
export function parseSensorMetadata(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {}
  const tags = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (tags.length === 0) return {}
  return { tags }
}

export function formatSensorMetadata(metadata: Record<string, unknown> | undefined): string {
  if (!metadata || !Array.isArray(metadata.tags)) return ''
  return metadata.tags.join(', ')
}
