# Widget Development Guide

This guide explains how to create and register new widgets for the Dash dashboard, ensuring the established architecture remains sound and performance-optimized.

## Architecture Overview

Dash uses a **Registry Pattern** for widgets. This provides:

1. **Isolation**: Widgets are self-contained components.
2. **Dynamic Loading**: Widgets are loaded asynchronously (code-splitting) only when needed.
3. **Decoupled Configuration**: The app shell doesn't need to know about specific widgets; it just renders what the registry provides.

## Directory Structure

- `src/widgets/components/`: Place your widget `.vue` files here.
- `src/widgets/registry.ts`: Defines the `WidgetDefinition` interface and the registry class.
- `src/widgets/index.ts`: The central registration point for all widgets.

## Step-by-Step Instructions

### 1. Create the Widget Component

Create a new Vue component in `src/widgets/components/`. For example: `MyNewWidget.vue`.

```vue
<script setup lang="ts">
// Components should be self-contained
</script>

<template>
  <div class="p-4 flex flex-col items-center justify-center">
    <h3 class="text-lg font-bold">My New Widget</h3>
    <p class="text-xs opacity-50">Custom content here</p>
  </div>
</template>
```

### 2. Register the Widget

Open `src/widgets/index.ts` and use the `registry.register` method.

```typescript
import { registry } from './registry'

registry.register({
  id: 'my-unique-id',
  title: 'Display Name',
  description: 'Optional description of what this widget does',
  component: () => import('./components/MyNewWidget.vue'),
  defaultSize: 'small', // 'small' | 'medium' | 'large'
})
```

### 3. (Optional) Widget Settings

If your widget requires specific user configuration:

1. Create a settings component (`MyNewWidgetSettings.vue`).
2. Add it to the registration:

```typescript
registry.register({
  // ...
  settingsComponent: () => import('./components/MyNewWidgetSettings.vue'),
})
```

## Widget Definition Interface

| Property            | Type                             | Required | Description                                     |
| :------------------ | :------------------------------- | :------- | :---------------------------------------------- |
| `id`                | `string`                         | Yes      | Unique identifier (used in user configuration). |
| `title`             | `string`                         | Yes      | Human-readable name shown in settings.          |
| `description`       | `string`                         | No       | Brief explanation of the widget.                |
| `component`         | `() => Promise<Component>`       | Yes      | Async import function for the widget.           |
| `settingsComponent` | `() => Promise<Component>`       | No       | Async import for the settings UI.               |
| `defaultSize`       | `'small' \| 'medium' \| 'large'` | No       | Default grid size.                              |

## Best Practices

- **Minimal Dependencies**: Keep widgets lightweight.
- **Glassmorphism**: Use the `.glass-tile` class (inherited from parent) or similar styles to stay consistent.
- **Error Handling**: Widgets should handle their own internal errors gracefully.
- **Prop Usage**: The `WidgetSlot.vue` component provides basic layout context if needed.
