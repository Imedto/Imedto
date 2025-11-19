<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePacientesStore, type Paciente } from '@/stores/pacientes'
import { useUserContextStore } from '@/stores/userContext'

const props = defineProps<{
  agendamentoId?: string
  nomeInicial?: string
  telefoneInicial?: string
  cpfInicial?: string
  mostrar: boolean
}>()

const emit = defineEmits<{
  fechar: []
  concluido: [pacienteId: string]
}>()

const pacientesStore = usePacientesStore()
const userContext = useUserContextStore()

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const etapa = ref<'busca' | 'cadastro'>('busca')

// Dados do formulário
const formData = ref({
  tipo_documento: 'cpf' as 'cpf' | 'internacional',
  cpf: '',
  documento_internacional: '',
  nome_completo: '',
  data_nascimento: '',
  email: '',
  telefone: '',
  telefone_secundario: '',
  celular: '',
  endereco: '',
  observacoes: '',
})

// Paciente encontrado na busca
const pacienteEncontrado = ref<Paciente | null>(null)

// Computed
const documentoFormatado = computed(() => {
  if (formData.value.tipo_documento === 'cpf') {
    return formData.value.cpf.replace(/\D/g, '')
  }
  return formData.value.documento_internacional
})

const podeAvancar = computed(() => {
  if (etapa.value === 'busca') {
    if (formData.value.tipo_documento === 'cpf') {
      return formData.value.cpf.replace(/\D/g, '').length === 11
    }
    return formData.value.documento_internacional.length >= 5
  }
  return formData.value.nome_completo.length >= 3
})

// Preencher dados iniciais quando o modal abrir
watch(
  () => props.mostrar,
  (novo) => {
    if (novo) {
      formData.value.nome_completo = props.nomeInicial || ''
      formData.value.telefone = props.telefoneInicial || ''
      formData.value.cpf = props.cpfInicial || ''
      
      if (props.cpfInicial) {
        etapa.value = 'busca'
      }
    }
  },
)

async function buscarPaciente() {
  try {
    loading.value = true
    errorMessage.value = ''
    pacienteEncontrado.value = null

    const paciente = await pacientesStore.buscarPorDocumento(
      documentoFormatado.value,
      formData.value.tipo_documento,
    )

    if (paciente) {
      pacienteEncontrado.value = paciente
      
      // Preencher formulário com dados encontrados
      formData.value = {
        ...formData.value,
        nome_completo: paciente.nome_completo || '',
        data_nascimento: paciente.data_nascimento || '',
        email: paciente.email || '',
        telefone: paciente.telefone || '',
        telefone_secundario: paciente.telefone_secundario || '',
        celular: paciente.celular || '',
        endereco: paciente.endereco || '',
        observacoes: paciente.observacoes || '',
      }
      
      // Verificar se já está vinculado ao estabelecimento
      const jaVinculado = await pacientesStore.verificarVinculo(
        paciente.id,
        userContext.estabelecimentoAtual!,
      )
      
      if (jaVinculado) {
        successMessage.value = 'Paciente já cadastrado e vinculado!'
        emit('concluido', paciente.id)
        setTimeout(fechar, 1500)
      } else {
        etapa.value = 'cadastro'
      }
    } else {
      // Paciente não encontrado, ir para cadastro
      etapa.value = 'cadastro'
    }
  } catch (error: any) {
    console.error('Erro ao buscar paciente:', error)
    errorMessage.value = error.message || 'Erro ao buscar paciente'
  } finally {
    loading.value = false
  }
}

async function salvarPaciente() {
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    // Buscar ou criar paciente
    const pacienteId = await pacientesStore.buscarOuCriarPaciente({
      cpf: formData.value.tipo_documento === 'cpf' ? documentoFormatado.value : null,
      documento_internacional:
        formData.value.tipo_documento === 'internacional'
          ? documentoFormatado.value
          : null,
      tipo_documento: formData.value.tipo_documento,
      nome_completo: formData.value.nome_completo,
      data_nascimento: formData.value.data_nascimento || null,
      email: formData.value.email || null,
      telefone: formData.value.telefone || null,
      telefone_secundario: formData.value.telefone_secundario || null,
      celular: formData.value.celular || null,
      endereco: formData.value.endereco || null,
      observacoes: formData.value.observacoes || null,
    })

    // Vincular ao estabelecimento
    await pacientesStore.vincularAoEstabelecimento(
      pacienteId,
      userContext.estabelecimentoAtual!,
    )

    successMessage.value = 'Paciente cadastrado com sucesso!'
    emit('concluido', pacienteId)
    
    setTimeout(() => {
      fechar()
    }, 1500)
  } catch (error: any) {
    console.error('Erro ao salvar paciente:', error)
    errorMessage.value = error.message || 'Erro ao salvar paciente'
  } finally {
    loading.value = false
  }
}

function voltarParaBusca() {
  etapa.value = 'busca'
  pacienteEncontrado.value = null
}

function fechar() {
  formData.value = {
    tipo_documento: 'cpf',
    cpf: '',
    documento_internacional: '',
    nome_completo: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    telefone_secundario: '',
    celular: '',
    endereco: '',
    observacoes: '',
  }
  etapa.value = 'busca'
  pacienteEncontrado.value = null
  errorMessage.value = ''
  successMessage.value = ''
  emit('fechar')
}

function formatarCPF(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '')
  
  if (value.length > 11) {
    value = value.substring(0, 11)
  }
  
  value = value.replace(/(\d{3})(\d)/, '$1.$2')
  value = value.replace(/(\d{3})(\d)/, '$1.$2')
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  
  formData.value.cpf = value
}

