import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'

interface Profissional {
  id: string
  nome_completo: string
  cpf: string
  foto_url: string | null
  profissao_id: string
  registro_profissional: string | null
  onboarding_completo: boolean
  profissoes?: {
    nome: string
  }
}

interface Estabelecimento {
  id: string
  nome: string
  cnpj: string | null
  foto_url: string | null
}

interface Vinculo {
  id: string
  estabelecimento_id: string
  is_admin: boolean
  ativo: boolean
  estabelecimentos: Estabelecimento
}

export const useUserContextStore = defineStore('userContext', () => {
  const authStore = useAuthStore()

  // Estados
  const profissional = ref<Profissional | null>(null)
  const vinculos = ref<Vinculo[]>([])
  const estabelecimentoAtual = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computeds
  const estabelecimentos = computed(() => {
    return vinculos.value.map((v) => v.estabelecimentos)
  })

  const vinculoAtual = computed(() => {
    if (!estabelecimentoAtual.value) return null
    return vinculos.value.find(
      (v) => v.estabelecimento_id === estabelecimentoAtual.value,
    )
  })

  const isAdmin = computed(() => {
    return vinculoAtual.value?.is_admin || false
  })

  const temEstabelecimento = computed(() => {
    return vinculos.value.length > 0
  })

  // Actions
  async function carregarContexto() {
    try {
      loading.value = true
      error.value = null

      const userId = authStore.currentUser?.user?.id
      if (!userId) {
        throw new Error('Usuário não autenticado')
      }

      // 1. Buscar dados do profissional
      const { data: profData, error: profError } = await supabase
        .from('profissionais')
        .select(
          `
          *,
          profissoes (
            nome
          )
        `,
        )
        .eq('user_id', userId)
        .single()

      if (profError) throw profError
      profissional.value = profData

      // 2. Buscar vínculos e estabelecimentos
      const { data: vinculosData, error: vinculosError } = await supabase
        .from('vinculo_profissional_estabelecimento')
        .select(
          `
          *,
          estabelecimentos (
            id,
            nome,
            cnpj,
            foto_url
          )
        `,
        )
        .eq('profissional_id', profData.id)
        .eq('ativo', true)

      if (vinculosError) throw vinculosError
      vinculos.value = vinculosData || []

      // 3. Definir estabelecimento atual (primeiro da lista)
      if (vinculos.value.length > 0 && !estabelecimentoAtual.value) {
        estabelecimentoAtual.value = vinculos.value[0].estabelecimento_id
      }
    } catch (err: any) {
      console.error('Erro ao carregar contexto:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function trocarEstabelecimento(estabelecimentoId: string) {
    const vinculo = vinculos.value.find(
      (v) => v.estabelecimento_id === estabelecimentoId,
    )
    if (vinculo) {
      estabelecimentoAtual.value = estabelecimentoId
    }
  }

  function limparContexto() {
    profissional.value = null
    vinculos.value = []
    estabelecimentoAtual.value = null
    error.value = null
  }

  return {
    // States
    profissional,
    vinculos,
    estabelecimentoAtual,
    loading,
    error,
    // Computeds
    estabelecimentos,
    vinculoAtual,
    isAdmin,
    temEstabelecimento,
    // Actions
    carregarContexto,
    trocarEstabelecimento,
    limparContexto,
  }
})