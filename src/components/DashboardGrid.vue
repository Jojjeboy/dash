<script setup lang="ts">
import { computed } from 'vue'
import WidgetSlot from './WidgetSlot.vue'
import { registry } from '@/widgets/registry'

interface Props {
  layoutMode: 4 | 6 | 8
  slots: { index: number; widgetId: string | string[] | null }[]
}

const props = defineProps<Props>()

const gridClasses = computed(() => {
  switch (props.layoutMode) {
    case 4:
      return 'grid-cols-2 auto-rows-fr'
    case 6:
      return 'grid-cols-3 auto-rows-fr'
    case 8:
      return 'grid-cols-4 auto-rows-fr'
    default:
      return 'grid-cols-3 auto-rows-fr'
  }
})

// Determine if a widget should span 2 columns
const getWidgetSpan = (widgetId: string | string[] | null) => {
  if (!widgetId || Array.isArray(widgetId)) return 1
  const widget = registry.get(widgetId)
  return widget?.size === 'double' ? 2 : 1
}
</script>

<template>
  <div class="h-full w-full p-2 md:p-3 lg:p-4 overflow-hidden">
    <div
      class="grid gap-2 md:gap-3 lg:gap-4 h-full w-full"
      :class="gridClasses"
      :style="{ gridTemplateRows: `repeat(${Math.ceil(props.slots.length / (props.layoutMode === 4 ? 2 : props.layoutMode === 6 ? 3 : 4))}, minmax(0, 1fr))` }"
    >
      <WidgetSlot
        v-for="slot in props.slots.slice(0, props.layoutMode)"
        :key="slot.index"
        :widget-id="slot.widgetId"
        :index="slot.index"
        class="min-h-0"
        :style="{ gridColumn: `span ${getWidgetSpan(slot.widgetId)}` }"
      />
    </div>
  </div>
</template>
