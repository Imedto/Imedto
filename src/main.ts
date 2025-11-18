import './assets/css/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import { useUserContextStore } from './stores/userContext'

import App from './App.vue'
import router from './router'

// NAIVE-UI
import naive from 'naive-ui'

const app = createApp(App)
app.use(createPinia())

// USER CONTEXT
const auth = useAuthStore()
await auth.initialize()

// Se estiver autenticado, carregar contexto do usuário
if (auth.isAuthenticated) {
  const userContext = useUserContextStore()
  try {
    await userContext.carregarContexto()
  } catch (error) {
    console.error('Erro ao carregar contexto:', error)
  }
}

app.use(naive)
app.use(router)
app.mount('#app')