<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useGNews } from '@/composables/useGNews'
import { useScreenHealth } from '@/composables/useScreenHealth'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits(['update-title'])
const widgetRef = ref<HTMLElement | null>(null)

// Screen Health Integration
useScreenHealth({
  widgetId: 'gnews',
  oledRisk: 'low',
  supportedActions: ['microMotion'],
  onAction: async (action) => {
    if (action === 'microMotion' && widgetRef.value) {
      const el = widgetRef.value
      const x = (Math.random() * 2 - 1).toFixed(1)
      const y = (Math.random() * 2 - 1).toFixed(1)
      el.style.transform = `translate(${x}px, ${y}px)`
    }
  }
})

onMounted(() => {
  emit('update-title', 'Nyheter')
})

const dashboardStore = useDashboardStore()
const newsConfig = computed(() => dashboardStore.config?.newsConfig || {
  maxItems: 10,
  refreshIntervalMinutes: 30,
  defaultCategory: 'general'
})

// Current category for the tabs (local state, defaults to config)
const activeCategory = ref(newsConfig.value.defaultCategory || 'general')

const { articles, loading, error, refresh } = useGNews({
  maxItems: computed(() => newsConfig.value.maxItems),
  refreshIntervalMinutes: computed(() => newsConfig.value.refreshIntervalMinutes),
  category: activeCategory
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

const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins} min sen`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} tim sen`
    return date.toLocaleDateString('sv-SE')
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div ref="widgetRef" class="flex flex-col h-full w-full overflow-hidden text-[var(--dash-text)] transition-transform duration-1000">
    <!-- Categories Tabs -->
    <div class="flex-none px-3 pt-6 pb-2">
      <div class="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="activeCategory = cat.id"
          class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border"
          :class="[
            activeCategory === cat.id 
              ? 'bg-[var(--dash-text)] text-[var(--dash-bg)] border-[var(--dash-text)]' 
              : 'text-[var(--dash-text-muted)] border-white/5 hover:border-white/20'
          ]"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto no-scrollbar px-3 pb-3 space-y-2">
      <!-- Loading State -->
      <div v-if="loading && articles.length === 0" class="space-y-3 animate-pulse">
        <div v-for="i in 3" :key="i" class="h-20 bg-white/5 rounded-xl"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center h-full text-center p-4">
        <ExclamationTriangleIcon class="w-8 h-8 text-amber-500/50 mb-2" />
        <p class="text-[11px] text-[var(--dash-text-muted)]">{{ error }}</p>
        <button @click="refresh" class="mt-2 text-[10px] uppercase tracking-widest font-bold text-[var(--dash-text)] opacity-50 hover:opacity-100">
          Försök igen
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="articles.length === 0" class="flex flex-col items-center justify-center h-full text-[var(--dash-text-muted)] opacity-50">
        <p class="text-[11px]">Inga nyheter hittades</p>
      </div>

      <!-- Articles List -->
      <div v-else class="space-y-1.5">
        <div 
          v-for="article in articles" 
          :key="article.url"
          class="flex flex-col p-2 bg-white/5 rounded-xl border border-white/0 hover:border-white/10 transition-all cursor-default"
        >
          <div class="flex justify-between items-start mb-0.5">
            <span class="text-[9px] font-black uppercase tracking-tighter text-[var(--dash-accent)] opacity-80">
              {{ article.source.name }}
            </span>
            <span class="text-[9px] text-[var(--dash-text-muted)] font-medium">
              {{ formatTime(article.publishedAt) }}
            </span>
          </div>
          <h3 class="text-[13px] font-bold leading-tight line-clamp-2 mb-0.5">
            {{ article.title }}
          </h3>
          <p class="text-[11px] leading-tight text-[var(--dash-text-muted)] line-clamp-2">
            {{ article.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Static Header (Floating/Absolute) -->
    <div class="absolute top-2 right-3 flex space-x-2">
      <button 
        @click="refresh" 
        class="text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-all p-1"
        :class="{ 'animate-spin': loading }"
      >
        <ArrowPathIcon class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
