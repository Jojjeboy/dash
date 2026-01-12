<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getDepartures, STATIONS, type Departure } from '@/services/vasttrafik'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const departures = ref<Departure[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedGid = ref<string>(STATIONS[0]?.gid ?? '9021014004730000') // Default: Mariaplan
let intervalId: number | null = null

const now = ref(Date.now())
const isPortrait = ref(window.innerHeight > window.innerWidth)

const selectedStation = computed(() =>
  STATIONS.find(s => s.gid === selectedGid.value) ?? STATIONS[0]
)

// Load saved station from localStorage
onMounted(() => {
  const savedGid = localStorage.getItem('dash_commute_station')
  if (savedGid && STATIONS.find(s => s.gid === savedGid)) {
    selectedGid.value = savedGid
  }

  loadData()
  // Update data every 60s
  intervalId = window.setInterval(loadData, 60000)

  // Update relative time calculation every 10s
  setInterval(() => {
    now.value = Date.now()
  }, 10000)

  // Update orientation on resize
  const handleResize = () => {
    isPortrait.value = window.innerHeight > window.innerWidth
  }
  window.addEventListener('resize', handleResize)

  // Clean up on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

// Handle station change
const changeStation = () => {
  localStorage.setItem('dash_commute_station', selectedGid.value)
  loadData()
}

// Format absolute time (HH:MM)
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

// Calculate relative time (minutes)
const getRelativeMinutes = (dateString: string) => {
  const diff = new Date(dateString).getTime() - now.value
  return Math.floor(diff / 60000)
}

const filteredDepartures = computed(() => {
  const limit = isPortrait.value ? 10 : 5 // More departures in portrait mode
  return departures.value
    .filter(dep => {
      const time = new Date(dep.estimatedTime || dep.plannedTime).getTime()
      return time > now.value // Only future departures
    })
    .slice(0, limit)
})

const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await getDepartures((selectedStation.value ?? STATIONS[0]!).gid)
    departures.value = data
    now.value = Date.now() // Update 'now' reference
  } catch (err) {
    console.error(err)
    error.value = "Failed to load departures"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col p-3 relative overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2 z-10">
      <div class="flex flex-col">
        <!-- Station Selector -->
        <select
          v-model="selectedGid"
          @change="changeStation"
          @click.stop
          class="text-[var(--dash-text)] font-bold text-base leading-none bg-transparent border-none outline-none cursor-pointer hover:text-white transition-colors w-auto"
        >
          <option
            v-for="station in STATIONS"
            :key="station.gid"
            :value="station.gid"
            class="bg-[var(--dash-bg)] text-[var(--dash-text)]"
          >
            {{ station.name }}
          </option>
        </select>
        <span class="text-[var(--dash-text-muted)] text-[10px] uppercase tracking-wider font-bold mt-0.5">{{ $t('departures') }}</span>
      </div>
      <button
        @click.stop="loadData"
        class="text-[var(--dash-text-muted)] hover:text-white transition-colors p-1"
        :class="{ 'animate-spin': loading }"
        title="Refresh"
      >
        <ArrowPathIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar z-10">

      <!-- Error State -->
      <div v-if="error" class="h-full flex flex-col items-center justify-center text-red-400 gap-2">
        <ExclamationTriangleIcon class="w-6 h-6 opacity-50" />
        <span class="text-[10px] font-bold uppercase tracking-wider">{{ error }}</span>
        <button @click="loadData" class="text-[10px] underline opacity-75 hover:opacity-100">{{ $t('tryAgain') }}</button>
      </div>

      <!-- Loading State (Skeleton) -->
      <div v-else-if="loading && departures.length === 0" class="flex flex-col gap-1">
        <div v-for="i in 3" :key="i" class="h-10 bg-white/5 rounded-lg animate-pulse"></div>
      </div>

      <!-- List -->
      <div v-else class="flex flex-col gap-1">
        <div
          v-for="(dep, index) in filteredDepartures"
          :key="index"
          class="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
        >
          <!-- Left: Line Info & Platform -->
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-md flex items-center justify-center font-black text-sm shadow-sm"
              :style="{ backgroundColor: dep.serviceJourney.line.backgroundColor, color: dep.serviceJourney.line.foregroundColor }"
            >
              {{ dep.serviceJourney.line.shortName }}
            </div>
            <div class="flex flex-col">
              <span class="text-[var(--dash-text)] font-bold text-xs leading-tight group-hover:text-white transition-colors truncate max-w-[100px]">
                {{ dep.serviceJourney.direction }}
              </span>
              <span class="text-[var(--dash-text-muted)] text-[9px] uppercase font-bold">
                {{ $t('platform') }} {{ dep.stopPoint.platform }}
              </span>
            </div>
          </div>

          <!-- Right: Time -->
          <div class="flex flex-col items-end">
            <div class="flex items-baseline gap-1">
              <span class="text-[var(--dash-text)] font-black text-base tabular-nums leading-none">
                {{ formatTime(dep.estimatedTime || dep.plannedTime) }}
              </span>
              <span
                v-if="getRelativeMinutes(dep.estimatedTime || dep.plannedTime) <= 60"
                class="text-[var(--dash-text-muted)] text-[10px] font-bold"
              >
                ({{ getRelativeMinutes(dep.estimatedTime || dep.plannedTime) }}min)
              </span>
            </div>

            <span
              v-if="dep.estimatedTime"
              class="text-[9px] uppercase font-bold tracking-wider text-green-400 flex items-center gap-1 mt-0.5"
            >
              {{ $t('live') }}
            </span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && filteredDepartures.length === 0" class="text-center py-4 text-[var(--dash-text-muted)] text-xs">
          {{ $t('noUpcomingDepartures') }}
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
