<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { supabase } from '@/lib/supabaseClient'

const onboarding = useOnboardingStore()
const profissoes = ref<any[]>([])
const localError = ref('')

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('profissoes')
      .select('*')
      .order('nome')
    
    if (error) throw error
    
    if (data) {
      profissoes.value = data
    }
  } catch (error) {
    console.error('Erro ao carregar profissões:', error)
    localError.value = 'Erro ao carregar profissões'
  }
})

async function handleSubmit() {
  localError.value = ''
  onboarding.resetError()
  
  try {
    await onboarding.salvarDadosPessoais()
  } catch (error: any) {
    localError.value = error.message || 'Erro ao salvar dados'
    console.error('Erro ao salvar:', error)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <h2 class="text-2xl font-bold text-primary-dark text-center mb-6">
      Dados Pessoais
    </h2>

    <!-- Mensagem de erro -->
    <div
      v-if="localError || onboarding.error"
      class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6"
    >
      {{ localError || onboarding.error }}
    </div>

    <!-- Tipo Pessoa -->
    <div class="flex gap-4 mb-6">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="onboarding.tipoPessoa"
          type="radio"
          value="fisica"
          class="w-5 h-5 accent-primary"
        />
        <span>Pessoa Física</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="onboarding.tipoPessoa"
          type="radio"
          value="juridica"
          class="w-5 h-5 accent-primary"
        />
        <span>Pessoa Jurídica</span>
      </label>
    </div>

    <!-- Nome -->
    <div class="mb-6">
      <label for="nome" class="block mb-2 font-semibold text-gray-700">
        Nome completo *
      </label>
      <input
        id="nome"
        v-model="onboarding.dadosPessoais.nomeCompleto"
        type="text"
        class="form-input"
        placeholder="Digite seu nome completo"
        required
      />
    </div>

    <!-- CPF/CNPJ -->
    <div class="mb-6">
      <label for="cpf" class="block mb-2 font-semibold text-gray-700">
        {{ onboarding.tipoPessoa === 'fisica' ? 'CPF *' : 'CNPJ *' }}
      </label>
      <input
        id="cpf"
        v-model="onboarding.dadosPessoais.cpf"
        type="text"
        class="form-input"
        :placeholder="
          onboarding.tipoPessoa === 'fisica'
            ? '000.000.000-00'
            : '00.000.000/0000-00'
        "
        required
      />
    </div>

    <!-- Profissão (apenas se for profissional ou estabelecimento) -->
    <div class="mb-6">
      <label for="profissao" class="block mb-2 font-semibold text-gray-700">
        Profissão *
      </label>
      <select
        id="profissao"
        v-model="onboarding.dadosPessoais.profissaoId"
        class="form-input"
        required
      >
        <option value="">Selecione uma profissão</option>
        <option
          v-for="profissao in profissoes"
          :key="profissao.id"
          :value="profissao.id"
        >
          {{ profissao.nome }}
        </option>
      </select>
      <span class="text-xs text-gray-600">
        Selecione sua profissão principal
      </span>
    </div>

    <!-- Botões -->
    <div class="flex justify-between mt-8">
      <button
        type="button"
        class="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary-light transition"
        :disabled="onboarding.loading"
        @click="onboarding.previousStep"
      >
        Voltar
      </button>

      <button
        type="submit"
        class="btn-primary"
        :disabled="onboarding.loading"
      >
        {{ onboarding.loading ? 'Salvando...' : 'Continuar' }}
      </button>
    </div>
  </form>
</template>