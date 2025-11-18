<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAgendamentoStore } from '@/stores/agendamento'
import { useUserContextStore } from '@/stores/userContext'
import { useRouter } from 'vue-router'

const agendamentoStore = useAgendamentoStore()
const userContext = useUserContextStore()
const router = useRouter()

const visualizacao = ref<'lista' | 'calendario'>('lista')
const dataSelecionada = ref(new Date())

// Computeds
const mesAtual = computed(() => {
  return dataSelecionada.value.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
})

const hoje = computed(() => {
  return new Date().toISOString().split('T')[0]
})

onMounted(async () => {
  // Carregar agendamentos do mês atual
  const inicio = new Date(
    dataSelecionada.value.getFullYear(),
    dataSelecionada.value.getMonth(),
    1,
  ).toISOString()
  const fim = new Date(
    dataSelecionada.value.getFullYear(),
    dataSelecionada.value.getMonth() + 1,
    0,
  ).toISOString()

  await agendamentoStore.carregarAgendamentos(inicio, fim)
})

function getStatusColor(status: string) {
  const cores: Record<string, string> = {
    agendado: 'bg-blue-100 text-blue-800',
    confirmado: 'bg-green-100 text-green-800',
    em_atendimento: 'bg-purple-100 text-purple-800',
    realizado: 'bg-gray-100 text-gray-800',
    cancelado: 'bg-red-100 text-red-800',
    faltou: 'bg-orange-100 text-orange-800',
  }
  return cores[status] || 'bg-gray-100 text-gray-800'
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    agendado: 'Agendado',
    confirmado: 'Confirmado',
    em_atendimento: 'Em Atendimento',
    realizado: 'Realizado',
    cancelado: 'Cancelado',
    faltou: 'Faltou',
  }
  return labels[status] || status
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
}

function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function verDetalhes(id: string) {
  router.push(`/agendamento/${id}`)
}
</script>

