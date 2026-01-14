import { ref, watch, computed } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { doc, onSnapshot, setDoc, serverTimestamp, type FieldValue } from 'firebase/firestore'
import { useAuthStore } from './auth'

export interface DashboardConfig {
  version: number
  layoutMode: 4 | 6
  theme: 'dark' | 'light'
  activeWidgetIds: string[] // Stored as 'id1' or 'id1|id2' for split slots
  calendarIcsPath?: string
  newsConfig: {
    maxItems: number
    refreshIntervalMinutes: number
    defaultCategory?: string
  }
  updatedAt?: FieldValue
}

const DEFAULT_CONFIG: DashboardConfig = {
  version: 1,
  layoutMode: 6,
  theme: 'dark',
  activeWidgetIds: ['timer'], // Show Timer by default in slot 1
  calendarIcsPath: 'liakar1020@skola.goteborg.se.ics',
  newsConfig: {
    maxItems: 5,
    refreshIntervalMinutes: 30,
    defaultCategory: undefined
  }
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
    const rawWidgetIds = activeConfig.activeWidgetIds || []

    return Array.from({ length: count }, (_, i) => {
      const rawId = rawWidgetIds[i] || null
      // Parse split slots (stored as 'id1|id2')
      const widgetId = (typeof rawId === 'string' && rawId.includes('|'))
        ? rawId.split('|')
        : (rawId || null)

      return {
        index: i,
        widgetId,
      }
    })
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

  const updateLayoutMode = (mode: 4 | 6) => {
    saveConfig({ layoutMode: mode })
  }

  const updateTheme = (theme: 'dark' | 'light') => {
    saveConfig({ theme })
  }

  const updateWidgetSlot = (index: number, widgetId: string | string[] | null) => {
    const currentIds = [...(config.value?.activeWidgetIds || DEFAULT_CONFIG.activeWidgetIds)]

    // Ensure the array is long enough
    while (currentIds.length <= index) {
      currentIds.push('')
    }

    // Serialize split slots to string before saving to Firebase
    const serializedId = Array.isArray(widgetId)
      ? widgetId.join('|')
      : (widgetId || '')

    currentIds[index] = serializedId
    saveConfig({ activeWidgetIds: currentIds })
  }

  const updateCalendarPath = (path: string) => {
    saveConfig({ calendarIcsPath: path })
  }

  const updateNewsConfig = (newConfig: Partial<DashboardConfig['newsConfig']>) => {
    const currentConfig = config.value?.newsConfig || {
      maxItems: 5,
      refreshIntervalMinutes: 30,
      defaultCategory: undefined
    }
    saveConfig({
      newsConfig: {
        ...currentConfig,
        ...newConfig
      }
    })
  }



  return {
    config,
    loading,
    slots,
    initConfig,
    updateLayoutMode,
    updateTheme,
    updateWidgetSlot,
    updateCalendarPath,
    updateNewsConfig,
    layoutMode: computed(() => {
      if (!config.value) return DEFAULT_CONFIG.layoutMode
      return config.value.layoutMode
    }),
    theme: computed(() => config.value?.theme || DEFAULT_CONFIG.theme)
  }
})
