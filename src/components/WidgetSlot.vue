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

      <!-- Settings/Cog Button (Hover Only) -->
      <button 
        @click="showChooser = !showChooser"
        class="absolute top-2 right-2 z-40 p-1.5 rounded-lg bg-black/40 text-white/50 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
          <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.047 7.047 0 010-2.228l-1.267-1.113a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
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
             class="px-3 py-2 rounded-lg text-left text-xs font-bold transition-colors"
             :class="[widgetConfig.id === w.id ? 'bg-white text-[#1a1c1e]' : 'hover:bg-white/10 text-white']"
           >
             {{ w.title }}
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

