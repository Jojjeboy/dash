import { ref, watch, computed } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { doc, onSnapshot, setDoc, serverTimestamp, type FieldValue } from 'firebase/firestore'
import { useAuthStore } from './auth'

export interface DashboardConfig {
  version: number
  layoutMode: 4 | 6 | 8
  theme: 'dark' | 'light'
  activeWidgetIds: string[]
  updatedAt?: FieldValue
}

const DEFAULT_CONFIG: DashboardConfig = {
  version: 1,
  layoutMode: 6,
  theme: 'dark',
  activeWidgetIds: ['timer'], // Show Timer by default in slot 1
}

export const useDashboardStore = defineStore('dashboard', () => {
  const authStore = useAuthStore()
  const config = ref<DashboardConfig | null>(null)
  const loading = ref(true)
  let unsubscribe: (() => void) | null = null

  // Computed helper to get a full list of slots based on layout mode
  const slots = computed(() => {
    const activeConfig = config.value || DEFAULT_CONFIG
    const count = activeConfig.layoutMode
    const widgetIds = activeConfig.activeWidgetIds || []

    return Array.from({ length: count }, (_, i) => ({
      index: i,
      widgetId: widgetIds[i] || null
    }))
  })

  // Load config from Firestore
  const initConfig = () => {
    watch(
      () => authStore.user,
      (user) => {
        if (unsubscribe) {
          unsubscribe()
          unsubscribe = null
        }

        if (!user) {
          config.value = null
          loading.value = false
          return
        }

        const configRef = doc(db, 'users', user.uid, 'config', 'dashboard')

        loading.value = true
        unsubscribe = onSnapshot(configRef, (docSnap) => {
          if (docSnap.exists()) {
            config.value = docSnap.data() as DashboardConfig
          } else {
            // Initialize with defaults if no config exists
            saveConfig(DEFAULT_CONFIG)
          }
          loading.value = false
        }, (error) => {
          console.error('Error fetching dashboard config:', error)
          loading.value = false
        })
      },
      { immediate: true }
    )
  }

  // Persist config to Firestore
  const saveConfig = async (newConfig: Partial<DashboardConfig>) => {
    if (!authStore.user) return

    const configRef = doc(db, 'users', authStore.user.uid, 'config', 'dashboard')
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...config.value,
      ...newConfig,
      updatedAt: serverTimestamp()
    }

    try {
      await setDoc(configRef, finalConfig, { merge: true })
    } catch (error) {
      console.error('Error saving dashboard config:', error)
    }
  }

  const updateLayoutMode = (mode: 4 | 6 | 8) => {
    saveConfig({ layoutMode: mode })
  }

  const updateTheme = (theme: 'dark' | 'light') => {
    saveConfig({ theme })
  }

  const updateWidgetSlot = (index: number, widgetId: string | null) => {
    const currentIds = [...(config.value?.activeWidgetIds || DEFAULT_CONFIG.activeWidgetIds)]

    // Ensure the array is long enough
    while (currentIds.length <= index) {
      currentIds.push('')
    }

    currentIds[index] = widgetId || ''
    saveConfig({ activeWidgetIds: currentIds })
  }

  return {
    config,
    loading,
    slots,
    initConfig,
    updateLayoutMode,
    updateTheme,
    updateWidgetSlot,
    layoutMode: computed(() => {
      if (!config.value) return DEFAULT_CONFIG.layoutMode
      return config.value.layoutMode
    }),
    theme: computed(() => config.value?.theme || DEFAULT_CONFIG.theme)
  }
})
