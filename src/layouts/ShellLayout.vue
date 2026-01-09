<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="h-screen w-screen bg-[#1a1c1e] text-[#e2e2e2] flex flex-col overflow-hidden">
    <!-- App Header (Optional, hidden in most modes) -->
    <header v-if="authStore.user" class="p-4 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity duration-500 absolute top-0 left-0 right-0 z-50">
      <div class="text-sm font-medium tracking-wider uppercase opacity-50">Dash</div>
      <button @click="logout" class="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
        Sign Out
      </button>
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
