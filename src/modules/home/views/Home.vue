<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserContextStore } from '@/stores/userContext'
import { useProgressoStore } from '@/stores/progresso'
import { useRouter } from 'vue-router'

const userContext = useUserContextStore()
const progresso = useProgressoStore()
const router = useRouter()

onMounted(async () => {
  await progresso.carregarProgresso()
  await progresso.calcularProgressoAutomatico()
})
</script>

<template>
  <section class="p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-primary-dark mb-2">
          Bem vindo,
          {{ userContext.profissional?.nome_completo?.split(' ')[0] }}! 👋
        </h1>
        <p class="text-gray-600">
          {{
            progresso.todasConcluidas
              ? 'Parabéns! Você concluiu todas as tarefas iniciais.'
              : 'Complete seu cadastro para aproveitar todas as funcionalidades da plataforma'
          }}
        </p>
      </div>

      <!-- Progress Card -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 mb-1">
              <span
                :class="
                  progresso.progressoGeral === 100
                    ? 'text-green-500'
                    : 'text-yellow-500'
                "
              >
                ●
              </span>
              {{ progresso.progressoGeral }}% Completo
            </h2>
            <p class="text-gray-600">
              <span
                :class="
                  progresso.tarefasPendentes > 0 ? 'text-red-500' : 'text-green-500'
                "
              >
                {{ progresso.tarefasPendentes > 0 ? '▲' : '✓' }}
              </span>
              {{
                progresso.tarefasPendentes === 0
                  ? 'Todas as tarefas concluídas!'
                  : `${progresso.tarefasPendentes} ${progresso.tarefasPendentes === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`
              }}
            </p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            class="h-2 rounded-full transition-all duration-500"
            :class="
              progresso.progressoGeral === 100 ? 'bg-green-500' : 'bg-yellow-500'
            "
            :style="{ width: `${progresso.progressoGeral}%` }"
          ></div>
        </div>
        <p class="text-sm text-gray-500">{{ progresso.progressoGeral }}%</p>
      </div>

      <!-- Task Cards -->
      <div v-if="!progresso.todasConcluidas" class="grid grid-cols-1 gap-6">
        <div
          v-for="tarefa in progresso.tarefasVisiveis"
          :key="tarefa.id"
          :class="[
            'border rounded-xl p-6 transition',
            tarefa.concluida ? 'opacity-60' : '',
            tarefa.cor === 'purple'
              ? 'bg-purple-50 border-purple-200'
              : tarefa.cor === 'blue'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-green-50 border-green-200',
          ]"
        >
          <div class="flex items-start gap-4">
            <!-- Checkbox -->
            <div class="pt-1">
              <div
                :class="[
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  tarefa.concluida
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300',
                ]"
              >
                <span v-if="tarefa.concluida" class="text-white text-sm">✓</span>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2">
                {{ tarefa.titulo }}
              </h3>
              <p class="text-gray-600 mb-4">
                {{ tarefa.descricao }}
              </p>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4 flex-1">
                  <span class="text-sm text-gray-600">
                    {{ tarefa.concluida ? 'Concluída' : 'Pendente' }}
                  </span>
                  <div class="flex items-center gap-2 flex-1">
                    <div class="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                      <div
                        class="bg-green-500 h-2 rounded-full transition-all"
                        :style="{
                          width: `${tarefa.concluida ? 100 : tarefa.progresso}%`,
                        }"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-600 whitespace-nowrap">
                      {{ tarefa.concluida ? 100 : tarefa.progresso }}%
                    </span>
                  </div>
                </div>
                <button
                  v-if="!tarefa.concluida"
                  class="px-6 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary-light transition"
                  @click="router.push(tarefa.rota)"
                >
                  Completar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensagem de Sucesso -->
      <div
        v-else
        class="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center"
      >
        <span class="text-6xl mb-4 block">🎉</span>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          Parabéns! Você concluiu o cadastro inicial
        </h2>
        <p class="text-gray-600 mb-6">
          Agora você pode aproveitar todas as funcionalidades da plataforma.
        </p>
        <button
          class="btn-primary"
          @click="router.push('/agendamento')"
        >
          Começar a usar
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div class="bg-white rounded-xl shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Agendamentos Hoje</p>
              <p class="text-3xl font-bold text-primary">0</p>
            </div>
            <span class="text-4xl">📅</span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Pacientes Ativos</p>
              <p class="text-3xl font-bold text-primary">0</p>
            </div>
            <span class="text-4xl">👥</span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Profissionais</p>
              <p class="text-3xl font-bold text-primary">
                {{ userContext.vinculos.length }}
              </p>
            </div>
            <span class="text-4xl">👨‍⚕️</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>