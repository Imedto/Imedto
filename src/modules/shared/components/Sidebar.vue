<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserContextStore } from '@/stores/userContext'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const userContext = useUserContextStore()
const router = useRouter()

const menuItems = ref([
  {
    icon: '🏠',
    label: 'Painel Inicial',
    route: '/home',
    children: [],
  },
  {
    icon: '📅',
    label: 'Gestão de atendimento',
    route: '/agendamento',
    children: [],
    expandable: true,
  },
  {
    icon: '👥',
    label: 'Pacientes',
    route: '/pacientes',
    children: [],
  },
  {
    icon: '📋',
    label: 'Prontuário',
    route: '/prontuario',
    children: [],
    expandable: true,
  },
  {
    icon: '👨‍⚕️',
    label: 'Profissionais',
    route: '/profissionais',
    children: [],
    expandable: true,
  },
  {
    icon: '⚙️',
    label: 'Estabelecimento',
    route: '/estabelecimento',
    children: [],
    expandable: true,
  },
])

const expandedMenus = ref<string[]>([])

// Computeds
const nomeUsuario = computed(() => {
  return userContext.profissional?.nome_completo || 'Usuário'
})

const nomeEstabelecimento = computed(() => {
  if (!userContext.vinculoAtual) return 'Sem estabelecimento'
  return userContext.vinculoAtual.estabelecimentos.nome
})

const iniciais = computed(() => {
  const nome = nomeUsuario.value
  const palavras = nome.split(' ')
  if (palavras.length >= 2) {
    return `${palavras[0][0]}${palavras[1][0]}`.toUpperCase()
  }
  return nome.substring(0, 2).toUpperCase()
})

// Methods
function toggleMenu(label: string) {
  const index = expandedMenus.value.indexOf(label)
  if (index > -1) {
    expandedMenus.value.splice(index, 1)
  } else {
    expandedMenus.value.push(label)
  }
}

function isExpanded(label: string) {
  return expandedMenus.value.includes(label)
}

function isActive(route: string) {
  return router.currentRoute.value.path === route
}

async function handleLogout() {
  userContext.limparContexto()
  await auth.logout()
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-72 bg-primary text-white flex flex-col">
      <!-- Logo -->
      <div class="p-6 border-b border-primary-medium">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🔗</span>
          <span class="text-xl font-bold">imedto</span>
        </div>
      </div>

      <!-- User Info -->
      <div class="p-6 border-b border-primary-medium">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center"
          >
            <span class="text-primary text-xl font-bold">
              {{ iniciais }}
            </span>
          </div>
          <div class="flex-1 overflow-hidden">
            <p class="font-semibold truncate">{{ nomeUsuario }}</p>
            <p class="text-sm text-primary-light truncate">
              {{ nomeEstabelecimento }}
            </p>
          </div>
          <button
            class="hover:bg-primary-dark rounded p-1 transition"
            title="Configurações"
          >
            <span>⋮</span>
          </button>
        </div>

        <!-- Trocar estabelecimento (se tiver mais de um) -->
        <div v-if="userContext.estabelecimentos.length > 1" class="mt-4">
          <select
            v-model="userContext.estabelecimentoAtual"
            class="w-full px-3 py-2 rounded bg-primary-dark text-white text-sm"
            @change="
              userContext.trocarEstabelecimento(
                userContext.estabelecimentoAtual!,
              )
            "
          >
            <option
              v-for="estab in userContext.estabelecimentos"
              :key="estab.id"
              :value="estab.id"
            >
              {{ estab.nome }}
            </option>
          </select>
        </div>
      </div>

      <!-- Menu Items -->
      <nav class="flex-1 overflow-y-auto py-4">
        <div v-for="item in menuItems" :key="item.label" class="mb-1">
          <button
            :class="[
              'w-full px-6 py-3 flex items-center gap-3 hover:bg-primary-dark transition text-left',
              isActive(item.route) ? 'bg-primary-dark' : '',
            ]"
            @click="
              item.expandable ? toggleMenu(item.label) : router.push(item.route)
            "
          >
            <span class="text-xl">{{ item.icon }}</span>
            <span class="flex-1">{{ item.label }}</span>
            <span v-if="item.expandable" class="text-sm">
              {{ isExpanded(item.label) ? '▼' : '▶' }}
            </span>
          </button>

          <!-- Submenu (se houver) -->
          <div
            v-if="
              item.expandable && isExpanded(item.label) && item.children.length
            "
            class="bg-primary-dark"
          >
            <button
              v-for="child in item.children"
              :key="child.label"
              class="w-full px-6 py-2 pl-16 text-left text-sm hover:bg-primary transition"
              @click="router.push(child.route)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>
      </nav>

      <!-- Footer -->
      <div class="border-t border-primary-medium p-4">
        <button
          class="w-full px-4 py-2 flex items-center gap-3 hover:bg-primary-dark rounded transition"
        >
          <span class="text-xl">❓</span>
          <span>Ajuda</span>
        </button>
        <button
          class="w-full px-4 py-2 flex items-center gap-3 hover:bg-primary-dark rounded transition"
          @click="handleLogout"
        >
          <span class="text-xl">🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <slot></slot>
    </main>
  </div>
</template>