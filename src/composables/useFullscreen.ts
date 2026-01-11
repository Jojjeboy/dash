import { ref, onMounted, onUnmounted } from 'vue'

export function useFullscreen() {
  const isFullscreen = ref(false)

  const updateFullscreenState = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', updateFullscreenState)
    updateFullscreenState()
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', updateFullscreenState)
  })

  return {
    isFullscreen,
    toggleFullscreen
  }
}
