<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAgendamentoStore } from '@/stores/agendamento'

const route = useRoute()
const router = useRouter()
const agendamentoStore = useAgendamentoStore()

const loading = ref(true)
const mostrarModalCancelar = ref(false)
const motivoCancelamento = ref('')

const agendamento = computed(() => agendamentoStore.agendamentoSelecionado)

onMounted(async () => {
  const id = route.params.id as string
  await agendamentoStore.carregarAgendamento(id)
  loading.value = false
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

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function confirmar() {
  try {
    await agendamentoStore.confirmarAgendamento(agendamento.value!.id)
    await agendamentoStore.carregarAgendamento(agendamento.value!.id)
  } catch (error) {
    console.error('Erro ao confirmar:', error)
  }
}

async function iniciarAtendimento() {
  try {
    await agendamentoStore.iniciarAtendimento(agendamento.value!.id)
    await agendamentoStore.carregarAgendamento(agendamento.value!.id)
  } catch (error) {
    console.error('Erro ao iniciar atendimento:', error)
  }
}

async function finalizar() {
  try {
    await agendamentoStore.finalizarAtendimento(agendamento.value!.id)
    await agendamentoStore.carregarAgendamento(agendamento.value!.id)
  } catch (error) {
    console.error('Erro ao finalizar:', error)
  }
}

async function marcarFalta() {
  try {
    await agendamentoStore.marcarFalta(agendamento.value!.id)
    await agendamentoStore.carregarAgendamento(agendamento.value!.id)
  } catch (error) {
    console.error('Erro ao marcar falta:', error)
  }
}

async function cancelar() {
  try {
    await agendamentoStore.cancelarAgendamento(
      agendamento.value!.id,
      motivoCancelamento.value,
    )
    mostrarModalCancelar.value = false
    motivoCancelamento.value = ''
    await agendamentoStore.carregarAgendamento(agendamento.value!.id)
  } catch (error) {
    console.error('Erro ao cancelar:', error)
  }
}

function podeConfirmar() {
  return agendamento.value?.status === 'agendado'
}

function podeIniciar() {
  return ['agendado', 'confirmado'].includes(agendamento.value?.status || '')
}

function podeFinalizar() {
  return agendamento.value?.status === 'em_atendimento'
}

function podeCancelar() {
  return !['realizado', 'cancelado'].includes(agendamento.value?.status || '')
}
</script>

<template>
  <section class="p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin text-4xl mb-4">⏳</div>
        <p class="text-gray-600">Carregando...</p>
      </div>

      <!-- Conteúdo -->
      <div v-else-if="agendamento">
        <!-- Header -->
        <div class="mb-8">
          <button
            class="text-primary hover:underline mb-4 flex items-center gap-2"
            @click="router.back()"
          >
            ← Voltar
          </button>
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-3xl font-bold text-primary-dark mb-2">
                Detalhes do Agendamento
              </h1>
              <p class="text-gray-600">
                {{
                  agendamento.pacientes?.nome_completo ||
                    'Paciente não vinculado'
                }}
              </p>
            </div>
            <span
              :class="[
                'px-4 py-2 rounded-lg font-semibold',
                getStatusColor(agendamento.status),
              ]"
            >
              {{ getStatusLabel(agendamento.status) }}
            </span>
          </div>
        </div>

        <!-- Card Principal -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
          <!-- Informações do Agendamento -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 class="text-sm font-semibold text-gray-500 mb-2">
                📅 Data e Horário
              </h3>
              <p class="text-lg font-semibold text-gray-800">
                {{ formatarDataHora(agendamento.data_hora_inicio) }}
              </p>
              <p class="text-sm text-gray-600">
                Duração: {{ agendamento.duracao_minutos }} minutos
                (até {{ formatarHora(agendamento.data_hora_fim) }})
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-gray-500 mb-2">
                👨‍⚕️ Profissional
              </h3>
              <p class="text-lg font-semibold text-gray-800">
                {{ agendamento.profissionais?.nome_completo }}
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-gray-500 mb-2">
                👤 Paciente
              </h3>
              <p class="text-lg font-semibold text-gray-800">
                {{
                  agendamento.pacientes?.nome_completo ||
                    'Não vinculado'
                }}
              </p>
              <p
                v-if="agendamento.pacientes?.telefone"
                class="text-sm text-gray-600"
              >
                📞 {{ agendamento.pacientes.telefone }}
              </p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-gray-500 mb-2">
                📋 Tipo de Atendimento
              </h3>
              <p class="text-lg font-semibold text-gray-800 capitalize">
                {{ agendamento.tipo_atendimento }}
              </p>
            </div>
          </div>

          <!-- Observações -->
          <div v-if="agendamento.observacoes" class="pt-6 border-t">
            <h3 class="text-sm font-semibold text-gray-500 mb-2">
              📝 Observações
            </h3>
            <p class="text-gray-700">{{ agendamento.observacoes }}</p>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex flex-wrap gap-4">
          <button
            v-if="podeConfirmar()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            @click="confirmar"
          >
            ✓ Confirmar Agendamento
          </button>

          <button
            v-if="podeIniciar()"
            class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            @click="iniciarAtendimento"
          >
            ▶ Iniciar Atendimento
          </button>

          <button
            v-if="podeFinalizar()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            @click="finalizar"
          >
            ✓ Finalizar Atendimento
          </button>

          <button
            v-if="podeIniciar()"
            class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            @click="marcarFalta"
          >
            ⚠ Marcar Falta
          </button>

          <button
            v-if="podeCancelar()"
            class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            @click="mostrarModalCancelar = true"
          >
            ✕ Cancelar Agendamento
          </button>
        </div>
      </div>

      <!-- Modal de Cancelamento -->
      <div
        v-if="mostrarModalCancelar"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="mostrarModalCancelar = false"
      >
        <div class="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            Cancelar Agendamento
          </h2>
          <p class="text-gray-600 mb-6">
            Tem certeza que deseja cancelar este agendamento?
          </p>

          <div class="mb-6">
            <label class="block mb-2 font-semibold text-gray-700">
              Motivo do cancelamento (opcional)
            </label>
            <textarea
              v-model="motivoCancelamento"
              class="form-input"
              rows="3"
              placeholder="Descreva o motivo..."
            ></textarea>
          </div>

          <div class="flex gap-4">
            <button
              class="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              @click="mostrarModalCancelar = false"
            >
              Não, voltar
            </button>
            <button
              class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              @click="cancelar"
            >
              Sim, cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>