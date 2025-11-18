import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { useStorage } from '@vueuse/core'
import router from '@/router'

export const useAuthStore = defineStore('auth-store', () => {
  // STATES
  const isAuthenticated = ref(false)
  const userData = reactive({
    email: '',
    password: '',
  })
  const currentUser = useStorage(
    'currentUser',
    {} as Partial<Session>,
    sessionStorage,
  )

  // ACTIONS
  async function initialize() {
    isAuthenticated.value = false

    if (Object.keys(currentUser.value).length) {
      return (isAuthenticated.value = true)
    }
  }

  async function authenticate() {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      })

      if (error) {
        console.error('Erro na autenticação:', error)
        return
      }

      isAuthenticated.value = true
      currentUser.value = {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
      }
      userData.email = ''
      userData.password = ''
      router.push('/')
    } catch (error) {
      console.error('Erro inesperado:', error)
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Erro no logout:', error)
        return
      }

      currentUser.value = {}
      isAuthenticated.value = false
      router.push('/login')
    } catch (error) {
      console.error('Erro inesperado:', error)
    }
  }

  return {
    userData,
    isAuthenticated,
    currentUser,
    initialize,
    authenticate,
    logout,
  }
})