<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { parseICS, getEventsForDate, getSubjectColor, type CalendarEvent } from '@/utils/ics-parser'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

const events = ref<CalendarEvent[]>([])
const selectedDate = ref(new Date())
const loading = ref(true)
const error = ref<string | null>(null)
const currentTime = ref(new Date())

// Update current time every minute
let timeInterval: number | null = null
onMounted(() => {
  timeInterval = window.setInterval(() => {
    currentTime.value = new Date()
  }, 60000) // Update every minute
})

// Load ICS file
const loadCalendar = async () => {
  try {
    loading.value = true
    error.value = null
    
    const icsPath = dashboardStore.config?.calendarIcsPath || 'liakar1020@skola.goteborg.se.ics'
    const response = await fetch(`${import.meta.env.BASE_URL}${icsPath}`)
    
    if (!response.ok) {
      throw new Error('Failed to load calendar file')
    }
    
    const icsContent = await response.text()
    events.value = await parseICS(icsContent)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load calendar'
    console.error('Calendar load error:', err)
  } finally {
    loading.value = false
  }
}

// Watch for config changes
watch(() => dashboardStore.config?.calendarIcsPath, () => {
  loadCalendar()
}, { immediate: true })

// Get events for selected date
const dayEvents = computed(() => {
  let targetDate = new Date(selectedDate.value)
  
  // If weekend, show Monday's schedule
  const dayOfWeek = targetDate.getDay()
  if (dayOfWeek === 0) { // Sunday
    targetDate.setDate(targetDate.getDate() + 1)
  } else if (dayOfWeek === 6) { // Saturday
    targetDate.setDate(targetDate.getDate() + 2)
  }
  
  return getEventsForDate(events.value, targetDate)
})

// Check if it's a weekend
const isWeekend = computed(() => {
  const day = selectedDate.value.getDay()
  return day === 0 || day === 6
})

// Check if selected date is today
const isToday = computed(() => {
  const today = new Date()
  return selectedDate.value.toDateString() === today.toDateString()
})

// Format date for display
const formattedDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return selectedDate.value.toLocaleDateString('sv-SE', options)
})

// Navigation functions
const goToPreviousDay = () => {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() - 1)
  
  // Skip weekends going backwards
  if (newDate.getDay() === 0) { // Sunday
    newDate.setDate(newDate.getDate() - 2)
  } else if (newDate.getDay() === 6) { // Saturday
    newDate.setDate(newDate.getDate() - 1)
  }
  
  selectedDate.value = newDate
}

const goToNextDay = () => {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + 1)
  
  // Skip weekends going forward
  if (newDate.getDay() === 6) { // Saturday
    newDate.setDate(newDate.getDate() + 2)
  } else if (newDate.getDay() === 0) { // Sunday
    newDate.setDate(newDate.getDate() + 1)
  }
  
  selectedDate.value = newDate
}

const goToToday = () => {
  selectedDate.value = new Date()
}

// Format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

// Check if event is currently happening
const isCurrentEvent = (event: CalendarEvent) => {
  if (!isToday.value) return false
  const now = currentTime.value.getTime()
  return now >= event.startTime.getTime() && now <= event.endTime.getTime()
}

// Calculate position for current time indicator
const currentTimePosition = computed(() => {
  if (!isToday.value || dayEvents.value.length === 0) return null
  
  const now = currentTime.value
  const firstEvent = dayEvents.value[0]
  const lastEvent = dayEvents.value[dayEvents.value.length - 1]
  
  if (!firstEvent || !lastEvent) return null
  
  const dayStart = firstEvent.startTime.getTime()
  const dayEnd = lastEvent.endTime.getTime()
  const currentTimeMs = now.getTime()
  
  if (currentTimeMs < dayStart || currentTimeMs > dayEnd) return null
  
  const percentage = ((currentTimeMs - dayStart) / (dayEnd - dayStart)) * 100
  return Math.min(Math.max(percentage, 0), 100)
})
</script>

<template>
  <div class="h-full w-full flex flex-col glass-tile p-3 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-[9px] font-bold text-[var(--dash-text)] uppercase tracking-wider">Schedule</h2>
      <div class="flex gap-1">
        <button
          @click="goToPreviousDay"
          class="p-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          title="Previous Day"
        >
          <svg class="w-3 h-3 text-[var(--dash-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click="goToToday"
          :class="{ 'opacity-50': isToday }"
          class="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-[8px] font-bold uppercase tracking-wider text-[var(--dash-text)]"
          title="Today"
        >
          Today
        </button>
        <button
          @click="goToNextDay"
          class="p-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          title="Next Day"
        >
          <svg class="w-3 h-3 text-[var(--dash-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Date Display -->
    <div class="mb-2">
      <p class="text-[9px] text-[var(--dash-text-muted)] font-medium">
        {{ selectedDate.toLocaleDateString('sv-SE', { weekday: 'short', month: 'short', day: 'numeric' }) }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <p class="text-[9px] text-[var(--dash-text-muted)]">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <p class="text-[8px] text-red-400">{{ error }}</p>
    </div>

    <!-- No Events -->
    <div v-else-if="dayEvents.length === 0" class="flex-1 flex items-center justify-center">
      <p class="text-[9px] text-[var(--dash-text-muted)] font-medium text-center">No school today!</p>
    </div>

    <!-- Schedule Timeline -->
    <div v-else class="flex-1 overflow-y-auto custom-scrollbar pr-1 relative">
      <!-- Current Time Indicator -->
      <div
        v-if="currentTimePosition !== null"
        class="absolute left-0 right-0 z-10 pointer-events-none"
        :style="{ top: `${currentTimePosition}%` }"
      >
        <div class="flex items-center">
          <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
          <div class="flex-1 h-px bg-red-500"></div>
        </div>
      </div>

      <!-- Events -->
      <div class="space-y-1.5">
        <div
          v-for="event in dayEvents"
          :key="event.uid"
          class="relative p-2 rounded-lg border transition-all"
          :class="{
            'ring-1 ring-white/20': isCurrentEvent(event),
            'border-white/10': !isCurrentEvent(event)
          }"
          :style="{
            backgroundColor: `${getSubjectColor(event.subject || event.summary)}15`,
            borderColor: getSubjectColor(event.subject || event.summary)
          }"
        >
          <!-- Time & Subject -->
          <div class="flex items-start justify-between gap-1 mb-1">
            <span class="text-[8px] font-bold text-[var(--dash-text)] uppercase tracking-wide">
              {{ formatTime(event.startTime) }}
            </span>
            <span
              v-if="isCurrentEvent(event)"
              class="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-500 text-white"
            >
              Now
            </span>
          </div>

          <!-- Subject -->
          <h3 class="text-[10px] font-bold text-[var(--dash-text)] mb-0.5 leading-tight">
            {{ event.subject || event.summary }}
          </h3>

          <!-- Teacher -->
          <div v-if="event.teacher" class="text-[8px] text-[var(--dash-text-muted)]">
            {{ event.teacher }}
          </div>
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
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
