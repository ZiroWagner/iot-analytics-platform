import { WidgetPlugin } from './registry.types'
import chartsPlugin from '../presentation/plugins/charts.plugin'
import gaugePlugin from '../presentation/plugins/gauge.plugin'
import kpiCardPlugin from '../presentation/plugins/kpi-card.plugin'
import heatmapPlugin from '../presentation/plugins/heatmap.plugin'
import scatterPlugin from '../presentation/plugins/scatter.plugin'

class WidgetRegistry {
  private plugins = new Map<string, WidgetPlugin>()

  constructor() {
    this.register(chartsPlugin)
    this.register(gaugePlugin)
    this.register(kpiCardPlugin)
    this.register(heatmapPlugin)
    this.register(scatterPlugin)
  }

  /**
   * Registers a new widget plugin.
   */
  register(plugin: WidgetPlugin): void {
    if (this.plugins.has(plugin.type)) {
      console.warn(`Widget plugin of type "${plugin.type}" is already registered and will be overwritten.`)
    }
    this.plugins.set(plugin.type, plugin)
  }

  /**
   * Retrieves a registered widget plugin by its type.
   */
  get(type: string): WidgetPlugin | undefined {
    return this.plugins.get(type)
  }

  /**
   * Returns all registered widget plugins.
   */
  getAll(): WidgetPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Clears all registered plugins (primarily for testing purposes).
   */
  clear(): void {
    this.plugins.clear()
  }
}

export const widgetRegistry = new WidgetRegistry()
export default widgetRegistry

