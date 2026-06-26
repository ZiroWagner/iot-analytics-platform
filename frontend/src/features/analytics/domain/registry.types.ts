import React from 'react'
import type { AvailableMetric, ChartWidgetConfig } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WidgetPluginProps<C = Record<string, any>, D = unknown[]> {
  config: C
  data: D
  isLive: boolean
  loading: boolean
  trendDirections?: Record<string, 'up' | 'down' | 'flat'>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WidgetConfigFormProps<C = Record<string, any>> {
  config: C
  onChange: (newConfig: C) => void
  availableMetrics: AvailableMetric[]
}

/**
 * Definition of an individual widget type plugin.
 */
export interface WidgetPlugin<C = Record<string, unknown>, D = unknown[]> {
  type: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  defaultConfig: Omit<ChartWidgetConfig, 'id' | 'title' | 'series'> & { type: string; [key: string]: any } // eslint-disable-line @typescript-eslint/no-explicit-any

  // Dynamic form editor for this widget's settings
  ConfigFormComponent: React.ComponentType<WidgetConfigFormProps<C>>

  // Renderer of the widget visualization
  RenderComponent: React.ComponentType<WidgetPluginProps<C, D>>

  // Optional: custom data transformer
  transformData?: (rawData: unknown[], config: C) => D
}
