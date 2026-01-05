import './assets/main.css'
import './assets/styles/variables.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info)
  router.push('/error')
}

app.use(createPinia())
app.use(router)

app.mount('#app')
