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
  id: 'smhi-weather',
  title: 'SMHI Weather',
  component: () => import('./components/SmhiWidget.vue'),
  defaultSize: 'medium'
})

registry.register({
  id: 'gnews',
  title: 'Gnews',
  component: () => import('./components/GNewsWidget.vue'),
  size: 'single'
})
