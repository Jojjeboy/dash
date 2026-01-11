import type { Component } from 'vue'

export interface WidgetDefinition {
  id: string
  title: string
  description?: string
  icon?: string
  component: () => Promise<Component>
  settingsComponent?: () => Promise<Component>
  defaultSize?: 'small' | 'medium' | 'large'
}

class WidgetRegistry {
  private widgets = new Map<string, WidgetDefinition>()

  register(definition: WidgetDefinition) {
    this.widgets.set(definition.id, definition)
    console.log(`[WidgetRegistry] Registered: ${definition.id}`)
  }

  get(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id)
  }

  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values())
  }
}

export const registry = new WidgetRegistry()

registry.register({
  id: 'commute_widget',
  title: 'Trafik - Mariaplan',
  description: 'Avgångar från Mariaplan (Västtrafik)',
  component: () => import('./components/CommuteWidget.vue'),
  defaultSize: 'medium'
})
