<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const {
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()

const lastCommitMessage = __LAST_COMMIT_MESSAGE__

const close = () => {
  needRefresh.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-4 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-4 opacity-0"
  >
    <div v-if="needRefresh" class="fixed bottom-6 right-6 z-[100] max-w-sm w-full">
      <div class="glass-tile p-6 shadow-2xl border border-white/10">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6 text-[var(--dash-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div class="flex-grow min-w-0">
            <h3 class="text-sm font-bold text-[var(--dash-text)] mb-1">{{ $t('newVersionAvailable') }}</h3>
            <p class="text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider font-black mb-3">{{ $t('updateToGetLatestFeatures') }}</p>

            <div class="p-3 bg-white/5 rounded-xl border border-white/5 mb-4">
              <p class="text-xs font-medium text-[var(--dash-text)] opacity-80 leading-relaxed italic">"{{ lastCommitMessage }}"</p>
            </div>

            <div class="flex gap-2">
              <button
                @click="updateServiceWorker()"
                class="flex-1 py-2 text-[10px] uppercase tracking-wider font-black bg-white text-[#1a1c1e] rounded-lg hover:bg-white/90 transition-all active:scale-95"
              >
                {{ $t('updateNow') }}
              </button>
              <button
                @click="close"
                class="px-4 py-2 text-[10px] uppercase tracking-wider font-black text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-all"
              >
                {{ $t('later') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
