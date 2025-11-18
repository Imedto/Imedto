<script setup lang="ts">
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'
import TipoCadastro from '../components/TipoCadastro.vue'
import DadosPessoais from '../components/DadosPessoais.vue'
import DadosEstabelecimento from '../components/DadosEstabelecimento.vue'

const onboarding = useOnboardingStore()

const currentComponent = computed(() => {
  switch (onboarding.step) {
    case 1:
      return TipoCadastro
    case 2:
      return DadosPessoais
    case 3:
      return DadosEstabelecimento
    default:
      return TipoCadastro
  }
})
</script>

<template>
  <main class="min-h-screen bg-white flex items-center justify-center p-8">
    <div class="max-w-2xl w-full">
      <div class="text-center mb-8">
        <img
          src="@/assets/images/imedto-logo.png"
          alt="imedto"
          class="h-12 mx-auto mb-6"
        />
        <h1 class="text-4xl font-bold text-primary-dark mb-2">Boas vindas!</h1>
        <p class="text-gray-600">
          <strong>Atenção:</strong> Para continuar o seu acesso complete algumas
          informações para concluir o seu cadastro.
        </p>
      </div>

      <!-- Progress Steps -->
      <div class="flex justify-center items-center gap-4 mb-8">
        <div
          v-for="stepNum in 3"
          :key="stepNum"
          class="flex items-center"
        >
          <div
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition',
              stepNum === onboarding.step
                ? 'bg-primary text-white'
                : stepNum < onboarding.step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500',
            ]"
          >
            {{ stepNum }}
          </div>
          <div
            v-if="stepNum < 3"
            :class="[
              'w-16 h-1 transition',
              stepNum < onboarding.step ? 'bg-green-500' : 'bg-gray-200',
            ]"
          ></div>
        </div>
      </div>

      <!-- Dynamic Component -->
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <component :is="currentComponent" />
      </div>

      <p class="text-center text-gray-600 mt-6">
        Deseja sair?
        <router-link
          to="/login"
          class="text-primary hover:underline underline-offset-2 transition"
        >
          Acesse aqui
        </router-link>
      </p>
    </div>
  </main>
</template>