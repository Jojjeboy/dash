import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'

export interface GNewsArticle {
    title: string
    description: string
    content: string
    url: string
    image: string
    publishedAt: string
    source: {
        name: string
        url: string
    }
}

export function useGNews(options: {
    maxItems: Ref<number>
    refreshIntervalMinutes: Ref<number>
    category: Ref<string>
}) {
    const articles = ref<GNewsArticle[]>([])
    const loading = ref(true)
    const error = ref<string | null>(null)
    let refreshTimer: number | null = null
    let abortController: AbortController | null = null

    const API_KEY = '59b92bdb4eeb21e87267b430748ceda3'

    const fetchNews = async () => {
        if (abortController) {
            abortController.abort()
        }
        abortController = new AbortController()

        loading.value = true
        error.value = null

        try {
            const category = options.category.value || 'general'
            const targetUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=sv&country=se&max=${options.maxItems.value}&apikey=${API_KEY}`
            const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`

            const response = await fetch(url, { signal: abortController.signal })
            if (!response.ok) {
                throw new Error(`GNews API error: ${response.statusText}`)
            }

            const data = await response.json()
            articles.value = data.articles || []
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return
            error.value = err instanceof Error ? err.message : 'Failed to fetch news'
            console.error('GNews fetch error:', err)
        } finally {
            loading.value = false
        }
    }

    const startRefreshTimer = () => {
        stopRefreshTimer()
        if (options.refreshIntervalMinutes.value > 0) {
            refreshTimer = window.setInterval(fetchNews, options.refreshIntervalMinutes.value * 60 * 1000)
        }
    }

    const stopRefreshTimer = () => {
        if (refreshTimer) {
            clearInterval(refreshTimer)
            refreshTimer = null
        }
    }

    onMounted(() => {
        fetchNews()
        startRefreshTimer()
    })

    onUnmounted(() => {
        stopRefreshTimer()
        if (abortController) {
            abortController.abort()
        }
    })

    // Watch for option changes
    watch([options.category, options.maxItems], () => {
        fetchNews()
    })

    watch(options.refreshIntervalMinutes, () => {
        startRefreshTimer()
    })

    return {
        articles,
        loading,
        error,
        refresh: fetchNews
    }
}
