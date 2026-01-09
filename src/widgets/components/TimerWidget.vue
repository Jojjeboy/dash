<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'

const timeLeft = ref(0)
const inputMinutes = ref(5)
const isRunning = ref(false)
let timerInterval: number | null = null

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const startTimer = () => {
  if (timeLeft.value === 0) {
    timeLeft.value = inputMinutes.value * 60
  }

  if (!isRunning.value) {
    isRunning.value = true
    timerInterval = window.setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
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

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center p-4">
    <div v-if="timeLeft > 0 || isRunning" class="text-center">
      <div class="text-[var(--dash-text)] text-4xl font-black mb-4 tabular-nums">
        {{ formattedTime }}
      </div>
      <div class="flex gap-2">
        <button
          @click.stop="isRunning ? stopTimer() : startTimer()"
          class="px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all"
          :class="isRunning ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'"
        >
          {{ isRunning ? 'Pause' : 'Resume' }}
        </button>
        <button
          @click.stop="resetTimer"
          class="px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest bg-white/5 text-[var(--dash-text-muted)] border border-white/5 hover:bg-white/10"
        >
          Reset
        </button>
      </div>
    </div>
    <div v-else class="text-center w-full max-w-[140px]">
      <div class="text-[var(--dash-text-muted)] text-[10px] uppercase font-bold tracking-[0.2em] mb-4">Set Timer</div>
      <div class="flex items-center justify-center gap-2 mb-4 bg-white/5 p-2 rounded-2xl border border-white/5">
        <button @click.stop="inputMinutes = Math.max(1, inputMinutes - 1)" class="w-8 h-8 rounded-lg hover:bg-white/5 text-[var(--dash-text)] font-black">-</button>
        <input
          v-model="inputMinutes"
          type="number"
          class="bg-transparent text-center w-12 text-xl font-black text-[var(--dash-text)] outline-none"
        >
        <button @click.stop="inputMinutes = Math.min(99, inputMinutes + 1)" class="w-8 h-8 rounded-lg hover:bg-white/5 text-[var(--dash-text)] font-black">+</button>
      </div>
      <button
        @click.stop="startTimer"
        class="w-full py-3 rounded-xl bg-[var(--dash-text)] text-[var(--dash-bg)] text-[10px] uppercase font-black tracking-widest shadow-lg active:scale-95 transition-all"
      >
        Start
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
