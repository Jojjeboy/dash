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
const scrollContainer = ref<HTMLElement | null>(null)

// Update current time every minute
onMounted(() => {
  window.setInterval(() => {
    currentTime.value = new Date()
  }, 60000) // Update every minute
  
  // Scroll to current time or first event
  setTimeout(() => {
    if (scrollContainer.value && currentTimePosition.value !== null) {
      scrollContainer.value.scrollTo({
        top: currentTimePosition.value - 100,
        behavior: 'smooth'
      })
    }
  }, 1000)
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
  const targetDate = new Date(selectedDate.value)
  
  // If weekend, show Monday's schedule
  const dayOfWeek = targetDate.getDay()
  if (dayOfWeek === 0) { // Sunday
    targetDate.setDate(targetDate.getDate() + 1)
  } else if (dayOfWeek === 6) { // Saturday
    targetDate.setDate(targetDate.getDate() + 2)
  }
  
  return getEventsForDate(events.value, targetDate)
})

// Check if selected date is today
const isToday = computed(() => {
  const today = new Date()
  return selectedDate.value.toDateString() === today.toDateString()
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

// Timeline configuration (school hours: 08:00 - 16:00)
const TIMELINE_START_HOUR = 8
const TIMELINE_END_HOUR = 16
const TIMELINE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR
const HOUR_HEIGHT = 80 // pixels per hour
const TOTAL_HEIGHT = TIMELINE_HOURS * HOUR_HEIGHT

// Generate timeline hours
const timelineHours = computed(() => {
  const hours = []
  for (let hour = TIMELINE_START_HOUR; hour <= TIMELINE_END_HOUR; hour++) {
    hours.push(hour)
  }
  return hours
})

// Calculate position for current time indicator (based on fixed timeline)
const currentTimePosition = computed(() => {
  if (!isToday.value) return null
  
  const now = currentTime.value
  const hours = now.getHours()
  const minutes = now.getMinutes()
  
  // Check if current time is within timeline hours
  if (hours < TIMELINE_START_HOUR || hours >= TIMELINE_END_HOUR) return null
  
  // Calculate minutes since timeline start
  const minutesSinceStart = (hours - TIMELINE_START_HOUR) * 60 + minutes
  const totalMinutes = TIMELINE_HOURS * 60
  
  return (minutesSinceStart / totalMinutes) * TOTAL_HEIGHT
})

// Calculate event style based on timeline
const getEventStyle = (event: CalendarEvent) => {
  const start = event.startTime
  const end = event.endTime
  
  const startTotalMinutes = (start.getHours() - TIMELINE_START_HOUR) * 60 + start.getMinutes()
  const endTotalMinutes = (end.getHours() - TIMELINE_START_HOUR) * 60 + end.getMinutes()
  const totalMinutes = TIMELINE_HOURS * 60
  
  const top = (startTotalMinutes / totalMinutes) * TOTAL_HEIGHT
  const height = ((endTotalMinutes - startTotalMinutes) / totalMinutes) * TOTAL_HEIGHT
  
  return {
    position: 'absolute' as const,
    top: `${top}px`,
    height: `${height}px`,
    left: '42px', // Leave space for time labels
    right: '4px',
    backgroundColor: getSubjectColor(event.subject || event.summary),
    opacity: isCurrentEvent(event) ? '1' : '0.85',
    zIndex: isCurrentEvent(event) ? 10 : 1
  }
}

// Format time range
const formatTimeRange = (start: Date, end: Date) => {
  return `${formatTime(start)} - ${formatTime(end)}`
}
</script>

<template>
  <div ref="widgetContainer" class="h-full w-full flex flex-col glass-tile p-1.5 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-0.5">
      <h2 class="text-[7px] font-bold text-[var(--dash-text)] uppercase tracking-wider">{{ $t('schedule') }}</h2>
      <div class="flex gap-0.5">
        <button
          @click="goToPreviousDay"
          class="p-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
          :title="$t('previousDay')"
        >
          <svg class="w-2.5 h-2.5 text-[var(--dash-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click="goToToday"
          :class="{ 'opacity-50': isToday }"
          class="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors text-[7px] font-bold uppercase tracking-wider text-[var(--dash-text)]"
          :title="$t('today')"
        >
          {{ $t('today') }}
        </button>
        <button
          @click="goToNextDay"
          class="p-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
          :title="$t('nextDay')"
        >
          <svg class="w-2.5 h-2.5 text-[var(--dash-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Date Display -->
    <div class="mb-1 bg-white/5 rounded-lg px-2 py-1">
      <p class="text-[9px] text-[var(--dash-text)] font-bold text-center">
        {{ selectedDate.toLocaleDateString('sv-SE', { weekday: 'long', month: 'long', day: 'numeric' }) }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <p class="text-[9px] text-[var(--dash-text-muted)]">{{ $t('loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <p class="text-[8px] text-red-400">{{ error }}</p>
    </div>

    <!-- No Events -->
    <div v-else-if="dayEvents.length === 0" class="flex-1 flex items-center justify-center">
      <p class="text-[9px] text-[var(--dash-text-muted)] font-medium text-center">{{ $t('noSchoolToday') }}</p>
    </div>

    <!-- Schedule Timeline -->
    <div v-else ref="scrollContainer" class="flex-1 overflow-y-auto custom-scrollbar relative">
      <div class="relative" :style="{ height: `${TOTAL_HEIGHT}px`, minWidth: '100%' }">
        <!-- Timeline Labels (Left Side) -->
        <div class="absolute left-0 top-0 bottom-0 w-10 pointer-events-none">
          <div
            v-for="hour in timelineHours"
            :key="hour"
            class="absolute left-0 right-0 text-[10px] text-[var(--dash-text-muted)] font-medium text-center"
            :style="{
              top: `${((hour - TIMELINE_START_HOUR) / TIMELINE_HOURS) * TOTAL_HEIGHT}px`,
              transform: 'translateY(-50%)'
            }"
          >
            {{ String(hour).padStart(2, '0') }}:00
          </div>
        </div>

        <!-- Timeline Grid Lines -->
        <div class="absolute left-10 right-0 top-0 bottom-0 pointer-events-none">
          <div
            v-for="hour in timelineHours"
            :key="`line-${hour}`"
            class="absolute left-0 right-0 border-t border-white/10"
            :style="{
              top: `${((hour - TIMELINE_START_HOUR) / TIMELINE_HOURS) * TOTAL_HEIGHT}px`
            }"
          />
        </div>

        <!-- Events Container -->
        <div class="absolute inset-0 pointer-events-none">
          <div
            v-for="event in dayEvents"
            :key="event.uid"
            class="rounded-lg px-2 py-1 transition-all pointer-events-auto overflow-hidden"
            :class="{
              'ring-2 ring-white/60 shadow-lg': isCurrentEvent(event)
            }"
            :style="getEventStyle(event)"
          >
            <!-- Time Range -->
            <div class="flex items-start justify-between gap-1 mb-0.5">
              <span class="text-[10px] font-bold text-[var(--dash-text)] leading-tight whitespace-nowrap">
                {{ formatTimeRange(event.startTime, event.endTime) }}
              </span>
              <span
                v-if="isCurrentEvent(event)"
                class="text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded-full bg-red-500 text-white flex-shrink-0"
              >
                {{ $t('now') }}
              </span>
            </div>

            <!-- Subject -->
            <h3 class="text-[12px] font-bold text-[var(--dash-text)] leading-tight mb-0.5 break-words">
              {{ event.subject || event.summary }}
            </h3>

            <!-- Teacher -->
            <div v-if="event.teacher" class="text-[9px] text-[var(--dash-text-muted)] leading-tight">
              {{ event.teacher }}
            </div>
          </div>
        </div>

        <!-- Current Time Indicator -->
        <div
          v-if="currentTimePosition !== null"
          class="absolute left-0 right-0 z-30 pointer-events-none"
          :style="{ top: `${currentTimePosition}px` }"
        >
          <div class="flex items-center -translate-y-1/2">
            <div class="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm border border-white/20" style="margin-left: 36px;"></div>
            <div class="flex-1 h-0.5 bg-red-500 shadow-sm"></div>
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
