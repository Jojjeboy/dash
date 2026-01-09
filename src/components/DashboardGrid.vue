<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  layoutMode: 4 | 6 | 8
}

const props = withDefaults(defineProps<Props>(), {
  layoutMode: 6
})

const gridClasses = computed(() => {
  switch (props.layoutMode) {
    case 4:
      return 'grid-cols-2 grid-rows-2'
    case 6:
      return 'grid-cols-3 grid-rows-2'
    case 8:
      return 'grid-cols-4 grid-rows-2'
    default:
      return 'grid-cols-3 grid-rows-2'
  }
})

// Generate placeholder slots for now
const slots = computed(() => Array.from({ length: props.layoutMode }, (_, i) => i))
</script>

<template>
  <div class="h-full w-full p-4 md:p-6 lg:p-8 overflow-hidden">
    <div
      class="grid gap-4 md:gap-6 lg:gap-8 h-full w-full transition-all duration-500 ease-in-out"
      :class="gridClasses"
    >
      <div
        v-for="slot in slots"
        :key="slot"
        class="glass-tile flex items-center justify-center relative group overflow-hidden"
      >
        <!-- Slot Content Overlay (for future widget insertion) -->
        <div class="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
          <span class="text-4xl font-black text-white/10 uppercase tracking-tighter select-none">Slot {{ slot + 1 }}</span>
        </div>

        <!-- Placeholder for actual widget component -->
        <div class="z-10 text-center">
             <!-- Widget will be injected here -->
             <div class="text-xs uppercase tracking-widest text-white/30 font-bold mb-1">Widget Area</div>
             <div class="w-12 h-1 bg-white/10 mx-auto rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the grid container respects the 16:10 aspect ratio if desired,
   though the ShellLayout currently gives it the full viewport */
</style>
