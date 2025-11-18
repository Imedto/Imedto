<script setup lang="ts">
import { ref } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'

const onboarding = useOnboardingStore()
const localError = ref('')

async function handleSubmit() {
  localError.value = ''
  onboarding.resetError()
  
  try {
    await onboarding.criarEstabelecimento()
  } catch (error: any) {
    localError.value = error.message || 'Erro ao criar estabelecimento'
    console.error('Erro ao criar estabelecimento:', error)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <h2 class="text-2xl font-bold text-primary-dark text-center mb-6">
      Dados do Estabelecimento
    </h2>

    <!-- Mensagem de erro -->
    <div
      v-if="localError || onboarding.error"
      class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6"
    >
      {{ localError || onboarding.error }}
    </div>

    <!-- Nome do Estabelecimento -->
    <div class="mb-6">
      <label
        for="nomeEstabelecimento"
        class="block mb-2 font-semibold text-gray-700"
      >
        Nome do estabelecimento *
      </label>
      <input
        id="nomeEstabelecimento"
        v-model="onboarding.dadosEstabelecimento.nome"
        type="text"
        class="form-input"
        placeholder="Ex: Clínica Saúde Total"
        required
      />
      <span class="text-xs text-gray-600">
        Nome fantasia ou razão social
      </span>
    </div>

    <!-- CNPJ -->
    <div class="mb-6">
      <label for="cnpj" class="block mb-2 font-semibold text-gray-700">
        CNPJ (opcional)
      </label>
      <input
        id="cnpj"
        v-model="onboarding.dadosEstabelecimento.cnpj"
        type="text"
        class="form-input"
        placeholder="00.000.000/0000-00"
      />
      <span class="text-xs text-gray-600">
        Você pode preencher depois
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
        {{ onboarding.loading ? 'Criando...' : 'Concluir' }}
      </button>
    </div>
  </form>
</template>