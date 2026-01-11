import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    setTimer: 'Set Timer',
  },
  sv: {
    start: 'Starta',
    pause: 'Pausa',
    resume: 'Återuppta',
    reset: 'Återställ',
    setTimer: 'Sätt Timer',
  }
}

const i18n = createI18n({
  legacy: false, // Usage with Composition API
  locale: 'sv', // Default language
  fallbackLocale: 'en',
  messages
})

export default i18n
