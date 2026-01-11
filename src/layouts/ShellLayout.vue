<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { onMounted, onUnmounted } from 'vue'
import { useFullscreen } from '@/composables/useFullscreen'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const { isFullscreen, toggleFullscreen } = useFullscreen()

let wakeLock: WakeLockSentinel | null = null

const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen')
      console.log('Wake Lock is active')
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`${err.name}, ${err.message}`)
    }
  }
}

const handleVisibilityChange = async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock()
  }
}

onMounted(() => {
  dashboardStore.initConfig()
  requestWakeLock()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (wakeLock) {
    wakeLock.release()
    wakeLock = null
  }
})
</script>

<template>
  <div class="h-screen w-screen bg-[var(--dash-bg)] text-[var(--dash-text)] flex flex-col overflow-hidden">
    <!-- App Header (Optional, hidden in most modes) -->
    <header v-if="authStore.user" class="p-4 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity duration-500 absolute top-0 left-0 right-0 z-50">
      <div class="text-sm font-medium tracking-wider uppercase opacity-50">Dash</div>
      <div class="flex items-center gap-4">
        <button
          @click="toggleFullscreen"
          class="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
          :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
        >
          <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow relative">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Global Layout Overlays (Modals, etc.) -->
    <div id="modal-container"></div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
