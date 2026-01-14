<script setup lang="ts">
import ShellLayout from '@/layouts/ShellLayout.vue'
import { screenHealthService } from '@/services/ScreenHealthService'
import { useDashboardStore } from '@/stores/dashboard'
import { watch, computed } from 'vue'

const dashboardStore = useDashboardStore()

// Sync theme with body class
watch(() => dashboardStore.theme, (theme) => {
  if (theme === 'light') {
    document.body.classList.add('light-mode')
  } else {
    document.body.classList.remove('light-mode')
  }
}, { immediate: true })

// Global Pixel Drift
const healthShift = screenHealthService.globalShift
const containerStyle = computed(() => ({
  transform: `translate(${healthShift.value.x}px, ${healthShift.value.y}px)`,
  transition: 'transform 2s ease-in-out' // Smooth transition for drift
}))
</script>

<template>
  <div class="app-root" :style="containerStyle">
    <ShellLayout />
  </div>
</template>

<style scoped>
.app-root {
  width: 100%;
  height: 100%;
  overflow: hidden; 
}
</style>
