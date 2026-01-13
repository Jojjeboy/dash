import { registry } from './registry'

// Register core widgets
registry.register({
  id: 'timer',
  title: 'Timer',
  description: 'Simple countdown timer',
  component: () => import('./components/TimerWidget.vue'),
  defaultSize: 'small'
})

registry.register({
  id: 'weather',
  title: 'Weather',
  component: () => import('./components/WeatherWidget.vue'),
  defaultSize: 'small'
})

registry.register({
  id: 'smhi-weather',
  title: 'SMHI Weather',
  component: () => import('./components/SmhiWidget.vue'),
  defaultSize: 'medium'
})
