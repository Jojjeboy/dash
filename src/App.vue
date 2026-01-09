<script setup lang="ts">
import ShellLayout from '@/layouts/ShellLayout.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { watch } from 'vue'

const dashboardStore = useDashboardStore()

// Sync theme with body class
watch(() => dashboardStore.theme, (theme) => {
  if (theme === 'light') {
    document.body.classList.add('light-mode')
  } else {
    document.body.classList.remove('light-mode')
  }
}, { immediate: true })
</script>

<template>
  <ShellLayout />
</template>
