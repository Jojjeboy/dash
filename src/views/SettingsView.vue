<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useRouter } from 'vue-router'
import { registry } from '@/widgets/registry'
import { computed } from 'vue'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const router = useRouter()

const availableWidgets = computed(() => registry.getAll())

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center p-8 bg-[var(--dash-bg)] transition-colors duration-700">
    <div class="max-w-md w-full glass-tile p-8 relative">
      <router-link to="/dashboard" class="absolute top-8 left-8 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-all">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold mb-8 text-[var(--dash-text)] text-center tracking-tight">Settings</h1>

      <div class="space-y-8">
        <!-- Appearance Section -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">Appearance</h2>
          </div>
          <div class="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              v-for="mode in ['dark', 'light'] as const"
              :key="mode"
              @click="dashboardStore.updateTheme(mode)"
              class="flex-1 py-3 text-xs font-bold rounded-xl transition-all capitalize"
              :class="dashboardStore.theme === mode ? 'bg-white text-[#1a1c1e] shadow-lg shadow-white/5' : 'text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-white/5'"
            >
              {{ mode }}
            </button>
          </div>
        </section>

        <!-- Layout Section -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">Layout Mode</h2>
          </div>
          <div class="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              v-for="mode in [4, 6, 8] as const"
              :key="mode"
              @click="dashboardStore.updateLayoutMode(mode)"
              class="flex-1 py-3 text-xs font-bold rounded-xl transition-all"
              :class="dashboardStore.layoutMode === mode ? 'bg-white text-[#1a1c1e] shadow-lg shadow-white/5' : 'text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-white/5'"
            >
              {{ mode }} Slots
            </button>
          </div>
        </section>

        <!-- Widgets Section -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">Widgets</h2>
          </div>
          <div class="space-y-3">
            <div
              v-for="slot in dashboardStore.slots"
              :key="slot.index"
              class="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5"
            >
              <span class="text-[10px] uppercase tracking-widest text-[var(--dash-text-muted)] font-black">Slot {{ slot.index + 1 }}</span>
              <select
                :value="slot.widgetId || ''"
                @change="(e) => dashboardStore.updateWidgetSlot(slot.index, (e.target as HTMLSelectElement).value)"
                class="bg-transparent text-xs font-bold text-[var(--dash-text)] outline-none cursor-pointer"
              >
                <option value="" class="bg-[#1a1c1e] text-white">Empty</option>
                <option
                  v-for="widget in availableWidgets"
                  :key="widget.id"
                  :value="widget.id"
                  class="bg-[#1a1c1e] text-white"
                >
                  {{ widget.title }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <!-- Account Section -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">Account</h2>
          </div>
          <div class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
               <img v-if="authStore.user?.photoURL" :src="authStore.user.photoURL" alt="Profile" class="w-full h-full object-cover">
               <span v-else class="text-lg font-bold text-[var(--dash-text)] uppercase">{{ authStore.user?.email?.charAt(0) }}</span>
            </div>
            <div class="flex-grow min-w-0">
              <p class="text-sm font-bold text-[var(--dash-text)] truncate">{{ authStore.user?.displayName || 'Family Member' }}</p>
              <p class="text-[10px] text-[var(--dash-text-muted)] truncate tracking-tight font-medium">{{ authStore.user?.email }}</p>
            </div>
          </div>
        </section>

        <!-- Danger Zone -->
        <section class="pt-6 border-t border-white/10">
          <button
            @click="handleLogout"
            class="w-full py-4 text-[10px] uppercase tracking-[0.15em] font-black text-red-400 bg-red-400/5 hover:bg-red-400/10 rounded-2xl border border-red-400/10 transition-all active:scale-[0.98] shadow-lg shadow-red-900/5 group"
          >
            <span class="group-hover:scale-110 transition-transform inline-block">Sign Out</span>
          </button>
        </section>

        <!-- Navigation -->
        <section class="pt-2 text-center">
          <router-link to="/dashboard" class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-all py-2 px-4 inline-block font-black active:scale-95">
            Dismiss
          </router-link>
        </section>
      </div>
    </div>
  </div>
</template>
