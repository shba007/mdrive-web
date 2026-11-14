import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { UNAUTHORIZED_EVENT } from './api/http'
import router from './router'
import { useAccessStore } from './stores/access'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// The API rejected the saved key: ask for access details again.
window.addEventListener(UNAUTHORIZED_EVENT, () => {
  useAccessStore(pinia).rejected = true
  if (router.currentRoute.value.name !== 'access') void router.push({ name: 'access' })
})

app.mount('#app')