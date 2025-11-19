<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAgendamentoStore } from '@/stores/agendamento'
import { useUserContextStore } from '@/stores/userContext'
import { usePacientesStore } from '@/stores/pacientes'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'vue-router'
import CompletarCadastroPaciente from '../components/CompletarCadastroPaciente.vue'

const agendamentoStore = useAgendamentoStore()
const userContext = useUserContextStore()
const pacientesStore = usePacientesStore()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Listas
const pacientes = ref<any[]>([])
const profissionais = ref<any[]>([])

// Formulário
const formData = ref({
  paciente_id: null as string | null,
  profissional_id: '',
  data: '',
  hora_inicio: '',
  duracao_minutos: 30,
  tipo_atendimento: 'consulta',
  observacoes: '',
})

// Busca de paciente
const buscaPaciente = ref('')
const mostrarModalCadastroPaciente = ref(false)

onMounted(async () => {
  await carregarDados()
})

async function carregarDados() {
  try {
    // Carregar profissionais do estabelecimento
    const { data: profsData } = await supabase
      .from('vinculo_profissional_estabelecimento')
      .select(
        `
        profissional_id,
        profissionais (
          id,
          nome_completo
        )
      `,
      )
      .eq('estabelecimento_id', userContext.estabelecimentoAtual)
      .eq('ativo', true)

    if (profsData) {
      profissionais.value = profsData
        .map((v: any) => v.profissionais)
        .filter(Boolean)
    }

    // Definir profissional atual como padrão
    if (userContext.profissional) {
      formData.value.profissional_id = userContext.profissional.id
    }

    // Carregar pacientes do estabelecimento
    await buscarPacientes()
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  }
}

async function buscarPacientes(termo?: string) {
  try {
    const resultados = await pacientesStore.buscarPacientes(termo || '', 20)
    pacientes.value = resultados
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error)
  }
}

function abrirCadastroPaciente() {
  mostrarModalCadastroPaciente.value = true
}

