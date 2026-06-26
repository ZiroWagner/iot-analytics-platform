import React from 'react'
import type { AvailableMetric, ChartWidgetConfig } from './types'

export interface WidgetPluginProps<C = any, D = any> {
  config: C
  data: D
  isLive: boolean
  loading: boolean
  trendDirections?: Record<string, 'up' | 'down' | 'flat'>
}

export interface WidgetConfigFormProps<C = any> {
  config: C
  onChange: (newConfig: C) => void
  availableMetrics: AvailableMetric[]
}

/**
 * Definition of an individual widget type plugin.
 */
export interface WidgetPlugin<C = any, D = any> {
  type: string
  name: string
  description: string
  icon: React.ComponentType<any>
  defaultConfig: Omit<ChartWidgetConfig, 'id' | 'title' | 'series'> & { type: string; [key: string]: any }
  
  // Dynamic form editor for this widget's settings
  ConfigFormComponent: React.ComponentType<WidgetConfigFormProps<C>>
  
  // Renderer of the widget visualization
  RenderComponent: React.ComponentType<WidgetPluginProps<C, D>>

  // Optional: custom data transformer
  transformData?: (rawData: any[], config: C) => D
}
