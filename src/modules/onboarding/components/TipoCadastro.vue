<script setup lang="ts">
import { useOnboardingStore } from '@/stores/onboarding'

const onboarding = useOnboardingStore()
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-primary-dark text-center mb-6">
      Complete seu cadastro
    </h2>

    <p class="text-gray-600 text-center mb-8">
      Informe o tipo de cadastro
    </p>

    <div class="flex gap-4 mb-8">
      <button
        type="button"
        :class="[
          'flex-1 py-6 px-4 rounded-lg border-2 font-semibold transition',
          onboarding.tipoCadastro === 'profissional'
            ? 'border-primary bg-primary-light text-primary'
            : 'border-gray-300 hover:border-primary-medium',
        ]"
        @click="onboarding.tipoCadastro = 'profissional'"
      >
        Profissional
      </button>

      <button
        type="button"
        :class="[
          'flex-1 py-6 px-4 rounded-lg border-2 font-semibold transition',
          onboarding.tipoCadastro === 'estabelecimento'
            ? 'border-primary bg-primary-light text-primary'
            : 'border-gray-300 hover:border-primary-medium',
        ]"
        @click="onboarding.tipoCadastro = 'estabelecimento'"
      >
        Estabelecimento
      </button>
    </div>

    <div class="flex justify-end">
      <button
        type="button"
        class="btn-primary"
        :disabled="!onboarding.tipoCadastro"
        @click="onboarding.setTipoCadastro(onboarding.tipoCadastro!)"
      >
        Continuar
      </button>
    </div>
  </div>
</template>