/** Curated vibrant color palette for chart series */
export const CHART_COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f97316', // orange
  '#14b8a6', // teal
  '#e11d48', // rose
  '#84cc16', // lime
] as const

/** Get the next color from the palette based on index */
export function getSeriesColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}

/** Semi-transparent version for area fills */
export function getAreaFillColor(hex: string): string {
  return `${hex}20`
}
