<script setup lang="ts">
import DashboardGrid from '@/components/DashboardGrid.vue'
import { ref } from 'vue'

// This will eventually come from a store/firestore
const layoutMode = ref<4 | 6 | 8>(6)
</script>

<template>
  <div class="h-full w-full">
    <DashboardGrid :layout-mode="layoutMode" />
  </div>
</template>
