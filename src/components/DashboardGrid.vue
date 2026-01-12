<script setup lang="ts">
import { computed } from 'vue'
import WidgetSlot from './WidgetSlot.vue'
import { registry } from '@/widgets/registry'

interface Props {
  layoutMode: 4 | 6 | 8
  slots: { index: number; widgetId: string | null }[]
}

const props = defineProps<Props>()

const gridClasses = computed(() => {
  switch (props.layoutMode) {
    case 4:
      return 'grid-cols-2 grid-rows-2'
    case 6:
      return 'grid-cols-3 grid-rows-2'
    case 8:
      return 'grid-cols-4 grid-rows-2'
    default:
      return 'grid-cols-3 grid-rows-2'
  }
})

// Determine if a widget should span 2 columns
const getWidgetSpan = (widgetId: string | null) => {
  if (!widgetId) return 1
  const widget = registry.get(widgetId)
  return widget?.size === 'double' ? 2 : 1
}
</script>

<template>
  <div class="h-full w-full p-4 md:p-6 lg:p-8 overflow-hidden">
    <div
      class="grid gap-4 md:gap-6 lg:gap-8 h-full w-full transition-all duration-500 ease-in-out"
      :class="gridClasses"
    >
      <WidgetSlot
        v-for="slot in props.slots"
        :key="slot.index"
        :widget-id="slot.widgetId"
        :index="slot.index"
        :style="{ gridColumn: `span ${getWidgetSpan(slot.widgetId)}` }"
      />
    </div>
  </div>
</template>
