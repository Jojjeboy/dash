<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useScreenHealth } from '@/composables/useScreenHealth'
import namesData from '@/assets/names.json'
import { LOCATION } from '@/config/location'

import alertSound from '@/assets/timer.mp3'



// --- State ---
const timeStr = ref('')
const dateStr = ref('')
const nameDays = ref<string[]>([])
const historyEvent = ref<{ year: number; text: string } | null>(null)
const allHistoryEvents = ref<{ year: number; text: string }[]>([])
const isLoadingHistory = ref(false)
const showFullHistory = ref(false)
const sunrise = ref<string | null>(null)
const sunset = ref<string | null>(null)

const timeLeft = ref(0)
const totalTime = ref(0)
const inputMinutes = ref(5)
const inputSeconds = ref(0)
const isRunning = ref(false)
let timerInterval: number | null = null
let timeInterval: number | null = null
const audioContext = ref<AudioContext | null>(null)

// Screen Health State
const widgetRef = ref<HTMLElement | null>(null)
const layoutSeed = ref(0)
const contentOpacity = ref(1)

// --- Data Logic: Time & Date ---
const updateTime = () => {
  const now = new Date()
  timeStr.value = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  dateStr.value = now.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
  
  // Update name day if date changed (simple check)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const key = `${mm}-${dd}`
  
  interface NameDayEntry { datum: string; namn: string[] }
  const entry = (namesData as NameDayEntry[]).find((n) => n.datum === key)
  nameDays.value = entry ? entry.namn : []
}

const weekNum = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
})



// --- Data Logic: History API ---
const fetchHistory = async () => {
  isLoadingHistory.value = true
  try {
    const now = new Date()
    // Wikipedia API expects Swedish locale names for months if we query by title like "14_januari"
    const months = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
    const day = now.getDate()
    const month = months[now.getMonth()]
    const title = `${day}_${month}`

    const url = `https://sv.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&titles=${title}&explaintext=1`
    
    const res = await fetch(url)
    const data = await res.json()
    
    const pages = data.query.pages
    const pageIds = Object.keys(pages)
    if (pageIds.length === 0) return
    const pageId = pageIds[0] as string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawText = (pages as any)[pageId]?.extract

    if (rawText) {
      const events = parseWikipediaText(rawText)
      allHistoryEvents.value = events
      if (events.length > 0) {
        // Pick a random event for the preview box
        const randomEvent = events[Math.floor(Math.random() * events.length)]
        if (randomEvent) {
          historyEvent.value = randomEvent
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch history:', err)
  } finally {
    isLoadingHistory.value = false
  }
}

const parseWikipediaText = (text: string) => {
  const lines = text.split('\n')
  const events: { year: number; text: string }[] = []
  let currentSection = 'intro'
  const yearRegex = /^(\d{3,4})\s?[–-]\s?(.*)/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('==')) {
      const header = trimmed.replace(/=/g, '').trim().toLowerCase()
      if (header.includes('händelser')) currentSection = 'handelser'
      else currentSection = 'other'
      continue
    }

    if (currentSection === 'handelser') {
      const match = trimmed.match(yearRegex)
      if (match && match[1] && match[2]) {
        events.push({
          year: parseInt(match[1]),
          text: match[2]
        })
      }
    }
  }
  return events
}

// --- Timer Logic ---
const formattedTimer = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const playAlert = async () => {
  try {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200])
    if (audioContext.value?.state === 'suspended') await audioContext.value.resume()
    const audio = new Audio(alertSound)
    audio.volume = 1.0
    const playPromise = audio.play()
    if (playPromise !== undefined) await playPromise
  } catch (e) {
    console.error('Error playing audio:', e)
  }
}

// --- Circular Progress Logic ---
const circumference = 2 * Math.PI * 45 // r=45
const dashOffset = computed(() => {
  if (totalTime.value === 0) return 0
  const progress = timeLeft.value / totalTime.value
  return circumference * (1 - progress)
})

const startTimer = () => {
  const duration = (inputMinutes.value * 60) + inputSeconds.value
  if (timeLeft.value === 0 || timeLeft.value === duration) {
     timeLeft.value = duration
     totalTime.value = duration
  }
  
  if (audioContext.value?.state === 'suspended') audioContext.value.resume()
  
  if (!isRunning.value && timeLeft.value > 0) {
    isRunning.value = true
    timerInterval = window.setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        playAlert()
        stopTimer()
      }
    }, 1000)
  }
}