<template>
  <section class="p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-primary-dark mb-2">
            Agenda
          </h1>
          <p class="text-gray-600">
            Gerencie seus agendamentos
          </p>
        </div>
        <button
          class="btn-primary flex items-center gap-2"
          @click="router.push('/agendamento/novo')"
        >
          <span class="text-xl">+</span>
          Novo Agendamento
        </button>
      </div>

      <!-- Filtros e Visualização -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between">
          <!-- Filtros -->
          <div class="flex items-center gap-4">
            <select
              v-model="agendamentoStore.profissionalFiltro"
              class="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option :value="null">Todos os profissionais</option>
              <option
                v-for="vinculo in userContext.vinculos"
                :key="vinculo.profissional_id"
                :value="vinculo.profissional_id"
              >
                {{ userContext.profissional?.nome_completo }}
              </option>
            </select>

            <select
              v-model="agendamentoStore.statusFiltro"
              class="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option :value="null">Todos os status</option>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <!-- Toggle Visualização -->
          <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              :class="[
                'px-4 py-2 rounded-lg transition',
                visualizacao === 'lista'
                  ? 'bg-white shadow'
                  : 'text-gray-600',
              ]"
              @click="visualizacao = 'lista'"
            >
              📋 Lista
            </button>
            <button
              :class="[
                'px-4 py-2 rounded-lg transition',
                visualizacao === 'calendario'
                  ? 'bg-white shadow'
                  : 'text-gray-600',
              ]"
              @click="visualizacao = 'calendario'"
            >
              📅 Calendário
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Rápidos -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow p-4">
          <p class="text-gray-600 text-sm mb-1">Hoje</p>
          <p class="text-2xl font-bold text-primary">
            {{ agendamentoStore.agendamentosHoje.length }}
          </p>
        </div>
        <div class="bg-white rounded-xl shadow p-4">
          <p class="text-gray-600 text-sm mb-1">Agendados</p>
          <p class="text-2xl font-bold text-blue-600">
            {{
              agendamentoStore.agendamentos.filter((a) => a.status === 'agendado')
                .length
            }}
          </p>
        </div>
        <div class="bg-white rounded-xl shadow p-4">
          <p class="text-gray-600 text-sm mb-1">Confirmados</p>
          <p class="text-2xl font-bold text-green-600">
            {{
              agendamentoStore.agendamentos.filter(
                (a) => a.status === 'confirmado',
              ).length
            }}
          </p>
        </div>
        <div class="bg-white rounded-xl shadow p-4">
          <p class="text-gray-600 text-sm mb-1">Total do Mês</p>
          <p class="text-2xl font-bold text-purple-600">
            {{ agendamentoStore.agendamentos.length }}
          </p>
        </div>
      </div>

      <!-- Conteúdo -->
      <div v-if="visualizacao === 'lista'" class="bg-white rounded-xl shadow-lg">
        <!-- Loading -->
        <div v-if="agendamentoStore.loading" class="p-12 text-center">
          <div class="animate-spin text-4xl mb-4">⏳</div>
          <p class="text-gray-600">Carregando agendamentos...</p>
        </div>

        <!-- Lista Vazia -->
        <div
          v-else-if="agendamentoStore.agendamentosFiltrados.length === 0"
          class="p-12 text-center"
        >
          <span class="text-6xl mb-4 block">📅</span>
          <h3 class="text-xl font-bold text-gray-800 mb-2">
            Nenhum agendamento encontrado
          </h3>
          <p class="text-gray-600 mb-6">
            Comece criando seu primeiro agendamento
          </p>
          <button
            class="btn-primary"
            @click="router.push('/agendamento/novo')"
          >
            Novo Agendamento
          </button>
        </div>

        <!-- Lista de Agendamentos -->
        <div v-else class="divide-y">
          <div
            v-for="agendamento in agendamentoStore.agendamentosFiltrados"
            :key="agendamento.id"
            class="p-6 hover:bg-gray-50 transition cursor-pointer"
            @click="verDetalhes(agendamento.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 flex-1">
                <!-- Data/Hora -->
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary">
                    {{ new Date(agendamento.data_hora_inicio).getDate() }}
                  </div>
                  <div class="text-xs text-gray-600 uppercase">
                    {{
                      new Date(agendamento.data_hora_inicio).toLocaleDateString(
                        'pt-BR',
                        { month: 'short' },
                      )
                    }}
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-gray-800">
                      {{
                        agendamento.pacientes?.nome_completo ||
                          'Paciente não vinculado'
                      }}
                    </h3>
                    <span
                      :class="[
                        'text-xs px-2 py-1 rounded',
                        getStatusColor(agendamento.status),
                      ]"
                    >
                      {{ getStatusLabel(agendamento.status) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      🕐 {{ formatarHora(agendamento.data_hora_inicio) }} -
                      {{ formatarHora(agendamento.data_hora_fim) }}
                    </span>
                    <span>
                      👨‍⚕️ {{ agendamento.profissionais?.nome_completo }}
                    </span>
                    <span v-if="agendamento.tipo_atendimento">
                      📋 {{ agendamento.tipo_atendimento }}
                    </span>
                  </div>
                  <p
                    v-if="agendamento.observacoes"
                    class="text-sm text-gray-500 mt-1"
                  >
                    {{ agendamento.observacoes }}
                  </p>
                </div>
              </div>

              <!-- Ações Rápidas -->
              <div class="flex items-center gap-2">
                <button
                  v-if="agendamento.status === 'agendado'"
                  class="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
                  @click.stop="
                    agendamentoStore.confirmarAgendamento(agendamento.id)
                  "
                >
                  Confirmar
                </button>
                <button
                  class="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition"
                >
                  Ver Detalhes →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visualização de Calendário (placeholder) -->
      <div v-else class="bg-white rounded-xl shadow-lg p-12 text-center">
        <span class="text-6xl mb-4 block">📅</span>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          Visualização de Calendário
        </h2>
        <p class="text-gray-600">
          A visualização em calendário será implementada em breve.
        </p>
      </div>
    </div>
  </section>
</template>