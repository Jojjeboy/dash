<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useScreenHealth } from '@/composables/useScreenHealth'
import namesData from '@/assets/names.json'

import alertSound from '@/assets/timer.mp3'



// --- State ---
const timeStr = ref('')
const dateStr = ref('')
const nameDays = ref<string[]>([])
const historyEvent = ref<{ year: number; text: string } | null>(null)
const isLoadingHistory = ref(false)

// Timer State
const showTimer = ref(false)
const timeLeft = ref(0)
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
      if (events.length > 0) {
        // Pick a random event
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

const startTimer = () => {
  if (timeLeft.value === 0) timeLeft.value = (inputMinutes.value * 60) + inputSeconds.value
  if (audioContext.value?.state === 'suspended') audioContext.value.resume()
  
  if (!isRunning.value) {
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

const toggleTimerView = () => {
    showTimer.value = !showTimer.value
}

// --- Lifecycle ---
onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 60000)
  fetchHistory() // Initial fetch
  
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
    class="w-full h-full p-6 text-[#e0e0e0] transition-all duration-1000 ease-in-out relative"
    :class="[containerClass, alignmentClass]"
    :style="{ opacity: contentOpacity }"
  >
    <!-- Top Right Toggle -->
    <button 
        @click="toggleTimerView"
        class="absolute top-4 right-4 opacity-30 hover:opacity-100 transition-opacity p-2"
    >
        <svg v-if="!showTimer" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
    </button>

    <!-- Header: Time & Date (Always Visible unless Timer is VERY dominant, let's keep it but maybe smaller in timer mode?) -->
    <!-- Actually, let's keep top prominent -->
    <div class="transition-all duration-500" :class="showTimer ? 'scale-75 origin-top-left opacity-50' : ''">
        <div class="text-6xl font-light tracking-tight mb-2 opacity-90 font-mono">
        {{ timeStr }}
        </div>
        <div class="text-2xl font-normal opacity-80 capitalize mb-4">
        {{ dateStr }}
        </div>
    </div>

    <!-- Mode: Info (History/Names) -->
    <div v-if="!showTimer" class="flex-1 flex flex-col transition-opacity duration-300">
        <!-- Name Day -->
        <div v-if="nameDays.length" class="mb-6 opacity-70">
            <div class="text-xs uppercase tracking-widest opacity-50 mb-1">Namnsdag</div>
            <div class="text-lg">{{ nameDays.join(', ') }}</div>
        </div>

        <!-- History Event -->
        <div v-if="historyEvent" class="mt-auto opacity-60 max-w-sm">
            <div class="text-xs uppercase tracking-widest opacity-50 mb-1">Hände {{ historyEvent.year }}</div>
            <div class="text-sm leading-snug line-clamp-3">
                {{ historyEvent.text }}
            </div>
        </div>
    </div>

    <!-- Mode: Timer -->
    <div v-else class="flex-1 flex flex-col items-center justify-center transition-opacity duration-300 w-full">
        <div v-if="timeLeft > 0 || isRunning" class="text-center w-full">
            <div class="text-[var(--dash-text)] font-black mb-2 tabular-nums leading-none text-5xl">
                {{ formattedTimer }}
            </div>
            <div class="flex gap-2 justify-center">
                <button
                @click.stop="isRunning ? stopTimer() : startTimer()"
                class="rounded-lg uppercase font-bold tracking-widest transition-all px-3 py-1 text-[10px] bg-white/10 hover:bg-white/20"
                >
                {{ isRunning ? 'Pause' : 'Resume' }}
                </button>
                <button
                @click.stop="resetTimer"
                class="rounded-lg uppercase font-bold tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1 text-[10px]"
                >
                Reset
                </button>
            </div>
        </div>
        <div v-else class="flex flex-col items-center">
            <div class="flex items-center justify-center gap-2 mb-4">
                 <div class="flex flex-col items-center">
                    <input v-model="inputMinutes" type="number" class="bg-transparent text-center w-16 text-4xl font-bold outline-none placeholder-white/20" placeholder="00">
                    <span class="text-[10px] uppercase opacity-50">Min</span>
                 </div>
                 <span class="text-2xl">:</span>
                 <div class="flex flex-col items-center">
                    <input v-model="inputSeconds" type="number" class="bg-transparent text-center w-16 text-4xl font-bold outline-none placeholder-white/20" placeholder="00">
                     <span class="text-[10px] uppercase opacity-50">Sec</span>
                 </div>
            </div>
             <button
                @click.stop="startTimer"
                class="w-full py-2 px-6 rounded-lg bg-[var(--dash-text)] text-[var(--dash-bg)] text-[10px] uppercase font-bold tracking-widest shadow-lg active:scale-95 transition-all"
            >
                Start
            </button>
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
</style>