const stopTimer = () => {
  isRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetTimer = () => {
  stopTimer()
  timeLeft.value = 0
}

// --- Sunrise/Sunset API ---
const fetchSunTimes = async () => {
  try {
    const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${LOCATION.lat}&lng=${LOCATION.lon}&date=today&formatted=0`)
    const data = await response.json()
    if (data.status === 'OK') {
      // Convert UTC time to local time and format
      const sunriseTime = new Date(data.results.sunrise)
      const sunsetTime = new Date(data.results.sunset)
      sunrise.value = sunriseTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
      sunset.value = sunsetTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    }
  } catch (err) {
    console.error('Failed to fetch sun times:', err)
  }
}

// --- Lifecycle ---
onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 60000)
  fetchHistory() // Initial fetch
  fetchSunTimes() // Fetch sunrise/sunset
  
  // Initialize Audio Context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
  
  // Set self-configured title
  emit('update-title', 'Idag & Timer')
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  stopTimer()
})

// --- Screen Health Integration ---
const emit = defineEmits(['update-title'])

// --- Screen Health Integration ---
useScreenHealth({
  widgetId: 'datetime-today',
  oledRisk: 'medium',
  supportedActions: ['microMotion', 'layoutSeed', 'softRefresh'],
  onAction: async (action) => {
    if (action === 'microMotion' && widgetRef.value) {
        // Subtle shift
        const el = widgetRef.value
        const x = (Math.random() * 2 - 1).toFixed(1)
        const y = (Math.random() * 2 - 1).toFixed(1)
        el.style.transform = `translate(${x}px, ${y}px)`
        // Reset after a while or keep it? Guide says "avoid static". 
        // We can leave it shifted until next microMotion to minimize movement.
    }
    
    if (action === 'layoutSeed') {
        // Change slight layout properties safely
        layoutSeed.value = (layoutSeed.value + 1) % 3
    }

    if (action === 'softRefresh') {
        // Fade out, refresh history, fade in
        contentOpacity.value = 0.5
        await fetchHistory() // Get a new random event
        setTimeout(() => {
            contentOpacity.value = 1
        }, 500)
    }
  }
})

// --- Computed Styles based on Layout Seed ---
const containerClass = computed(() => {
    // layoutSeed 0: Start aligned
    // layoutSeed 1: Center aligned
    // layoutSeed 2: End aligned (maybe too drastic, let's stick to subtle padding/flex changes)
    
    // Let's just vary text alignment for the history part or date
    return 'flex flex-col'
})

const alignmentClass = computed(() => {
    if (layoutSeed.value === 1) return 'items-center text-center'
    if (layoutSeed.value === 2) return 'items-start text-left pl-4' 
    return 'items-start text-left'
})

</script>

<template>
  <div 
    ref="widgetRef" 
    class="w-full h-full p-4 text-[#e0e0e0] transition-all duration-1000 ease-in-out relative"
    :class="[containerClass, alignmentClass]"
    :style="{ opacity: contentOpacity }"
  >
    <!-- Mode: Info (Full Grid always shown now) -->
    <div class="flex-1 flex flex-col min-h-0 relative transition-opacity duration-300">
        <!-- Grid View -->
        <div v-if="!showFullHistory" class="flex-1 grid grid-cols-2 grid-rows-2 gap-3 h-full">
            <!-- Box 1: Time (Large) -->
            <div class="bg-white/5 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                <div class="text-7xl font-black tracking-tighter opacity-90 font-mono transition-transform group-hover:scale-110 duration-700">
                    {{ timeStr }}
                </div>
                <div class="text-[10px] uppercase tracking-[0.3em] opacity-30 font-black">Klockan</div>
                
                <!-- Sunrise/Sunset Times -->
                <div v-if="sunrise && sunset" class="flex gap-3 mt-3 items-center justify-center">
                    <div class="flex items-center gap-1 text-[9px] font-bold opacity-50">
                        <span class="text-base">🌅</span>
                        <span>{{ sunrise }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-[9px] font-bold opacity-50">
                        <span class="text-base">🌇</span>
                        <span>{{ sunset }}</span>
                    </div>
                </div>
            </div>

            <!-- Box 2: Date, Week & Namnsdag -->
            <div class="bg-white/5 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                <div class="text-xl font-bold opacity-80 capitalize mb-1">{{ dateStr.split(' ')[0] }}</div>
                <div class="text-3xl font-black opacity-90 mb-1">{{ dateStr.split(' ').slice(1).join(' ') }}</div>
                <div class="flex flex-col gap-1 mt-2">
                    <div class="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest opacity-60">
                        Vecka {{ weekNum }}
                    </div>
                    <div v-if="nameDays.length" class="text-[10px] uppercase tracking-wider opacity-30 font-black mt-1">
                        {{ nameDays.join(' · ') }}
                    </div>
                </div>
            </div>

            <!-- Box 3: Integrated Timer (Circular) -->
            <div class="bg-white/5 rounded-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                <div v-if="timeLeft > 0 || isRunning" class="relative w-full h-full flex items-center justify-center">
                    <!-- Circular Progress -->
                    <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <!-- Background Circle -->
                        <circle cx="50" cy="50" r="45" fill="none" class="stroke-white/10" stroke-width="3" />
                        <!-- Progress Circle -->
                        <circle 
                            cx="50" cy="50" r="45" 
                            fill="none" 
                            class="stroke-[var(--dash-text)] transition-all duration-1000 ease-linear"
                            stroke-width="3" 
                            stroke-linecap="round"
                            :stroke-dasharray="circumference"
                            :stroke-dashoffset="dashOffset"
                        />
                    </svg>

                    <!-- Time & Controls Overlay -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center z-10 gap-2">
                        <div class="text-3xl font-black tabular-nums tracking-tight leading-none">
                            {{ formattedTimer }}
                        </div>
                        <div class="flex gap-2">
                             <button
                                @click.stop="isRunning ? stopTimer() : startTimer()"
                                class="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all active:scale-95"
                            >
                                <svg v-if="isRunning" class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                                <svg v-else class="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </button>
                            <button
                                @click.stop="resetTimer"
                                class="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all active:scale-95"
                            >
                                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div v-else class="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div class="text-[8px] uppercase tracking-widest opacity-30 font-black">Set Timer</div>
                    <div class="flex items-center justify-center gap-2">
                        <input v-model="inputMinutes" type="number" class="bg-transparent border-b border-white/20 text-center w-12 py-1 text-3xl font-bold outline-none focus:border-white transition-colors placeholder-white/20" placeholder="0">
                        <span class="text-3xl font-bold opacity-50">:</span>
                        <input v-model="inputSeconds" type="number" class="bg-transparent border-b border-white/20 text-center w-12 py-1 text-3xl font-bold outline-none focus:border-white transition-colors placeholder-white/20" placeholder="0">
                    </div>
                    <button
                        @click.stop="startTimer"
                        class="w-10 h-10 rounded-full bg-[var(--dash-text)] text-[var(--dash-bg)] flex items-center justify-center shadow-lg active:scale-95 transition-all hover:opacity-90"
                    >
                         <svg class="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                </div>
            </div>

            <!-- Box 4: History (Clickable) -->
            <div 
                @click="showFullHistory = true"
                class="bg-white/5 rounded-2xl flex flex-col items-start justify-center p-5 text-left relative overflow-hidden cursor-pointer hover:bg-white/10 transition-colors group"
            >
                <div v-if="historyEvent" class="flex flex-col h-full justify-center">
                    <div class="text-[10px] uppercase tracking-widest opacity-30 mb-2 font-black flex justify-between w-full">
                        <span>{{ dateStr.split(' ').slice(1).join(' ') }} år: {{ historyEvent.year }}</span>
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity">Visa alla →</span>
                    </div>
                    <div class="text-xs leading-relaxed opacity-70 line-clamp-4 font-medium italic">
                        "{{ historyEvent.text }}"
                    </div>
                </div>
                <div v-else class="text-xs opacity-20 italic">Hämtar historik...</div>
                
                <!-- Decorative Year Background -->
                <div v-if="historyEvent" class="absolute -bottom-2 -right-2 text-6xl font-black opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                    {{ historyEvent.year }}
                </div>
            </div>
        </div>

        <!-- Full History View -->
        <div v-else class="flex-1 bg-white/5 rounded-2xl flex flex-col min-h-0 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div class="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                     <div class="text-[10px] uppercase tracking-[0.3em] opacity-40 font-black mb-1">Historiska Händelser</div>
                     <div class="text-xs font-bold opacity-70">{{ dateStr }}</div>
                </div>
                <button 
                    @click="showFullHistory = false"
                    class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    Stäng
                </button>
            </div>
            <div class="flex-1 overflow-y-auto min-h-0 p-4 custom-scrollbar">

                <div v-if="allHistoryEvents.length" class="space-y-6">
                    <div 
                        v-for="(ev, idx) in allHistoryEvents" 
                        :key="idx"
                        class="relative pl-6 border-l border-white/10"
                    >
                        <div class="absolute w-2 h-2 rounded-full bg-white/20 -left-[4.5px] top-1.5"></div>
                        <div class="text-xs font-black opacity-40 mb-1 tracking-wider">{{ ev.year }}</div>
                        <div class="text-sm leading-relaxed opacity-80 font-medium italic">"{{ ev.text }}"</div>
                    </div>
                </div>
                <div v-else class="h-full flex items-center justify-center opacity-30 italic text-sm">
                    {{ isLoadingHistory ? 'Laddar händelser...' : 'Inga fler händelser hittades för denna dag.' }}
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes animate-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-in {
  animation: animate-in 0.3s ease-out forwards;
}
</style>