async function handlePacienteCadastrado(pacienteId: string) {
  // Selecionar o paciente recém-cadastrado
  formData.value.paciente_id = pacienteId
  
  // Recarregar lista de pacientes
  await buscarPacientes()
  
  // Fechar modal
  mostrarModalCadastroPaciente.value = false
  
  successMessage.value = 'Paciente cadastrado com sucesso!'
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

async function salvar() {
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    // Validações
    if (!formData.value.profissional_id) {
      throw new Error('Selecione um profissional')
    }

    if (!formData.value.data || !formData.value.hora_inicio) {
      throw new Error('Preencha data e horário')
    }

    // Construir data/hora
    const dataHoraInicio = new Date(
      `${formData.value.data}T${formData.value.hora_inicio}`,
    )
    const dataHoraFim = new Date(
      dataHoraInicio.getTime() + formData.value.duracao_minutos * 60000,
    )

    // Criar agendamento
    await agendamentoStore.criarAgendamento({
      profissional_id: formData.value.profissional_id,
      paciente_id: formData.value.paciente_id,
      data_hora_inicio: dataHoraInicio.toISOString(),
      data_hora_fim: dataHoraFim.toISOString(),
      duracao_minutos: formData.value.duracao_minutos,
      tipo_atendimento: formData.value.tipo_atendimento,
      observacoes: formData.value.observacoes || null,
      status: 'agendado',
    })

    successMessage.value = 'Agendamento criado com sucesso!'

    // Redirecionar após 1 segundo
    setTimeout(() => {
      router.push('/agendamento')
    }, 1000)
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error)
    errorMessage.value = error.message || 'Erro ao criar agendamento'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <button
          class="text-primary hover:underline mb-4 flex items-center gap-2"
          @click="router.back()"
        >
          ← Voltar
        </button>
        <h1 class="text-3xl font-bold text-primary-dark mb-2">
          Novo Agendamento
        </h1>
        <p class="text-gray-600">Preencha as informações do agendamento</p>
      </div>

      <!-- Mensagens -->
      <div
        v-if="successMessage"
        class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6"
      >
        {{ successMessage }}
      </div>

      <div
        v-if="errorMessage"
        class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6"
      >
        {{ errorMessage }}
      </div>

      <!-- Formulário -->
      <form @submit.prevent="salvar" class="bg-white rounded-xl shadow-lg p-8">
        <!-- Paciente -->
        <div class="mb-6">
          <label class="block mb-2 font-semibold text-gray-700">
            Paciente
          </label>

          <div class="space-y-3">
            <!-- Select de Paciente -->
            <select
              v-model="formData.paciente_id"
              class="form-input"
            >
              <option :value="null">Agendamento sem paciente</option>
              <option
                v-for="paciente in pacientes"
                :key="paciente.id"
                :value="paciente.id"
              >
                {{ paciente.nome_completo }}
                <span v-if="paciente.cpf"> - CPF: {{ paciente.cpf }}</span>
              </option>
            </select>

            <!-- Busca e Novo Paciente -->
            <div class="flex gap-2">
              <input
                v-model="buscaPaciente"
                type="text"
                placeholder="Buscar por nome, CPF ou telefone..."
                class="form-input flex-1"
                @input="buscarPacientes(buscaPaciente)"
              />
              <button
                type="button"
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition whitespace-nowrap"
                @click="abrirCadastroPaciente"
              >
                + Novo Paciente
              </button>
            </div>

            <p class="text-xs text-gray-500">
              Se o paciente não estiver na lista, clique em "Novo Paciente" para cadastrar
            </p>
          </div>
        </div>

        <!-- Profissional -->
        <div class="mb-6">
          <label class="block mb-2 font-semibold text-gray-700">
            Profissional *
          </label>
          <select v-model="formData.profissional_id" class="form-input" required>
            <option value="">Selecione</option>
            <option
              v-for="prof in profissionais"
              :key="prof.id"
              :value="prof.id"
            >
              {{ prof.nome_completo }}
            </option>
          </select>
        </div>

        <!-- Data e Hora -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label class="block mb-2 font-semibold text-gray-700">
              Data *
            </label>
            <input
              v-model="formData.data"
              type="date"
              class="form-input"
              required
            />
          </div>

          <div>
            <label class="block mb-2 font-semibold text-gray-700">
              Horário *
            </label>
            <input
              v-model="formData.hora_inicio"
              type="time"
              class="form-input"
              required
            />
          </div>

          <div>
            <label class="block mb-2 font-semibold text-gray-700">
              Duração (minutos)
            </label>
            <select v-model.number="formData.duracao_minutos" class="form-input">
              <option :value="15">15 min</option>
              <option :value="30">30 min</option>
              <option :value="45">45 min</option>
              <option :value="60">1 hora</option>
              <option :value="90">1h 30min</option>
              <option :value="120">2 horas</option>
            </select>
          </div>
        </div>

        <!-- Tipo de Atendimento -->
        <div class="mb-6">
          <label class="block mb-2 font-semibold text-gray-700">
            Tipo de Atendimento
          </label>
          <select v-model="formData.tipo_atendimento" class="form-input">
            <option value="consulta">Consulta</option>
            <option value="retorno">Retorno</option>
            <option value="avaliacao">Avaliação</option>
            <option value="procedimento">Procedimento</option>
            <option value="exame">Exame</option>
            <option value="emergencia">Emergência</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        <!-- Observações -->
        <div class="mb-6">
          <label class="block mb-2 font-semibold text-gray-700">
            Observações
          </label>
          <textarea
            v-model="formData.observacoes"
            class="form-input"
            rows="3"
            placeholder="Informações adicionais sobre o agendamento"
          ></textarea>
        </div>

        <!-- Botões -->
        <div class="flex justify-end gap-4">
          <button
            type="button"
            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            @click="router.back()"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="loading"
          >
            {{ loading ? 'Criando...' : 'Criar Agendamento' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Modal de Cadastro de Paciente -->
    <CompletarCadastroPaciente
      :mostrar="mostrarModalCadastroPaciente"
      @fechar="mostrarModalCadastroPaciente = false"
      @concluido="handlePacienteCadastrado"
    />
  </section>
</template>