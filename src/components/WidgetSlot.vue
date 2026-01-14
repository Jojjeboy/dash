<script setup lang="ts">
import { defineAsyncComponent, computed, ref } from 'vue'
import { registry } from '@/widgets/registry'
import { useI18n } from 'vue-i18n'
import { useDashboardStore } from '@/stores/dashboard'

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

const dynamicTitles = ref<Record<string, string>>({})

const handleTitleUpdate = (id: string, newTitle: string) => {
  dynamicTitles.value[id] = newTitle
}

const getWidgetName = (id: string) => {
  // Return dynamic title if available, otherwise fallback to registry title
  return dynamicTitles.value[id] || registry.get(id)?.title || ''
}

const widgetConfig = computed(() => {
  const id = props.widgetId as string | null
  return {
    id,
    component: getWidgetComponent(id),
    name: id ? getWidgetName(id) : ''
  }
})

const showChooser = ref(false)
const availableWidgets = computed(() => registry.getAll())

const selectWidget = (newId: string) => {
  dashboardStore.updateWidgetSlot(props.index, newId)
  showChooser.value = false
}

const getWidgetSlotText = (widgetId: string) => {
  const slot = dashboardStore.slots.find(s => s.widgetId === widgetId)
  return slot ? `Slot ${slot.index + 1}` : ''
}

</script>

<template>
  <div
    class="glass-tile flex flex-col relative group transition-all duration-500 ease-in-out overflow-hidden"
    :class="[!widgetId && 'opacity-50']"
    @mouseleave="showChooser = false"
  >
      <!-- Widget Name Display -->
      <div 
        v-if="widgetConfig.id && widgetConfig.name"
        class="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none"
      >
        <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">
          {{ widgetConfig.name }}
        </span>
      </div>

      <!-- Widget Chooser Toggle (Hidden until hover) -->
    <button 
      @click.stop="showChooser = true"
      class="absolute bottom-4 left-4 z-40 p-2 rounded-full bg-black/20 hover:bg-black/50 text-[var(--dash-text-muted)] hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

      <!-- Widget Chooser Overlay -->
      <div v-if="showChooser" class="absolute inset-0 z-50 bg-[#1a1c1e]/95 backdrop-blur-md flex flex-col p-2 overflow-y-auto">
        <div class="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
           <span class="text-[10px] uppercase font-bold tracking-wider text-[var(--dash-text-muted)]">Välj Widget</span>
           <button @click="showChooser = false" class="text-white/50 hover:text-white">✕</button>
        </div>
        <div class="grid grid-cols-1 gap-1">
           <button 
             @click="selectWidget('')"
             class="px-3 py-2 rounded-lg text-left text-xs font-bold transition-colors"
             :class="[!widgetConfig.id ? 'bg-white/20 text-white' : 'hover:bg-white/5 text-[var(--dash-text-muted)]']"
           >
             {{ t('empty') }}
           </button>
           <button 
              v-for="w in availableWidgets" 
              :key="w.id"
              @click="selectWidget(w.id)"
              class="px-3 py-2 rounded-lg flex items-center justify-between text-xs font-bold transition-colors"
              :class="[widgetConfig.id === w.id ? 'bg-white text-[#1a1c1e]' : 'hover:bg-white/10 text-white']"
            >
              <span>{{ w.title }}</span>
              <span v-if="getWidgetSlotText(w.id)" class="text-[8px] uppercase font-bold opacity-40 ml-2">
                {{ getWidgetSlotText(w.id) }}
              </span>
            </button>
        </div>
      </div>

      <!-- Slot Content -->
      <div 
        class="h-full w-full flex items-center justify-center overflow-hidden"
        :class="[widgetConfig.name ? 'pt-7' : '']"
      >
        <component
          :is="widgetConfig.component"
          v-if="widgetConfig.component && widgetConfig.id"
          class="w-full h-full"
          @update-title="(title: string) => handleTitleUpdate(widgetConfig.id!, title)"
        />

        <!-- Empty State -->
        <div v-else class="text-center opacity-20 group-hover:opacity-40 transition-opacity">
          <span class="text-2xl font-black text-[var(--dash-text)] opacity-20 uppercase tracking-tighter select-none">
            {{ t('slot') }} {{ index + 1 }}
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

