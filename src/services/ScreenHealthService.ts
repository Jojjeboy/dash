import { reactive, readonly, ref, computed } from 'vue'

export type ScreenHealthAction = 'microMotion' | 'pixelShift' | 'layoutSeed' | 'softRefresh'
export type OledRiskLevel = 'low' | 'medium' | 'high'
export type ScreenMode = 'day' | 'night' | 'idle'

export interface WidgetHealthConfig {
    widgetId: string
    oledRisk: OledRiskLevel
    supportedActions: ScreenHealthAction[]
    onAction: (action: ScreenHealthAction) => Promise<void>
}

interface ServiceState {
    mode: ScreenMode
    globalShiftX: number
    globalShiftY: number
    riskLevel: OledRiskLevel
    lastDraftTime: number
}

class ScreenHealthService {
    private static instance: ScreenHealthService

    // Reactive state exposed to the app
    private state = reactive<ServiceState>({
        mode: 'day',
        globalShiftX: 0,
        globalShiftY: 0,
        riskLevel: 'low',
        lastDraftTime: Date.now()
    })

    // Internal registry
    private widgets = new Map<string, WidgetHealthConfig>()
    private trackingInterval: number | null = null

    // Configuration constants
    private readonly INTERVAL_MS = 10000 // Check every 10s
    private readonly PIXEL_DRIFT_INTERVAL = 300000 // 5 mins
    private readonly MAX_DRIFT_PX = 8

    private constructor() {
        this.startMonitoring()
    }

    public static getInstance(): ScreenHealthService {
        if (!ScreenHealthService.instance) {
            ScreenHealthService.instance = new ScreenHealthService()
        }
        return ScreenHealthService.instance
    }

    // --- Public API ---

    public get globalShift() {
        return computed(() => ({
            x: this.state.globalShiftX,
            y: this.state.globalShiftY
        }))
    }

    public get currentMode() {
        return computed(() => this.state.mode)
    }

    public registerWidget(config: WidgetHealthConfig) {
        if (this.widgets.has(config.widgetId)) {
            console.warn(`[ScreenHealth] Widget ${config.widgetId} already registered. Overwriting.`)
        }
        this.widgets.set(config.widgetId, config)
        console.log(`[ScreenHealth] Registered widget: ${config.widgetId}`, config)
    }

    public unregisterWidget(widgetId: string) {
        if (this.widgets.delete(widgetId)) {
            console.log(`[ScreenHealth] Unregistered widget: ${widgetId}`)
        }
    }

    public setMode(mode: ScreenMode) {
        console.log(`[ScreenHealth] Mode changed: ${this.state.mode} -> ${mode}`)
        this.state.mode = mode
        this.evaluateRisk()
    }

    // --- Internal Logic ---

    private startMonitoring() {
        if (this.trackingInterval) return
        console.log('[ScreenHealth] Service started')
        this.trackingInterval = window.setInterval(() => {
            this.tick()
        }, this.INTERVAL_MS)
    }

    private tick() {
        const now = Date.now()

        // 1. Check Global Pixel Drift
        if (now - this.state.lastDraftTime > this.PIXEL_DRIFT_INTERVAL) {
            this.applyGlobalDrift()
            this.state.lastDraftTime = now
        }

        // 2. Randomly trigger micro-motions on supported widgets
        // This is a simplified policy: pick one eligible widget and trigger action
        this.attemptWidgetAction()
    }

    private applyGlobalDrift() {
        // Generate random shift within range
        const x = Math.floor(Math.random() * (this.MAX_DRIFT_PX * 2 + 1)) - this.MAX_DRIFT_PX
        const y = Math.floor(Math.random() * (this.MAX_DRIFT_PX * 2 + 1)) - this.MAX_DRIFT_PX

        console.log(`[ScreenHealth] Applying global pixel drift: (${x}px, ${y}px)`)

        // Animate to new values (simple step for now, could be smoothed by CSS transitions)
        this.state.globalShiftX = x
        this.state.globalShiftY = y
    }

    private attemptWidgetAction() {
        if (this.widgets.size === 0) return

        // Simple policy: 10% chance per tick to trigger micro-motion on a random widget
        if (Math.random() > 0.1) return

        const widgetIds = Array.from(this.widgets.keys())
        const randomId = widgetIds[Math.floor(Math.random() * widgetIds.length)]
        if (!randomId) return

        const widget = this.widgets.get(randomId)

        if (widget && widget.supportedActions.includes('microMotion')) {
            console.log(`[ScreenHealth] Triggering microMotion for ${randomId}`)
            widget.onAction('microMotion').catch(err => {
                console.error(`[ScreenHealth] Error executing action for ${randomId}:`, err)
            })
        }
    }

    private evaluateRisk() {
        // Placeholder for more complex risk logic
        // Could track total uptime, average pixel brightness, etc.
        if (this.state.mode === 'idle') {
            this.state.riskLevel = 'low'
        } else {
            this.state.riskLevel = 'medium'
        }
    }
}

export const screenHealthService = ScreenHealthService.getInstance()
