<script setup lang="ts">
import { ref, defineAsyncComponent, computed } from 'vue'
import { registry } from '@/widgets/registry'

interface Props {
  widgetId: string | null
  index: number
}

const props = defineProps<Props>()
const isExpanded = ref(false)

const widgetDef = computed(() => {
  if (!props.widgetId) return null
  return registry.get(props.widgetId)
})

const WidgetComponent = computed(() => {
  if (!widgetDef.value) return null
  return defineAsyncComponent(widgetDef.value.component)
})

const toggleExpand = () => {
  if (widgetDef.value) {
    isExpanded.value = !isExpanded.value
  }
}
</script>

<template>
  <div
    class="glass-tile flex items-center justify-center relative group transition-all duration-500 ease-in-out"
    :class="[
      isExpanded ? 'fixed inset-4 z-[100] scale-100' : 'relative scale-100',
      !widgetId && 'opacity-50'
    ]"
    @click="toggleExpand"
  >
    <!-- Expanded Close Button -->
    <button
      v-if="isExpanded"
      @click.stop="toggleExpand"
      class="absolute top-6 right-6 p-4 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-colors z-[110]"
    >
      <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Slot Content -->
    <div class="h-full w-full flex items-center justify-center overflow-hidden">
      <component
        :is="WidgetComponent"
        v-if="WidgetComponent"
        class="w-full h-full"
        :is-expanded="isExpanded"
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
      v-if="widgetId && !isExpanded"
      class="absolute inset-0 border-2 border-white/0 group-hover:border-[var(--dash-tile-border)] rounded-2xl transition-colors pointer-events-none"
    ></div>
  </div>

  <!-- Overlay for Expanded Mode -->
  <div
    v-if="isExpanded"
    class="fixed inset-0 bg-black/60 backdrop-blur-xl z-[90] transition-opacity duration-500"
    @click="toggleExpand"
  ></div>
</template>
