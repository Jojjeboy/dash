<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScreenHealth } from '@/composables/useScreenHealth'

// Screen Health Integration
const widgetRef = ref<HTMLElement | null>(null)
useScreenHealth({
  widgetId: 'smhi-weather',
  oledRisk: 'low',
  supportedActions: ['microMotion'],
  onAction: async (action) => {
    if (action === 'microMotion' && widgetRef.value) {
      console.log('SmhiWidget: Executing micro-motion')
      // Simple transform wiggle
      const el = widgetRef.value
      el.style.transform = 'translate(1px, 1px)'
      setTimeout(() => {
        el.style.transform = 'translate(-1px, -1px)'
        setTimeout(() => {
          el.style.transform = 'none'
        }, 1000)
      }, 1000)
    }
  }
})

interface DailyWeather {
  date: string
  min: number
  max: number
  symbol: number
  precip: number
  windGust: number
}

interface WeatherData {
  days: DailyWeather[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const weather = ref<WeatherData | null>(null)
const lastUpdated = ref<Date | null>(null)

  
const SMHI_URL = 'https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/11.9281/lat/57.6710/data.json'

// Mapping SMHI Wsymb2 codes to emojis/descriptions
// 1-27 scale. Simplified mapping.
// Mapping available here: https://opendata.smhi.se/apidocs/metfcst/parameters.html#parameter-wsymb2
const Wsymb2TextMap: Record<number, string> = {
  1: 'Klart',
  2: 'Nästan klart',
  3: 'Växlande molnighet',
  4: 'Halvklart',
  5: 'Molnigt',
  6: 'Mulet',
  7: 'Dimma',
  8: 'Lätt regnskur',
  9: 'Regnskur',
  10: 'Kraftig regnskur',
  11: 'Åskskur',
  12: 'Lätt snöblandat regn',
  13: 'Snöblandat regn',
  14: 'Kraftigt snöblandat regn',
  15: 'Lätt snöfall',
  16: 'Snöfall',
  17: 'Kraftigt snöfall',
  18: 'Lätt regn',
  19: 'Regn',
  20: 'Kraftigt regn',
  21: 'Åska',
  22: 'Lätt snöblandat regn',
  23: 'Snöblandat regn',
  24: 'Kraftigt snöblandat regn',
  25: 'Lätt snöfall',
  26: 'Snöfall',
  27: 'Kraftigt snöfall',
}

const getSymbolText = (code: number): string => {
  return Wsymb2TextMap[code] || ''
}

const getSymbolIcon = (code: number): string => {
  if (code <= 2) return '☀️' // Clear sky
  if (code <= 4) return '⛅' // Variable cloudiness
  if (code <= 6) return '☁️' // Overcast
  if (code <= 10) return '🌫️' // Mist/Fog
  if (code <= 20) return '🌧️' // Rain
  if (code <= 24) return '🌨️' // Snow
  if (code <= 27) return '⛈️' // Thunder
  return '❓'
}

const fetchWeather = async () => {
  try {
    loading.value = true
    const response = await fetch(SMHI_URL)
    if (!response.ok) throw new Error('Failed to fetch weather')
    
    const data = await response.json()
    processData(data)
    lastUpdated.value = new Date()
  } catch (e) {
    error.value = 'Could not load weather'
    console.error(e)
  } finally {
    loading.value = false
  }
}

interface SmhiParameter {
  name: string
  values: number[]
}

interface SmhiTimeSeriesEntry {
  validTime: string
  parameters: SmhiParameter[]
}

interface SmhiResponse {
  timeSeries: SmhiTimeSeriesEntry[]
}

const processData = (data: SmhiResponse) => {
  const timeSeries = data.timeSeries
  if (!timeSeries || timeSeries.length === 0) return

  // Group by day
  const dailyGroups: Record<string, SmhiTimeSeriesEntry[]> = {}
  
  timeSeries.forEach((entry) => {
    const date = entry.validTime.split('T')[0] ?? ''
    if (!date) return
    if (!dailyGroups[date]) {
      dailyGroups[date] = []
    }
    dailyGroups[date]?.push(entry)
  })

  const sortedDates = Object.keys(dailyGroups).sort()
  // Take today + next 3 days = 4 days total
  const targetDates = sortedDates.slice(0, 4)

  const days = targetDates.map(date => {
    const entries = dailyGroups[date]
    if (!entries) return null

    // Temps
    const temps = entries.flatMap(e => e.parameters.find((p) => p.name === 't')?.values || [])
    const min = Math.round(Math.min(...temps))
    const max = Math.round(Math.max(...temps))

    // Symbol (noon)
    const noonIndex = Math.floor(entries.length / 2)
    const symbolParam = entries[noonIndex]?.parameters.find((p) => p.name === 'Wsymb2')
    const symbol = symbolParam?.values[0] || 1

    // Wind Gust (max)
    const gusts = entries.flatMap(e => e.parameters.find((p) => p.name === 'gust')?.values || [])
    const windGust = gusts.length ? Math.round(Math.max(...gusts)) : 0

    // Precip (pmean * duration)
    // Calculate duration for each entry
    let totalPrecip = 0
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        if (!entry) continue
        const pmean = entry.parameters.find(p => p.name === 'pmean')?.values[0] || 0
        if (pmean > 0) {
            // Determine duration of this step. 
            // Default to 1 hour if last entry, or diff to next entry
            // But we need to check the full timeSeries to find the next validTime, 
            // because dailyGroups is split.
            // Simplified: SMHI usually provides hourly data for near term.
            // Let's look slightly more robust:
            const currentT = new Date(entry.validTime).getTime()
            // Find this entry in the main list to see next entry
            const originalIndex = timeSeries.findIndex(e => e === entry)
            const nextEntry = timeSeries[originalIndex + 1]
            let durationHours = 1
            if (nextEntry) {
                const nextT = new Date(nextEntry.validTime).getTime()
                durationHours = (nextT - currentT) / (1000 * 60 * 60)
            }
            totalPrecip += pmean * durationHours
        }
    }
    
    return {
      date,
      min,
      max,
      symbol,
      precip: Math.round(totalPrecip * 10) / 10, // Round to 1 decimal
      windGust
    }
  }).filter((item): item is NonNullable<typeof item> => item !== null)

  weather.value = { days }
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  const checkDate = new Date(d)
  checkDate.setHours(0, 0, 0, 0)

  if (checkDate.getTime() === tomorrow.getTime()) return 'Imorgon'
  if (checkDate.getTime() === dayAfterTomorrow.getTime()) return 'Övermorgon'

  return d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric' })
}

const emit = defineEmits(['update-title'])

onMounted(() => {
  fetchWeather()
  emit('update-title', 'Väder')
})
</script>

<template>
  <div ref="widgetRef" class="h-full flex flex-col items-center justify-between p-4 box-border transition-transform duration-1000">
    <!-- Loading/Error -->
    <div v-if="loading" class="flex-1 flex items-center justify-center opacity-50">
      Wait...
    </div>
    
