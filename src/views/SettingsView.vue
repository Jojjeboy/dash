<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useRouter } from 'vue-router'
import { registry } from '@/widgets/registry'
import { computed, ref, onMounted, defineAsyncComponent } from 'vue'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const router = useRouter()
const { updateServiceWorker } = useRegisterSW()

const availableWidgets = computed(() => registry.getAll())

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const lastCommitMessage = __LAST_COMMIT_MESSAGE__
const commitHash = __COMMIT_HASH__
const buildTime = new Date(__BUILD_TIME__).toLocaleString('sv-SE', {
  dateStyle: 'short',
  timeStyle: 'short'
})

interface Commit {
  hash: string
  fullHash: string
  date: string
  message: string
}

const commitHistory = ref<Commit[]>([])
const loadingHistory = ref(true)

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}commits.json`)
    if (response.ok) {
      commitHistory.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to load commit history:', error)
  } finally {
    loadingHistory.value = false
  }
})




</script>

<template>
  <div class="h-full w-full flex flex-col p-4 md:p-8 bg-[var(--dash-bg)] transition-colors duration-700 overflow-y-auto">
    <div class="max-w-md w-full mx-auto glass-tile p-6 md:p-8 relative">
      <router-link to="/dashboard" class="absolute top-8 left-8 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-all">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold mb-8 text-[var(--dash-text)] text-center tracking-tight">{{ $t('settings') }}</h1>

      <div class="space-y-8">
        <!-- Appearance Section -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">{{ $t('appearance') }}</h2>
          </div>
          <div class="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              v-for="mode in ['dark', 'light'] as const"
              :key="mode"
              @click="dashboardStore.updateTheme(mode)"
              class="flex-1 py-3 text-xs font-bold rounded-xl transition-all capitalize"
              :class="dashboardStore.theme === mode ? 'bg-white text-[#1a1c1e] shadow-lg shadow-white/5' : 'text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-white/5'"
            >
              {{ $t(mode) }}
            </button>
          </div>
        </section>

        <!-- Layout Section -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">{{ $t('layoutMode') }}</h2>
          </div>
          <div class="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              v-for="mode in [4, 6] as const"
              :key="mode"
              @click="dashboardStore.updateLayoutMode(mode)"
              class="flex-1 py-3 text-xs font-bold rounded-xl transition-all"
              :class="dashboardStore.layoutMode === mode ? 'bg-white text-[#1a1c1e] shadow-lg shadow-white/5' : 'text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-white/5'"
            >
              {{ mode }} {{ $t('slots') }}
            </button>
          </div>
        </section>

        <!-- Widget Configuration Section -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">{{ $t('widgets') }}</h2>
          </div>
          <div class="space-y-3">
            <details
              v-for="widget in availableWidgets"
              :key="widget.id"
              class="group bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 open:bg-white/10"
            >
              <summary class="flex items-center justify-between p-4 cursor-pointer select-none list-none outline-none">
                <div class="flex items-center gap-3">
                  <div class="flex flex-col text-left">
                    <span class="text-xs font-bold text-[var(--dash-text)] group-hover:text-white transition-colors">{{ widget.title }}</span>
                    <span class="text-[9px] text-[var(--dash-text-muted)] font-medium">{{ widget.description || $t('settings') }}</span>
                  </div>
                </div>
                <!-- Chevron Icon -->
                <svg 
                  class="w-4 h-4 text-[var(--dash-text-muted)] transition-transform duration-300 group-open:rotate-180" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              
              <div class="p-4 pt-0 border-t border-white/5 mt-4">
                <component
                  v-if="widget.settingsComponent"
                  :is="defineAsyncComponent(widget.settingsComponent)"
                />
                <div v-else class="py-2 text-[10px] text-[var(--dash-text-muted)] italic text-center opacity-50">
                  {{ $t('noSettingsForWidget') }}
                </div>
              </div>
            </details>
          </div>
        </section>

        <!-- Updates & History Section -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">{{ $t('updatesAndBuildInfo') }}</h2>
          </div>
          <div class="bg-white/5 rounded-2xl border border-white/5 shadow-inner overflow-hidden">
            <!-- Latest Build Info -->
            <div class="p-4 border-b border-white/5">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div class="space-y-1">
                  <p class="text-xs font-bold text-[var(--dash-text)] opacity-90 leading-relaxed">{{ lastCommitMessage }}</p>
                  <div class="flex items-center gap-3 text-[9px] uppercase tracking-wider font-bold text-[var(--dash-text-muted)]">
                     <span>{{ commitHash }}</span>
                     <span>{{ buildTime }}</span>
                  </div>
                </div>
                <button
                  @click="updateServiceWorker()"
                  class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[10px] uppercase tracking-wider font-black text-[var(--dash-text)] rounded-lg transition-all active:scale-95 whitespace-nowrap"
                >
                  {{ $t('checkUpdates') }}
                </button>
              </div>
            </div>

             <!-- History List -->
             <div v-if="commitHistory.length > 0" class="max-h-40 overflow-y-auto custom-scrollbar bg-black/20">
                <div
                  v-for="commit in commitHistory"
                  :key="commit.fullHash"
                  class="p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <p class="text-[10px] font-medium text-[var(--dash-text)] leading-tight mb-1 opacity-80">{{ commit.message }}</p>
                  <div class="flex items-center justify-between text-[8px] uppercase tracking-wider font-bold text-[var(--dash-text-muted)]">
                    <span>{{ commit.hash }}</span>
                    <span>{{ new Date(commit.date).toLocaleDateString('sv-SE') }}</span>
                  </div>
                </div>
             </div>
          </div>
        </section>


        <!-- Account Section (Moved to Bottom) -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-text-muted)] font-black">{{ $t('account') }}</h2>
          </div>
          <div class="p-1 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
             <div class="p-4 flex items-center gap-4 border-b border-white/5 mb-1 pb-4">
                <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                   <img v-if="authStore.user?.photoURL" :src="authStore.user.photoURL" alt="Profile" class="w-full h-full object-cover">
                   <span v-else class="text-lg font-bold text-[var(--dash-text)] uppercase">{{ authStore.user?.email?.charAt(0) }}</span>
                </div>
                <div class="flex-grow min-w-0">
                   <p class="text-sm font-bold text-[var(--dash-text)] truncate">{{ authStore.user?.displayName || $t('familyMember') }}</p>
                  <p class="text-[10px] text-[var(--dash-text-muted)] truncate tracking-tight font-medium">{{ authStore.user?.email }}</p>
                </div>
             </div>
             <button
               @click="handleLogout"
               class="w-full py-3 text-[10px] uppercase tracking-[0.15em] font-black text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-[0.98] group flex items-center justify-center gap-2"
             >
                <span>{{ $t('signOut') }}</span>
               <svg class="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
             </button>
          </div>
        </section>


      </div>
    </div>
  </div>
</template>
