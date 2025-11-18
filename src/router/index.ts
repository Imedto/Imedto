import {
  createRouter,
  createWebHistory,
  NavigationGuardNext,
  RouteLocationNormalized,
} from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabaseClient'

// STRUCTURE
import PageBody from '@/modules/shared/structure/PageBody.vue'

// VIEWS
import Login from '@/modules/login/views/Login.vue'
import Register from '@/modules/auth/views/Register.vue'
import Home from '@/modules/home/views/Home.vue'
import Onboarding from '@/modules/onboarding/views/OnboardingIndex.vue'

// Lazy loading das outras páginas
const Perfil = () => import('@/modules/perfil/views/Perfil.vue')
const Estabelecimento = () => import('@/modules/estabelecimento/views/Estabelecimento.vue')
const Profissionais = () => import('@/modules/profissionais/views/Profissionais.vue')
const Pacientes = () => import('@/modules/pacientes/views/Pacientes.vue')
const Agendamento = () => import('@/modules/agendamento/views/Agendamento.vue')
const NovoAgendamento = () => import('@/modules/agendamento/views/NovoAgendamento.vue')
const DetalhesAgendamento = () => import('@/modules/agendamento/views/DetalhesAgendamento.vue')


const ifNotAuthenticated = (
  to: RouteLocationNormalized | undefined,
  from: RouteLocationNormalized | undefined,
  next: NavigationGuardNext,
) => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated) {
    next()
    return
  }

  next('/')
}

const ifAuthenticated = async (
  to: RouteLocationNormalized | undefined,
  from: RouteLocationNormalized | undefined,
  next: NavigationGuardNext,
) => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated) {
    next('/login')
    return
  }

  // Verificar se completou onboarding
  const userId = auth.currentUser?.user?.id

  if (!userId) {
    next('/login')
    return
  }

  const { data: profissional } = await supabase
    .from('profissionais')
    .select('onboarding_completo')
    .eq('user_id', userId)
    .maybeSingle()

  // Se não existe profissional OU onboarding não está completo
  if (!profissional && to.name !== 'onboarding') {
    next('/onboarding')
    return
  }

  if (
    profissional &&
    !profissional.onboarding_completo &&
    to.name !== 'onboarding'
  ) {
    next('/onboarding')
    return
  }

  // Se tentou acessar onboarding mas já completou
  if (profissional?.onboarding_completo && to.name === 'onboarding') {
    next('/')
    return
  }

  next()
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      beforeEnter: ifNotAuthenticated,
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      beforeEnter: ifNotAuthenticated,
      component: Register,
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      beforeEnter: ifAuthenticated,
      component: Onboarding,
    },
    {
      path: '/',
      redirect: 'home',
      beforeEnter: ifAuthenticated,
      component: PageBody,
      children: [
        { path: 'home', name: 'home', component: Home },
        { path: 'perfil', name: 'perfil', component: Perfil },
        { path: 'estabelecimento', name: 'estabelecimento', component: Estabelecimento },
        { path: 'profissionais', name: 'profissionais', component: Profissionais },
        { path: 'pacientes', name: 'pacientes', component: Pacientes },
        { path: 'agendamento', name: 'agendamento', component: Agendamento },
        { path: 'agendamento/novo', name: 'novo-agendamento', component: NovoAgendamento },
        { path: 'agendamento/:id', name: 'detalhes-agendamento', component: DetalhesAgendamento }
      ],
    },
  ],
})

export default router