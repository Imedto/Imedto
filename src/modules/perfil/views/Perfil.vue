<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserContextStore } from '@/stores/userContext'
import { supabase } from '@/lib/supabaseClient'

const userContext = useUserContextStore()
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const formData = ref({
  nome_completo: '',
  cpf: '',
  rg: '',
  data_nascimento: '',
  telefone: '',
  celular: '',
  registro_profissional: '',
  registro_uf: '',
  profissao_id: '',
  endereco_completo: '',
  cidade: '',
  estado: '',
  cep: '',
})

const profissoes = ref<any[]>([])

onMounted(async () => {
  // Carregar profissões
  const { data: profData } = await supabase
    .from('profissoes')
    .select('*')
    .order('nome')
  
  if (profData) profissoes.value = profData

  // Preencher formulário com dados existentes
  if (userContext.profissional) {
    const prof = userContext.profissional
    formData.value = {
      nome_completo: prof.nome_completo || '',
      cpf: prof.cpf || '',
      rg: prof.rg || '',
      data_nascimento: prof.data_nascimento || '',
      telefone: prof.telefone || '',
      celular: prof.celular || '',
      registro_profissional: prof.registro_profissional || '',
      registro_uf: prof.registro_uf || '',
      profissao_id: prof.profissao_id || '',
      endereco_completo: prof.endereco_completo || '',
      cidade: prof.cidade || '',
      estado: prof.estado || '',
      cep: prof.cep || '',
    }
  }
})

async function salvar() {
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    if (!userContext.profissional?.id) {
      throw new Error('Profissional não encontrado')
    }

    const { error } = await supabase
      .from('profissionais')
      .update({
        nome_completo: formData.value.nome_completo,
        rg: formData.value.rg || null,
        data_nascimento: formData.value.data_nascimento || null,
        telefone: formData.value.telefone || null,
        celular: formData.value.celular || null,
        registro_profissional: formData.value.registro_profissional || null,
        registro_uf: formData.value.registro_uf || null,
        profissao_id: formData.value.profissao_id || null,
        endereco_completo: formData.value.endereco_completo || null,
        cidade: formData.value.cidade || null,
        estado: formData.value.estado || null,
        cep: formData.value.cep || null,
      })
      .eq('id', userContext.profissional.id)

    if (error) throw error

    successMessage.value = 'Dados salvos com sucesso!'
    
    // Recarregar contexto
    await userContext.carregarContexto()
    
    // ADICIONAR ESTAS LINHAS:
    // Recalcular progresso
    await progresso.calcularProgressoAutomatico()
  } catch (error: any) {
    console.error('Erro ao salvar:', error)
    errorMessage.value = error.message || 'Erro ao salvar dados'
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
        <h1 class="text-3xl font-bold text-primary-dark mb-2">
          Meu Perfil
        </h1>
        <p class="text-gray-600">
          Complete suas informações profissionais
        </p>
      </div>

      <!-- Mensagens -->
      <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-6">
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
        {{ errorMessage }}
      </div>

      <!-- Formulário -->
      <form @submit.prevent="salvar" class="bg-white rounded-xl shadow-lg p-8">
        <!-- Dados Pessoais -->
        <div class="mb-8">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Dados Pessoais</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                Nome Completo *
              </label>
              <input
                v-model="formData.nome_completo"
                type="text"
                class="form-input"
                required
              />
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                CPF *
              </label>
              <input
                v-model="formData.cpf"
                type="text"
                class="form-input"
                disabled
              />
              <span class="text-xs text-gray-500">Não é possível alterar o CPF</span>
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                RG
              </label>
              <input
                v-model="formData.rg"
                type="text"
                class="form-input"
              />
            </div>

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

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Telefone
              </label>
              <input
                v-model="formData.telefone"
                type="tel"
                class="form-input"
                placeholder="(00) 0000-0000"
              />
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Celular
              </label>
              <input
                v-model="formData.celular"
                type="tel"
                class="form-input"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        <!-- Dados Profissionais -->
        <div class="mb-8 pt-8 border-t border-gray-200">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Dados Profissionais</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Profissão *
              </label>
              <select
                v-model="formData.profissao_id"
                class="form-input"
                required
              >
                <option value="">Selecione</option>
                <option
                  v-for="prof in profissoes"
                  :key="prof.id"
                  :value="prof.id"
                >
                  {{ prof.nome }}
                </option>
              </select>
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Registro Profissional
              </label>
              <input
                v-model="formData.registro_profissional"
                type="text"
                class="form-input"
                placeholder="Ex: CRM 12345"
              />
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                UF do Registro
              </label>
              <input
                v-model="formData.registro_uf"
                type="text"
                class="form-input"
                placeholder="Ex: SP"
                maxlength="2"
              />
            </div>
          </div>
        </div>

        <!-- Endereço -->
        <div class="mb-8 pt-8 border-t border-gray-200">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Endereço</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                Endereço Completo
              </label>
              <input
                v-model="formData.endereco_completo"
                type="text"
                class="form-input"
                placeholder="Rua, número, complemento"
              />
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Cidade
              </label>
              <input
                v-model="formData.cidade"
                type="text"
                class="form-input"
              />
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                Estado
              </label>
              <input
                v-model="formData.estado"
                type="text"
                class="form-input"
                placeholder="Ex: SP"
                maxlength="2"
              />
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                CEP
              </label>
              <input
                v-model="formData.cep"
                type="text"
                class="form-input"
                placeholder="00000-000"
              />
            </div>
          </div>
        </div>

        <!-- Botões -->
        <div class="flex justify-end gap-4">
          <button
            type="button"
            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            @click="$router.back()"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="loading"
          >
            {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>