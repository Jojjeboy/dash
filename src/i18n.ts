import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    // Timer Widget
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    setTimer: 'Set Timer',
    min: 'min',
    sec: 'sec',

    // Login View
    appTitle: 'Dash',
    appSubtitle: 'Personal Dashboard',
    loginDescription: 'A calm, glanceable overview of your home.',
    loginPrompt: 'Please sign in to continue.',
    signInWithGoogle: 'Sign in with Google',
    connecting: 'Connecting...',
    appVersion: 'Antigravity V1.0',

    // Settings View
    settings: 'Settings',
    appearance: 'Appearance',
    dark: 'dark',
    light: 'light',
    layoutMode: 'Layout Mode',
    slots: 'Slots',
    widgets: 'Widgets',
    slot: 'Slot',
    empty: 'Empty',
    updatesAndBuildInfo: 'Updates & Build Info',
    checkUpdates: 'Check Updates',
    calendar: 'Calendar',
    icsFilePath: 'ICS File Path',
    icsFilePathDescription: 'Path to the ICS calendar file in the public folder',
    account: 'Account',
    signOut: 'Sign Out',
    familyMember: 'Family Member',
    widgetName: 'Widget Name',
    customName: 'Custom Name',

    // Calendar Widget
    schedule: 'Schedule',
    today: 'Today',
    loading: 'Loading...',
    noSchoolToday: 'No school today!',
    now: 'Now',
    previousDay: 'Previous Day',
    nextDay: 'Next Day',

    // Commute Widget
    departures: 'Departures',
    failedToLoadDepartures: 'Failed to load departures',
    tryAgain: 'Try again',
    noUpcomingDepartures: 'No upcoming departures',
    platform: 'Platform',
    live: 'Live',

    // Weather Widget
    weatherWidget: 'Weather Widget',

    // Update Prompt
    newVersionAvailable: 'New version available',
    updateToGetLatestFeatures: 'Update to get the latest features',
    updateNow: 'Update Now',
    later: 'Later',

    // Widget Registry
    trafikMariaplan: 'Trafik - Mariaplan',
    trafikMariaplanDesc: 'Avgångar från Mariaplan (Västtrafik)',
    schoolSchedule: 'School Schedule',
    schoolScheduleDesc: 'Daily school schedule from calendar',
  },
  sv: {
    // Timer Widget
    start: 'Starta',
    pause: 'Pausa',
    resume: 'Återuppta',
    reset: 'Återställ',
    setTimer: 'Sätt Timer',
    min: 'min',
    sec: 'sek',

    // Login View
    appTitle: 'Dash',
    appSubtitle: 'Personlig Dashboard',
    loginDescription: 'En lugn, lättöverskådlig översikt av ditt hem.',
    loginPrompt: 'Vänligen logga in för att fortsätta.',
    signInWithGoogle: 'Logga in med Google',
    connecting: 'Ansluter...',
    appVersion: 'Antigravity V1.0',

    // Settings View
    settings: 'Inställningar',
    appearance: 'Utseende',
    dark: 'mörk',
    light: 'ljus',
    layoutMode: 'Layoutläge',
    slots: 'Platser',
    widgets: 'Widgets',
    slot: 'Plats',
    empty: 'Tom',
    updatesAndBuildInfo: 'Uppdateringar & Bygginfo',
    checkUpdates: 'Sök Uppdateringar',
    calendar: 'Kalender',
    icsFilePath: 'ICS-filsökväg',
    icsFilePathDescription: 'Sökväg till ICS-kalenderfilen i public-mappen',
    account: 'Konto',
    signOut: 'Logga Ut',
    familyMember: 'Familjemedlem',
    widgetName: 'Widget-namn',
    customName: 'Anpassat Namn',

    // Calendar Widget
    schedule: 'Schema',
    today: 'Idag',
    loading: 'Laddar...',
    noSchoolToday: 'Ingen skola idag!',
    now: 'Nu',
    previousDay: 'Föregående Dag',
    nextDay: 'Nästa Dag',

    // Commute Widget
    departures: 'Avgångar',
    failedToLoadDepartures: 'Kunde inte ladda avgångar',
    tryAgain: 'Försök igen',
    noUpcomingDepartures: 'Inga kommande avgångar',
    platform: 'Plattform',
    live: 'Live',

    // Weather Widget
    weatherWidget: 'Väder Widget',

    // Update Prompt
    newVersionAvailable: 'Ny version tillgänglig',
    updateToGetLatestFeatures: 'Uppdatera för att få de senaste funktionerna',
    updateNow: 'Uppdatera Nu',
    later: 'Senare',

    // Widget Registry
    trafikMariaplan: 'Trafik - Mariaplan',
    trafikMariaplanDesc: 'Avgångar från Mariaplan (Västtrafik)',
    schoolSchedule: 'Skolschema',
    schoolScheduleDesc: 'Dagligt skolschema från kalender',
  }
}

const i18n = createI18n({
  legacy: false, // Usage with Composition API
  locale: 'sv', // Default language
  fallbackLocale: 'en',
  messages
})

export default i18n
