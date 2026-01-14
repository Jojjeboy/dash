import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function getGitInfo() {
  try {
    const message = execSync('git log -1 --pretty=%B').toString().trim()
    const hash = execSync('git rev-parse --short HEAD').toString().trim()
    return { message, hash }
  } catch (e) {
    console.warn('Could not get git info, using defaults', e)
    return {
      message: process.env.GITHUB_SHA ? `Build from GitHub Action (${process.env.GITHUB_SHA.slice(0, 7)})` : 'No commit info',
      hash: process.env.GITHUB_SHA?.slice(0, 7) || 'unknown'
    }
  }
}

const { message: commitMessage, hash: commitHash } = getGitInfo()
const buildTime = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __LAST_COMMIT_MESSAGE__: JSON.stringify(commitMessage),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime)
  },
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Dash - Home Hub',
        short_name: 'Dash',
        description: 'A calm, glanceable home dashboard',
        theme_color: '#1a1c1e',
        background_color: '#1a1c1e',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
  ],
  base: '/dash/',
  server: {
    proxy: {
      '^/dash/api/smhi': {
        target: 'https://opendata-download-metfcst.smhi.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dash\/api\/smhi/, '/api')
      },
      '^/api/smhi': {
        target: 'https://opendata-download-metfcst.smhi.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/smhi/, '/api')
      },
      '^/api/gnews': {
        target: 'https://gnews.io/api/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gnews/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