    <div v-else-if="error" class="flex-1 flex items-center justify-center text-red-400 text-xs text-center">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-if="weather && weather.days.length" class="w-full h-full flex flex-col">
      <!-- 2x2 Grid -->
      <div class="flex-1 grid grid-cols-2 grid-rows-2 gap-2">
        <!-- Today (Index 0) -->
        <div class="bg-white/5 rounded-lg flex flex-col items-center p-3 relative" v-if="weather.days[0]">
          <div class="text-xs uppercase tracking-widest opacity-40 font-bold w-full text-center mb-1">Idag</div>
          
          <div class="flex-1 flex flex-col items-center justify-center w-full gap-1">
            <div class="flex items-center gap-3">
                <div class="text-5xl drop-shadow-sm">{{ getSymbolIcon(weather.days[0].symbol) }}</div>
                <div class="flex flex-col">
                    <span class="text-4xl font-black tracking-tighter leading-none">{{ weather.days[0].max }}°</span>
                    <span class="text-sm opacity-50 leading-none font-bold mt-0.5">{{ weather.days[0].min }}°</span>
                </div>
            </div>
            
            <div class="text-[10px] uppercase tracking-widest opacity-40 font-black text-center line-clamp-1 mt-1">
              {{ getSymbolText(weather.days[0].symbol) }}
            </div>
          </div>

          <!-- Bottom Row: Precip & Wind -->
          <div class="flex w-full justify-between items-center text-[10px] opacity-60 px-1 mt-1 font-bold">
              <div class="flex items-center gap-1" title="Total nederbörd">
                  <span>💧</span>
                  <span>{{ weather.days[0].precip }}</span>
              </div>
              <div class="flex items-center gap-1" title="Max vindby">
                  <span>💨</span>
                  <span>{{ weather.days[0].windGust }}</span>
              </div>
          </div>
        </div>

        <!-- Forecast Days (Next 3) -->
        <div 
          v-for="day in weather.days.slice(1)" 
          :key="day.date"
          class="bg-white/5 rounded-lg flex flex-col items-center p-3 relative"
        >
          <div class="text-xs uppercase tracking-widest opacity-40 font-bold w-full text-center mb-1">
            {{ formatDate(day.date) }}
          </div>
          
          <div class="flex-1 flex flex-col items-center justify-center w-full gap-1">
            <div class="flex items-center gap-3">
               <div class="text-5xl drop-shadow-sm">{{ getSymbolIcon(day.symbol) }}</div>
               <div class="flex flex-col">
                  <span class="text-4xl font-black tracking-tighter leading-none">{{ day.max }}°</span>
                  <span class="text-sm opacity-50 leading-none font-bold mt-0.5">{{ day.min }}°</span>
               </div>
            </div>

            <div class="text-[10px] uppercase tracking-widest opacity-40 font-black text-center line-clamp-1 w-full overflow-hidden mt-1">
              {{ getSymbolText(day.symbol) }}
            </div>
          </div>

           <!-- Bottom Row: Precip & Wind -->
          <div class="flex w-full justify-between items-center text-[10px] opacity-60 px-1 mt-1 font-bold">
              <div class="flex items-center gap-1">
                  <span>💧</span>
                  <span>{{ day.precip }}</span>
              </div>
              <div class="flex items-center gap-1">
                  <span>💨</span>
                  <span>{{ day.windGust }}</span>
              </div>
          </div>
        </div>
      </div>

      <!-- Last Updated -->
      <div v-if="lastUpdated" class="w-full text-[9px] opacity-20 text-center mt-2">
        {{ lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed, but using Tailwind mostly */
</style>
