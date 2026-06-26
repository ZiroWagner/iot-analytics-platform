import { describe, expect, it, beforeEach } from 'vitest'
import { widgetRegistry } from '@/features/analytics/domain/widget-registry'
import { WidgetPlugin } from '@/features/analytics/domain/registry.types'
import React from 'react'

const MockIcon = () => React.createElement('div', null, 'Icon')
const MockForm = () => React.createElement('div', null, 'Form')
const MockRender = () => React.createElement('div', null, 'Render')

const dummyPlugin: WidgetPlugin = {
  type: 'mock-widget',
  name: 'Mock Widget',
  description: 'A mock widget for testing',
  icon: MockIcon,
  defaultConfig: {
    size: 'md',
    timeRange: '15m',
    showGrid: true,
    showLegend: true,
    showReferenceLines: false,
    yAxisAutoRange: true,
    refreshInterval: 3000,
    type: 'mock-widget',
  },
  ConfigFormComponent: MockForm,
  RenderComponent: MockRender,
}

describe('widget-registry', () => {
  beforeEach(() => {
    widgetRegistry.clear()
  })

  it('starts with an empty registry', () => {
    expect(widgetRegistry.getAll()).toHaveLength(0)
    expect(widgetRegistry.get('any-type')).toBeUndefined()
  })

  it('can register a plugin and retrieve it', () => {
    widgetRegistry.register(dummyPlugin)
    expect(widgetRegistry.getAll()).toHaveLength(1)
    
    const retrieved = widgetRegistry.get('mock-widget')
    expect(retrieved).toBeDefined()
    expect(retrieved?.name).toBe('Mock Widget')
  })

  it('can register multiple plugins and list all', () => {
    widgetRegistry.register(dummyPlugin)
    
    const anotherPlugin = {
      ...dummyPlugin,
      type: 'another-widget',
      name: 'Another Widget',
    }
    
    widgetRegistry.register(anotherPlugin)
    expect(widgetRegistry.getAll()).toHaveLength(2)
  })
})
