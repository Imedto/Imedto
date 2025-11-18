<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserContextStore } from '@/stores/userContext'
import { supabase } from '@/lib/supabaseClient'

const userContext = useUserContextStore()
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const formData = ref({
  nome: '',
  razao_social: '',
  cnpj: '',
  telefone: '',
  email: '',
  endereco_completo: '',
  cidade: '',
  estado: '',
  cep: '',
})

const estabelecimentoId = computed(() => {
  return userContext.estabelecimentoAtual
})

const podeEditar = computed(() => {
  return userContext.isAdmin
})

onMounted(async () => {
  if (!estabelecimentoId.value) return

  // Carregar dados do estabelecimento
  const { data, error } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('id', estabelecimentoId.value)
    .single()

  if (error) {
    console.error('Erro ao carregar estabelecimento:', error)
    return
  }

  if (data) {
    formData.value = {
      nome: data.nome || '',
      razao_social: data.razao_social || '',
      cnpj: data.cnpj || '',
      telefone: data.telefone || '',
      email: data.email || '',
      endereco_completo: data.endereco_completo || '',
      cidade: data.cidade || '',
      estado: data.estado || '',
      cep: data.cep || '',
    }
  }
})

async function salvar() {
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    if (!estabelecimentoId.value) {
      throw new Error('Nenhum estabelecimento selecionado')
    }

    if (!podeEditar.value) {
      throw new Error('Você não tem permissão para editar')
    }

    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        nome: formData.value.nome,
        razao_social: formData.value.razao_social || null,
        cnpj: formData.value.cnpj || null,
        telefone: formData.value.telefone || null,
        email: formData.value.email || null,
        endereco_completo: formData.value.endereco_completo || null,
        cidade: formData.value.cidade || null,
        estado: formData.value.estado || null,
        cep: formData.value.cep || null,
      })
      .eq('id', estabelecimentoId.value)

    if (error) throw error

    successMessage.value = 'Dados salvos com sucesso!'
    
    // Recarregar contexto
    await userContext.carregarContexto()
    
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
          Configurações do Estabelecimento
        </h1>
        <p class="text-gray-600">
          Configure as informações do seu estabelecimento
        </p>
      </div>

      <!-- Alerta se não for admin -->
      <div v-if="!podeEditar" class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
        ⚠️ Você não tem permissão para editar. Apenas administradores podem alterar essas informações.
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
        <!-- Informações Básicas -->
        <div class="mb-8">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Informações Básicas</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                Nome Fantasia *
              </label>
              <input
                v-model="formData.nome"
                type="text"
                class="form-input"
                :disabled="!podeEditar"
                required
              />
            </div>

            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                Razão Social
              </label>
              <input
                v-model="formData.razao_social"
                type="text"
                class="form-input"
                :disabled="!podeEditar"
              />
            </div>

            <div>
              <label class="block mb-2 font-semibold text-gray-700">
                CNPJ
              </label>
              <input
                v-model="formData.cnpj"
                type="text"
                class="form-input"
                placeholder="00.000.000/0000-00"
                :disabled="!podeEditar"
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
                :disabled="!podeEditar"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block mb-2 font-semibold text-gray-700">
                E-mail
              </label>
              <input
                v-model="formData.email"
                type="email"
                class="form-input"
                :disabled="!podeEditar"
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
                :disabled="!podeEditar"
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
                :disabled="!podeEditar"
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
                :disabled="!podeEditar"
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
                :disabled="!podeEditar"
              />
            </div>
          </div>
        </div>

        <!-- Botões -->
        <div v-if="podeEditar" class="flex justify-end gap-4">
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