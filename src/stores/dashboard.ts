import { ref, watch, computed } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { doc, onSnapshot, setDoc, serverTimestamp, type FieldValue } from 'firebase/firestore'
import { useAuthStore } from './auth'

export interface DashboardConfig {
  version: number
  layoutMode: 4 | 6
  theme: 'dark' | 'light'
  activeWidgetIds: string[] // Stored as 'id1', 'id2', etc. (No split slots)
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
  activeWidgetIds: ['datetime-today'], // Show Timer by default in slot 1
  calendarIcsPath: 'liakar1020@skola.goteborg.se.ics',
  newsConfig: {
    maxItems: 5,
    refreshIntervalMinutes: 30,
    defaultCategory: 'general'
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
      return {
        index: i,
        widgetId: rawWidgetIds[i] || null,
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
            const loadedConfig = docSnap.data() as DashboardConfig

            // Migration: Replace 'timer' with 'datetime-today' if present
            if (loadedConfig.activeWidgetIds) {
              loadedConfig.activeWidgetIds = loadedConfig.activeWidgetIds.map(id =>
                id === 'timer' ? 'datetime-today' : id
              )
            }

            config.value = loadedConfig
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

  // Helper to remove undefined values from objects (Firestore doesn't accept undefined)
  const removeUndefined = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(removeUndefined)

    const result: any = {}
    for (const key in obj) {
      if (obj[key] !== undefined) {
        result[key] = typeof obj[key] === 'object' ? removeUndefined(obj[key]) : obj[key]
      }
    }
    return result
  }

  // Persist config to Firestore
  const saveConfig = async (newConfig: Partial<DashboardConfig>) => {
    if (!authStore.user) return

    const configRef = doc(db, 'users', authStore.user.uid, 'config', 'dashboard')
    const mergedConfig = {
      ...DEFAULT_CONFIG,
      ...config.value,
      ...newConfig,
      updatedAt: serverTimestamp()
    }

    // Remove any undefined values before saving
    const finalConfig = removeUndefined(mergedConfig)

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

  const updateWidgetSlot = (index: number, widgetId: string | null) => {
    const currentIds = [...(config.value?.activeWidgetIds || DEFAULT_CONFIG.activeWidgetIds)]

    // Ensure the array is long enough
    while (currentIds.length <= index) {
      currentIds.push('')
    }

    currentIds[index] = widgetId || ''
    saveConfig({ activeWidgetIds: currentIds })
  }

  const updateCalendarPath = (path: string) => {
    saveConfig({ calendarIcsPath: path })
  }

  const updateNewsConfig = (newConfig: Partial<DashboardConfig['newsConfig']>) => {
    const currentConfig = config.value?.newsConfig || {
      maxItems: 5,
      refreshIntervalMinutes: 30,
      defaultCategory: 'general'
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
