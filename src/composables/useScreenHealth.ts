import { onMounted, onUnmounted } from 'vue'
import { screenHealthService, type WidgetHealthConfig } from '@/services/ScreenHealthService'

export function useScreenHealth(config: WidgetHealthConfig) {
    onMounted(() => {
        screenHealthService.registerWidget(config)
    })

    onUnmounted(() => {
        screenHealthService.unregisterWidget(config.widgetId)
    })

    return {
        // Expose helpers if needed in the future
    }
}
