<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

const SMHI_URL = 'https://opendata.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/11.9281/lat/57.6710/data.json'

// Mapping SMHI Wsymb2 codes to emojis/descriptions
// 1-27 scale. Simplified mapping.
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
  return d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric' })
}

onMounted(() => {
  fetchWeather()
})
</script>

<template>
  <div class="h-full flex flex-col items-center justify-between p-4 box-border">
    <!-- Loading/Error -->
    <div v-if="loading" class="flex-1 flex items-center justify-center opacity-50">
      Wait...
    </div>
    
    <div v-else-if="error" class="flex-1 flex items-center justify-center text-red-400 text-xs text-center">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else-if="weather" class="w-full flex flex-col h-full">
      <!-- Current -->
      <div class="flex-1 flex flex-col items-center justify-center mb-2">
        <div class="text-5xl mb-1">{{ getSymbolIcon(weather.current.symbol) }}</div>
        <div class="text-4xl font-bold tracking-tighter">
          {{ weather.current.temp }}°
        </div>
      </div>

      <!-- Forecast -->
      <div class="w-full flex flex-col gap-2">
        <div 
          v-for="day in weather.forecast" 
          :key="day.date"
          class="flex items-center justify-between text-sm bg-white/5 rounded px-2 py-1"
        >
          <span class="capitalize w-12 font-medium opacity-80">{{ formatDate(day.date) }}</span>
          <span class="text-lg">{{ getSymbolIcon(day.symbol) }}</span>
          <div class="flex gap-2 w-16 justify-end font-mono text-xs opacity-70">
            <span>{{ day.max }}°</span>
            <span class="opacity-50 text-[10px] self-end">{{ day.min }}°</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed, but using Tailwind mostly */
</style>
