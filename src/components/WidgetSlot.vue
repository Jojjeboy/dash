<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'
import { registry } from '@/widgets/registry'
import { useDashboardStore } from '@/stores/dashboard'
import { useI18n } from 'vue-i18n'

interface Props {
  widgetId: string | string[] | null
  index: number
}

const props = defineProps<Props>()
const dashboardStore = useDashboardStore()
const { t } = useI18n()

// Helper to get component for a widget ID
const getWidgetComponent = (id: string | null) => {
  if (!id) return null
  const def = registry.get(id)
  return def ? defineAsyncComponent(def.component) : null
}

const getWidgetName = (id: string, subIndex?: number) => {
  const key = subIndex !== undefined ? `${props.index}-${subIndex}` : `${props.index}`
  // Get custom name from store, or fall back to default widget title
  const customName = dashboardStore.config?.widgetNames?.[key]
  if (customName) return customName
  return registry.get(id)?.title || ''
}

const isSplit = computed(() => Array.isArray(props.widgetId))
const widgetIds = computed(() => {
  if (!isSplit.value) return [props.widgetId as string | null]
  const ids = (props.widgetId as string[])
  // Only allow max 2 items
  return ids.slice(0, 2)
})

const widgetConfigs = computed(() => {
  return widgetIds.value.map((id, subIdx) => ({
    id,
    component: getWidgetComponent(id),
    name: id ? getWidgetName(id, isSplit.value ? subIdx : undefined) : ''
  }))
})
</script>

<template>
  <div
    class="glass-tile flex flex-col relative group transition-all duration-500 ease-in-out overflow-hidden"
    :class="[!widgetId && 'opacity-50']"
  >
    <div 
      v-for="(config, subIdx) in widgetConfigs" 
      :key="subIdx"
      class="relative flex-1 flex items-center justify-center overflow-hidden w-full border-white/5 min-h-0"
      :class="[
        isSplit && subIdx === 0 && 'border-b',
        isSplit && 'h-1/2',
        !config.id && 'opacity-50'
      ]"
    >
      <!-- Widget Name Display -->
      <div 
        v-if="config.id && config.name"
        class="absolute top-2 left-0 right-0 text-center z-10 pointer-events-none"
      >
        <span class="text-[13px] uppercase tracking-[0.15em] text-[var(--dash-text)] font-extrabold">
          {{ config.name }}
        </span>
      </div>

      <!-- Slot Content -->
      <div class="h-full w-full flex items-center justify-center overflow-hidden">
        <component
          :is="config.component"
          v-if="config.component"
          class="w-full h-full"
        />

        <!-- Empty State -->
        <div v-else class="text-center opacity-20 group-hover:opacity-40 transition-opacity">
          <span class="text-2xl font-black text-[var(--dash-text)] opacity-20 uppercase tracking-tighter select-none">
            {{ t('slot') }} {{ index + 1 }}{{ isSplit ? `.${subIdx + 1}` : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Hover Indicator -->
    <div
      v-if="widgetId"
      class="absolute inset-0 border-2 border-white/0 group-hover:border-[var(--dash-tile-border)] rounded-2xl transition-colors pointer-events-none"
    ></div>
  </div>
</template>
