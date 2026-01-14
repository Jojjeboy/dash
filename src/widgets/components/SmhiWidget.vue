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

interface WeatherData {
  current: {
    temp: number
    symbol: number
  }
  forecast: Array<{
    date: string
    min: number
    max: number
    symbol: number
  }>
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

  // Current weather (first valid entry)
  // Parameters: t = temp, wsymb2 = symbol
  // Current weather (first valid entry)
  const currentEntry = timeSeries[0]
  if (!currentEntry) return

  const currentTempParam = currentEntry.parameters.find((p) => p.name === 't')
  const currentSymbolParam = currentEntry.parameters.find((p) => p.name === 'Wsymb2')

  const current = {
    temp: Math.round(currentTempParam?.values[0] || 0),
    symbol: currentSymbolParam?.values[0] || 1
  }

  // Forecast: Group by day
  const dailyGroups: Record<string, SmhiTimeSeriesEntry[]> = {}
  
  timeSeries.forEach((entry) => {
    const date = entry.validTime.split('T')[0] ?? ''
    if (!date) return
    if (!dailyGroups[date]) {
      dailyGroups[date] = []
    }
    dailyGroups[date]?.push(entry)
  })

  // Get next 3 days (excluding today if existing or just next few distinct days)
  const sortedDates = Object.keys(dailyGroups).sort()
  // We include today in forecast or not? Request said "Short forecast for coming days".
  // Let's skip the first date if it's strictly "today" and we already show current, 
  // but to be safe and simple let's just show next 3 distinct entries including or after today.
  // Actually usually current is today, so forecast is usually tomorrow+.
  // Let's take the NEXT 3 days.
  const today = new Date().toISOString().split('T')[0] ?? ''
  const forecastDates = sortedDates.filter(d => d > today).slice(0, 3)

  const forecast = forecastDates.map(date => {
    const entries = dailyGroups[date]
    if (!entries) return null

    const temps = entries.flatMap(e => e.parameters.find((p) => p.name === 't')?.values || [])
    if (temps.length === 0) return null

    const min = Math.round(Math.min(...temps))
    const max = Math.round(Math.max(...temps))
    
    // Pick symbol from noon (approx middle of array)
    const noonIndex = Math.floor(entries.length / 2)
    const symbolParam = entries[noonIndex]?.parameters.find((p) => p.name === 'Wsymb2')
    const symbol = symbolParam?.values[0] || 1

    return {
      date, // YYYY-MM-DD
      min,
      max,
      symbol
    }
  }).filter((item): item is NonNullable<typeof item> => item !== null)

  weather.value = { current, forecast }
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

onMounted(() => {
  fetchWeather()
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
    <div v-else-if="weather" class="w-full h-full flex flex-col">
      <!-- 2x2 Grid -->
      <div class="flex-1 grid grid-cols-2 grid-rows-2 gap-2">
        <!-- Today (Current) -->
        <div class="bg-white/5 rounded-lg flex flex-col items-center justify-center p-3 relative">
          <div class="text-xs uppercase tracking-widest opacity-40 font-bold absolute top-2 left-0 right-0 text-center">Idag</div>
          <div class="text-4xl mb-1">{{ getSymbolIcon(weather.current.symbol) }}</div>
          <div class="text-3xl font-bold tracking-tighter">{{ weather.current.temp }}°</div>
          <div class="text-[10px] uppercase tracking-wider opacity-50 font-medium mt-0.5">
            {{ getSymbolText(weather.current.symbol) }}
          </div>
        </div>

        <!-- Forecast Days (up to 3) -->
        <div 
          v-for="day in weather.forecast.slice(0, 3)" 
          :key="day.date"
          class="bg-white/5 rounded-lg flex flex-col items-center justify-center p-3 relative"
        >
          <div class="text-xs uppercase tracking-widest opacity-40 font-bold absolute top-2 left-0 right-0 text-center">
            {{ formatDate(day.date) }}
          </div>
          <div class="text-3xl mb-1">{{ getSymbolIcon(day.symbol) }}</div>
          <div class="flex gap-1.5 items-baseline font-mono">
            <span class="text-2xl font-bold tracking-tight">{{ day.max }}°</span>
            <span class="text-sm opacity-50">{{ day.min }}°</span>
          </div>
          <div class="text-[10px] uppercase tracking-wider opacity-50 font-medium mt-0.5">
            {{ getSymbolText(day.symbol) }}
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
