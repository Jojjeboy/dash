<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

const newsConfig = computed(() => dashboardStore.config?.newsConfig || {
  maxItems: 10,
  refreshIntervalMinutes: 30,
  defaultCategory: 'general'
})

const maxItems = computed({
  get: () => newsConfig.value.maxItems,
  set: (val) => dashboardStore.updateNewsConfig({ maxItems: val })
})

const refreshInterval = computed({
  get: () => newsConfig.value.refreshIntervalMinutes,
  set: (val) => dashboardStore.updateNewsConfig({ refreshIntervalMinutes: val })
})

const defaultCategory = computed({
  get: () => newsConfig.value.defaultCategory,
  set: (val) => dashboardStore.updateNewsConfig({ defaultCategory: val })
})

const categories = [
  { id: 'general', name: 'Alla' },
  { id: 'world', name: 'Världen' },
  { id: 'nation', name: 'Sverige' },
  { id: 'business', name: 'Ekonomi' },
  { id: 'technology', name: 'Teknik' },
  { id: 'entertainment', name: 'Nöje' },
  { id: 'sports', name: 'Sport' },
  { id: 'science', name: 'Vetenskap' },
  { id: 'health', name: 'Hälsa' }
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-[10px] uppercase tracking-widest font-bold text-[var(--dash-text-muted)] mb-1.5">
        Standardsortering
      </label>
      <select 
        v-model="defaultCategory"
        class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--dash-text)] focus:outline-none focus:border-[var(--dash-accent)] transition-colors"
      >
        <option v-for="cat in categories" :key="cat.id" :value="cat.id" class="bg-[#1a1a1a]">
          {{ cat.name }}
        </option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-[10px] uppercase tracking-widest font-bold text-[var(--dash-text-muted)] mb-1.5">
          Antal artiklar
        </label>
        <input 
          type="number" 
          v-model.number="maxItems" 
          min="1" 
          max="50"
          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--dash-text)] focus:outline-none focus:border-[var(--dash-accent)] transition-colors"
        />
      </div>
      <div>
        <label class="block text-[10px] uppercase tracking-widest font-bold text-[var(--dash-text-muted)] mb-1.5">
          Uppdatera (min)
        </label>
        <input 
          type="number" 
          v-model.number="refreshInterval" 
          min="1" 
          max="1440"
          class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--dash-text)] focus:outline-none focus:border-[var(--dash-accent)] transition-colors"
        />
      </div>
    </div>
  </div>
</template>
