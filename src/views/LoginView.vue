<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const authStore = useAuthStore()
const router = useRouter()
const isLoggingIn = ref(false)

const handleLogin = async () => {
  isLoggingIn.value = true
  try {
    await authStore.loginWithGoogle()
    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<template>
  <main class="h-screen w-screen flex items-center justify-center p-6 bg-[var(--dash-bg)] transition-colors duration-700">
    <div class="max-w-md w-full glass-tile p-12 text-center flex flex-col items-center">
      <div class="mb-8">
        <h1 class="text-5xl font-black tracking-tighter mb-2 text-[var(--dash-text)]">Dash</h1>
        <p class="text-[var(--dash-text-muted)] uppercase tracking-[0.2em] text-xs font-bold">Personal Dashboard</p>
      </div>

      <p class="text-[var(--dash-text-muted)] mb-10 leading-relaxed">
        A calm, glanceable overview of your home.<br>
        Please sign in to continue.
      </p>

      <button
        @click="handleLogin"
        :disabled="isLoggingIn"
        class="w-full py-4 px-6 bg-white text-[#1a1c1e] font-bold rounded-2xl hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-white/5"
      >
        <svg v-if="!isLoggingIn" class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <span>{{ isLoggingIn ? 'Connecting...' : 'Sign in with Google' }}</span>
      </button>

      <div class="mt-12 pt-8 border-t border-[var(--dash-tile-border)] w-full">
        <div class="text-[10px] text-[var(--dash-text-muted)] uppercase tracking-widest font-bold">Antigravity V1.0</div>
      </div>
    </div>
  </main>
</template>
