# Dash

Dash is a wall-mounted, always-on dashboard web application designed to run on a tablet (ideally 16:10 ratio like Samsung Tab). It replaces paper notes, whiteboards, and mental load with a calm, glanceable interface.

## Core Features

- **Widget-Based Grid**: Modular dashboard with swappable widgets (Weather, Transport, Calendar, etc.).
- **Flexible Layouts**: Supports 4, 6, or 8 visible tiles to balance information density.
- **Touch-First UI**: Large hit areas and gesture-based settings (long-press).
- **Secure Persistence**: Google Auth via Firebase with settings stored in Firestore.

## Technology Stack

- **Framework**: Vue 3 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication & Firestore)
- **Deployment**: GitHub Pages
- **Format**: Progressive Web App (PWA)

## Project Structure

- `src/components/widgets/`: Individual widget implementations.
- `src/layouts/`: App shell and structural layouts.
- `src/stores/`: Pinia stores for auth and configuration.
- `src/views/`: Main application routes (Dashboard, Login, Settings).

## Widgets & Titles

Widgets in Dash declare their own titles. The app shell provides a standardized, top-centered container for these titles to ensure a consistent dashboard aesthetic.

### How it works
Each widget component is responsible for emitting its preferred title. This allows for dynamic titles (e.g., a "Timer" widget showing its current status in the title area).

Example:
```vue
<script setup lang="ts">
const emit = defineEmits(['update-title'])
onMounted(() => {
  emit('update-title', 'Mitt Widget-Namn')
})
</script>
```

### Selecting Widgets
Widgets are selected directly on the dashboard.
1.  Hover over any widget slot.
2.  Click the "Cog" / Settings icon that appears in the corner.
3.  Choose a new widget from the dropdown list.

## Documentation

- [Widget Development Guide](./docs/WIDGET_DEVELOPMENT.md) — How to create and register new widgets.

## Getting Started

### Prerequisites

- Node.js (v20+ or v22+)
- Firebase account and project

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Development

```bash
npm run dev
```

### Build & Deploy

```bash
npm run build
# Deploy to GitHub Pages
npm run build-only # Or your specific deploy script
```
