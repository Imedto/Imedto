<script setup lang="ts">
import { useProgressoStore } from '@/stores/progresso'
import { useRouter } from 'vue-router'

const progresso = useProgressoStore()
const router = useRouter()

async function marcarComoConcluida() {
  await progresso.marcarComoConcluida('convite_profissionais')
  router.push('/home')
}
</script>

<template>
  <section class="p-8">
    <div class="max-w-7xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-primary-dark mb-2">
          Profissionais
        </h1>
        <p class="text-gray-600">
          Gerencie a equipe do seu estabelecimento
        </p>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-12 text-center">
        <span class="text-6xl mb-4 block">👨‍⚕️</span>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          Em desenvolvimento
        </h2>
        <p class="text-gray-600 mb-6">
          A funcionalidade de gestão de profissionais será implementada em breve.
        </p>
        <button
          class="btn-primary"
          @click="marcarComoConcluida"
        >
          Marcar como concluída
        </button>
      </div>
    </div>
  </section>
</template>