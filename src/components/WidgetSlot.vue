<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'
import { registry } from '@/widgets/registry'

interface Props {
  widgetId: string | null
  index: number
}

const props = defineProps<Props>()

const widgetDef = computed(() => {
  if (!props.widgetId) return null
  return registry.get(props.widgetId)
})

const WidgetComponent = computed(() => {
  if (!widgetDef.value) return null
  return defineAsyncComponent(widgetDef.value.component)
})
</script>

<template>
  <div
    class="glass-tile flex items-center justify-center relative group transition-all duration-500 ease-in-out"
    :class="[!widgetId && 'opacity-50']"
  >
    <!-- Slot Content -->
    <div class="h-full w-full flex items-center justify-center overflow-hidden">
      <component
        :is="WidgetComponent"
        v-if="WidgetComponent"
        class="w-full h-full"
      />

      <!-- Empty State -->
      <div v-else class="text-center opacity-20 group-hover:opacity-40 transition-opacity">
        <span class="text-2xl font-black text-[var(--dash-text)] opacity-20 uppercase tracking-tighter select-none">
          Slot {{ index + 1 }}
        </span>
      </div>
    </div>

    <!-- Hover Indicator -->
    <div
      v-if="widgetId"
      class="absolute inset-0 border-2 border-white/0 group-hover:border-[var(--dash-tile-border)] rounded-2xl transition-colors pointer-events-none"
    ></div>
  </div>
</template>