function formatarTelefone(event: Event, campo: 'telefone' | 'telefone_secundario' | 'celular') {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '')
  
  if (value.length > 11) {
    value = value.substring(0, 11)
  }
  
  if (value.length <= 10) {
    value = value.replace(/(\d{2})(\d)/, '($1) $2')
    value = value.replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    value = value.replace(/(\d{2})(\d)/, '($1) $2')
    value = value.replace(/(\d{5})(\d)/, '$1-$2')
  }
  
  formData.value[campo] = value
}
</script>

<template>
  <div
    v-if="mostrar"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="fechar"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">
            {{ etapa === 'busca' ? 'Buscar Paciente' : 'Completar Cadastro' }}
          </h2>
          <p class="text-sm text-gray-600 mt-1">
            {{
              etapa === 'busca'
                ? 'Digite o documento para buscar ou cadastrar'
                : 'Complete as informações do paciente'
            }}
          </p>
        </div>
        <button
          class="text-gray-400 hover:text-gray-600 transition"
          @click="fechar"
        >
          <span class="text-2xl">×</span>
        </button>
      </div>

      <!-- Mensagens -->
      <div v-if="successMessage" class="mx-8 mt-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="mx-8 mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        {{ errorMessage }}
      </div>

      <!-- Conteúdo -->
      <div class="p-8">
        <!-- ETAPA 1: BUSCA POR DOCUMENTO -->
        <form v-if="etapa === 'busca'" @submit.prevent="buscarPaciente">
          <!-- Tipo de Documento -->
          <div class="mb-6">
            <label class="block mb-3 font-semibold text-gray-700">
              Tipo de Documento
            </label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="formData.tipo_documento"
                  type="radio"
                  value="cpf"
                  class="w-5 h-5 accent-primary"
                />
                <span>CPF</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="formData.tipo_documento"
                  type="radio"
                  value="internacional"
                  class="w-5 h-5 accent-primary"
                />
                <span>Documento Internacional</span>
              </label>
            </div>
          </div>

          <!-- CPF -->
          <div v-if="formData.tipo_documento === 'cpf'" class="mb-6">
            <label class="block mb-2 font-semibold text-gray-700">
              CPF *
            </label>
            <input
              v-model="formData.cpf"
              type="text"
              class="form-input"
              placeholder="000.000.000-00"
              maxlength="14"
              @input="formatarCPF"
              required
            />
            <span class="text-xs text-gray-600">
              Digite o CPF do paciente
            </span>
          </div>

          <!-- Documento Internacional -->
          <div v-else class="mb-6">
            <label class="block mb-2 font-semibold text-gray-700">
              Documento Internacional *
            </label>
            <input
              v-model="formData.documento_internacional"
              type="text"
              class="form-input"
              placeholder="Passaporte, RG estrangeiro, etc."
              required
            />
            <span class="text-xs text-gray-600">
              Digite o número do documento
            </span>
          </div>

          <!-- Botões -->
          <div class="flex justify-end gap-4">
            <button
              type="button"
              class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              @click="fechar"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="!podeAvancar || loading"
            >
              {{ loading ? 'Buscando...' : 'Buscar' }}
            </button>
          </div>
        </form>

        <!-- ETAPA 2: CADASTRO COMPLETO -->
        <form v-else @submit.prevent="salvarPaciente">
          <!-- Informação sobre paciente encontrado -->
          <div v-if="pacienteEncontrado" class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-blue-800 font-semibold mb-2">
              ✓ Paciente encontrado no sistema!
            </p>
            <p class="text-sm text-blue-700">
              Confirme ou atualize as informações abaixo antes de vincular ao estabelecimento.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Nome Completo -->
            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                Nome Completo *
              </label>
              <input
                v-model="formData.nome_completo"
                type="text"
                class="form-input"
                placeholder="Nome completo do paciente"
                required
              />
            </div>

            <!-- Data de Nascimento -->
            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Data de Nascimento
              </label>
              <input
                v-model="formData.data_nascimento"
                type="date"
                class="form-input"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                E-mail
              </label>
              <input
                v-model="formData.email"
                type="email"
                class="form-input"
                placeholder="email@exemplo.com"
              />
            </div>

            <!-- Telefone -->
            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Telefone
              </label>
              <input
                v-model="formData.telefone"
                type="text"
                class="form-input"
                placeholder="(00) 0000-0000"
                @input="(e) => formatarTelefone(e, 'telefone')"
              />
            </div>

            <!-- Celular -->
            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Celular
              </label>
              <input
                v-model="formData.celular"
                type="text"
                class="form-input"
                placeholder="(00) 00000-0000"
                @input="(e) => formatarTelefone(e, 'celular')"
              />
            </div>

            <!-- Telefone Secundário -->
            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                Telefone Secundário
              </label>
              <input
                v-model="formData.telefone_secundario"
                type="text"
                class="form-input"
                placeholder="Contato de emergência"
                @input="(e) => formatarTelefone(e, 'telefone_secundario')"
              />
            </div>

            <!-- Endereço -->
            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                Endereço
              </label>
              <input
                v-model="formData.endereco"
                type="text"
                class="form-input"
                placeholder="Rua, número, complemento, bairro, cidade"
              />
            </div>

            <!-- Observações -->
            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                Observações
              </label>
              <textarea
                v-model="formData.observacoes"
                class="form-input"
                rows="3"
                placeholder="Informações adicionais sobre o paciente"
              ></textarea>
            </div>
          </div>

          <!-- Botões -->
          <div class="flex justify-between mt-8">
            <button
              type="button"
              class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              @click="voltarParaBusca"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="!podeAvancar || loading"
            >
              {{ loading ? 'Salvando...' : pacienteEncontrado ? 'Confirmar e Vincular' : 'Cadastrar Paciente' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>