import type { Component } from 'vue'

export interface WidgetDefinition {
  id: string
  title: string
  description?: string
  icon?: string
  component: () => Promise<Component>
  settingsComponent?: () => Promise<Component>
  defaultSize?: 'small' | 'medium' | 'large'
  size?: 'single' | 'double' // Number of grid slots the widget occupies
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
  defaultSize: 'medium',
  size: 'single'
})

registry.register({
  id: 'calendar_widget',
  title: 'Skolschema',
  description: 'Dagligt skolschema från kalender',
  component: () => import('./components/CalendarWidget.vue'),
  defaultSize: 'medium',
  size: 'single'
})
