<script setup lang="ts">
import DashboardGrid from '@/components/DashboardGrid.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const dashboardStore = useDashboardStore()
const router = useRouter()
const pressTimer = ref<number | null>(null)

const startPress = () => {
  pressTimer.value = window.setTimeout(() => {
    router.push('/settings')
  }, 2000) // 2 second long press
}

const cancelPress = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value)
    pressTimer.value = null
  }
}
</script>

<template>
  <div
    class="h-full w-full select-none"
    @mousedown="startPress"
    @mouseup="cancelPress"
    @mouseleave="cancelPress"
    @touchstart.passive="startPress"
    @touchend.passive="cancelPress"
    @touchmove.passive="cancelPress"
  >
    <DashboardGrid
      :layout-mode="dashboardStore.layoutMode"
      :slots="dashboardStore.slots"
    />
  </div>
</template>
