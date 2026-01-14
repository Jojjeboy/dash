<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboard'
import { useI18n } from 'vue-i18n'

const dashboardStore = useDashboardStore()
const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
      <label class="block text-[10px] uppercase tracking-wider font-bold text-[var(--dash-text-muted)] mb-2">
        {{ t('icsFilePath') }}
      </label>
      <input
        type="text"
        :value="dashboardStore.config?.calendarIcsPath || 'liakar1020@skola.goteborg.se.ics'"
        @input="(e) => dashboardStore.updateCalendarPath((e.target as HTMLInputElement).value)"
        class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-[var(--dash-text)] placeholder-[var(--dash-text-muted)] focus:outline-none focus:border-white/20 transition-colors"
        placeholder="liakar1020@skola.goteborg.se.ics"
      />
      <p class="text-[9px] text-[var(--dash-text-muted)] mt-2 italic">
        {{ t('icsFilePathDescription') }}
      </p>
    </div>
  </div>
</template>
