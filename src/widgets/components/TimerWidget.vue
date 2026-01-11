<script setup lang="ts">
import { ref, onUnmounted, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import alertSound from '@/assets/alert.wav'

const { t } = useI18n()

defineProps<{
  isExpanded?: boolean
}>()

const timeLeft = ref(0)
const inputMinutes = ref(5)
const inputSeconds = ref(0)
const isRunning = ref(false)
let timerInterval: number | null = null
const audioContext = ref<AudioContext | null>(null)

onMounted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()

  // Persistence: Restore Reference Data
  const savedM = localStorage.getItem('dash_timer_m')
  const savedS = localStorage.getItem('dash_timer_s')
  if (savedM) inputMinutes.value = parseInt(savedM)
  if (savedS) inputSeconds.value = parseInt(savedS)

  // Persistence: Restore State
  const savedRunning = localStorage.getItem('dash_timer_running') === 'true'
  const savedEndTime = localStorage.getItem('dash_timer_end')
  const savedTimeLeft = localStorage.getItem('dash_timer_left')

  if (savedRunning && savedEndTime) {
    const remaining = Math.ceil((parseInt(savedEndTime) - Date.now()) / 1000)
    if (remaining > 0) {
      timeLeft.value = remaining
      startTimer()
    } else {
      timeLeft.value = 0
    }
  } else if (savedTimeLeft) {
    timeLeft.value = parseInt(savedTimeLeft)
  }
})

// Persistence: Save inputs
watch([inputMinutes, inputSeconds], () => {
  localStorage.setItem('dash_timer_m', inputMinutes.value.toString())
  localStorage.setItem('dash_timer_s', inputSeconds.value.toString())
})

const playAlert = async () => {
  if (!audioContext.value) return

  if (audioContext.value.state === 'suspended') {
    await audioContext.value.resume()
  }

  const audio = new Audio(alertSound)
  audio.play().catch(e => console.error('Error playing audio:', e))
}

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const startTimer = () => {
  if (timeLeft.value === 0) {
    timeLeft.value = (inputMinutes.value * 60) + inputSeconds.value
  }

  // Resume audio context if suspended (browser policy)
  if (audioContext.value?.state === 'suspended') {
    audioContext.value.resume()
  }

  if (!isRunning.value) {
    isRunning.value = true

    // Persistence: Save Start State
    const endTime = Date.now() + (timeLeft.value * 1000)
    localStorage.setItem('dash_timer_end', endTime.toString())
    localStorage.setItem('dash_timer_running', 'true')

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
  // Persistence: Update State
  localStorage.setItem('dash_timer_running', 'false')
  localStorage.removeItem('dash_timer_end')
  localStorage.setItem('dash_timer_left', timeLeft.value.toString())
}

const resetTimer = () => {
  stopTimer()
  timeLeft.value = 0
  localStorage.removeItem('dash_timer_left')
  localStorage.removeItem('dash_timer_end')
}

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center p-4">
    <div v-if="timeLeft > 0 || isRunning" class="text-center flex flex-col items-center justify-center h-full w-full">
      <div
        class="text-[var(--dash-text)] font-black mb-4 tabular-nums leading-none transition-all duration-300"
        :class="isExpanded ? 'text-[40vh]' : 'text-7xl'"
      >
        {{ formattedTime }}
      </div>
      <div class="flex gap-2">
        <button
          @click.stop="isRunning ? stopTimer() : startTimer()"
          class="rounded-xl uppercase font-bold tracking-widest transition-all"
          :class="[
            isRunning ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20',
            isExpanded ? 'px-12 py-6 text-2xl' : 'px-4 py-2 text-[10px]'
          ]"
        >
          {{ isRunning ? t('pause') : t('resume') }}
        </button>
        <button
          @click.stop="resetTimer"
          class="rounded-xl uppercase font-bold tracking-widest bg-white/5 text-[var(--dash-text-muted)] border border-white/5 hover:bg-white/10"
          :class="isExpanded ? 'px-12 py-6 text-2xl' : 'px-4 py-2 text-[10px]'"
        >
          {{ t('reset') }}
        </button>
      </div>
    </div>
    <div v-else class="text-center w-full max-w-[400px]">
      <div class="text-[var(--dash-text-muted)] text-[10px] uppercase font-bold tracking-[0.2em] mb-4">{{ t('setTimer') }}</div>

      <div class="flex items-center justify-center gap-4 mb-8">

        <!-- Minutes -->
        <div class="flex flex-col items-center">
          <input
            v-model="inputMinutes"
            type="number"
            class="bg-transparent text-center w-32 text-7xl font-black text-[var(--dash-text)] outline-none placeholder-[var(--dash-text-muted)] hover:text-white focus:text-white transition-colors"
            placeholder="00"
          >
          <span class="text-xs uppercase text-[var(--dash-text-muted)] font-bold tracking-[0.2em] mt-2">min</span>
        </div>

        <div class="text-7xl font-black text-[var(--dash-text-muted)] -mt-8">:</div>

        <!-- Seconds -->
        <div class="flex flex-col items-center">
          <input
            v-model="inputSeconds"
            type="number"
            class="bg-transparent text-center w-32 text-7xl font-black text-[var(--dash-text)] outline-none placeholder-[var(--dash-text-muted)] hover:text-white focus:text-white transition-colors"
            placeholder="00"
          >
          <span class="text-xs uppercase text-[var(--dash-text-muted)] font-bold tracking-[0.2em] mt-2">sec</span>
        </div>

      </div>

      <button
        @click.stop="startTimer"
        class="w-full py-3 rounded-xl bg-[var(--dash-text)] text-[var(--dash-bg)] text-[10px] uppercase font-black tracking-widest shadow-lg active:scale-95 transition-all"
      >
        {{ t('start') }}
      </button>
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
