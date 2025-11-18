import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { useUserContextStore } from './userContext'

interface Tarefa {
  id: string
  chave: string
  titulo: string
  descricao: string
  concluida: boolean
  progresso: number
  cor: string
  rota: string
}

export const useProgressoStore = defineStore('progresso', () => {
  const userContext = useUserContextStore()

  // Estado do progresso salvo no banco
  const progressoData = ref<any>(null)
  const loading = ref(false)

  // Tarefas base
  const tarefasBase: Omit<Tarefa, 'concluida' | 'progresso'>[] = [
    {
      id: '1',
      chave: 'cadastro_profissional',
      titulo: 'Complete seu cadastro profissional',
      descricao: 'Adicione informações como registro profissional, telefone e endereço.',
      cor: 'purple',
      rota: '/perfil',
    },
    {
      id: '2',
      chave: 'configuracao_estabelecimento',
      titulo: 'Configure seu estabelecimento',
      descricao: 'Adicione endereço, telefone e informações do estabelecimento.',
      cor: 'blue',
      rota: '/estabelecimento',
    },
    {
      id: '3',
      chave: 'convite_profissionais',
      titulo: 'Convide profissionais',
      descricao: 'Adicione outros profissionais ao seu estabelecimento.',
      cor: 'green',
      rota: '/profissionais',
    },
  ]

  // Computeds
  const tarefas = computed<Tarefa[]>(() => {
    if (!progressoData.value) {
      return tarefasBase.map((t) => ({
        ...t,
        concluida: false,
        progresso: 0,
      }))
    }

    return tarefasBase.map((t) => {
      const salva = progressoData.value[t.chave]
      return {
        ...t,
        concluida: salva?.concluida || false,
        progresso: salva?.progresso || 0,
      }
    })
  })

  const tarefasVisiveis = computed(() => {
    // Convite de profissionais só aparece para admins
    return tarefas.value.filter((t) => {
      if (t.chave === 'convite_profissionais') {
        return userContext.isAdmin
      }
      return true
    })
  })

  const progressoGeral = computed(() => {
    if (tarefasVisiveis.value.length === 0) return 100

    const total = tarefasVisiveis.value.reduce(
      (acc, t) => acc + (t.concluida ? 100 : t.progresso),
      0,
    )
    return Math.round(total / tarefasVisiveis.value.length)
  })

  const tarefasPendentes = computed(() => {
    return tarefasVisiveis.value.filter((t) => !t.concluida).length
  })

  const todasConcluidas = computed(() => {
    return tarefasPendentes.value === 0
  })

  // Actions
  async function carregarProgresso() {
    try {
      loading.value = true

      const profissionalId = userContext.profissional?.id
      if (!profissionalId) return

      // Verificar se existe uma tabela de progresso
      // Se não existir, vamos criar
      const { data, error } = await supabase
        .from('progresso_tarefas')
        .select('*')
        .eq('profissional_id', profissionalId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = tabela não existe
        console.error('Erro ao carregar progresso:', error)
        return
      }

      if (data) {
        progressoData.value = data.dados || {}
      } else {
        progressoData.value = {}
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
    } finally {
      loading.value = false
    }
  }

  async function atualizarProgresso(chave: string, progresso: number) {
    try {
      const profissionalId = userContext.profissional?.id
      if (!profissionalId) return

      // Atualizar estado local
      if (!progressoData.value) {
        progressoData.value = {}
      }

      progressoData.value[chave] = {
        progresso,
        concluida: progresso >= 100,
        atualizado_em: new Date().toISOString(),
      }

      // Salvar no banco (se a tabela existir)
      await salvarProgresso()
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
    }
  }

  async function marcarComoConcluida(chave: string) {
    await atualizarProgresso(chave, 100)
  }

  async function salvarProgresso() {
    try {
      const profissionalId = userContext.profissional?.id
      if (!profissionalId) return

      // Verificar se já existe
      const { data: existe } = await supabase
        .from('progresso_tarefas')
        .select('id')
        .eq('profissional_id', profissionalId)
        .maybeSingle()

      if (existe) {
        // Atualizar
        await supabase
          .from('progresso_tarefas')
          .update({
            dados: progressoData.value,
            updated_at: new Date().toISOString(),
          })
          .eq('profissional_id', profissionalId)
      } else {
        // Inserir
        await supabase.from('progresso_tarefas').insert({
          profissional_id: profissionalId,
          dados: progressoData.value,
        })
      }
    } catch (error: any) {
      // Se a tabela não existir, ignorar erro silenciosamente
      if (error.code !== '42P01') {
        // 42P01 = tabela não existe
        console.error('Erro ao salvar progresso:', error)
      }
    }
  }

  async function calcularProgressoAutomatico() {
    try {
      const profissionalId = userContext.profissional?.id
      if (!profissionalId) return

      // 1. Verificar cadastro profissional
      const { data: profissional } = await supabase
        .from('profissionais')
        .select('*')
        .eq('id', profissionalId)
        .single()

      if (profissional) {
        let progressoCadastro = 0
        const campos = [
          'registro_profissional',
          'telefone',
          'celular',
          'endereco_completo',
          'cidade',
          'estado',
        ]

        const camposPreenchidos = campos.filter((campo) => profissional[campo])
        progressoCadastro = Math.round(
          (camposPreenchidos.length / campos.length) * 100,
        )

        await atualizarProgresso('cadastro_profissional', progressoCadastro)
      }

      // 2. Verificar configuração do estabelecimento
      if (userContext.estabelecimentoAtual) {
        const { data: estabelecimento } = await supabase
          .from('estabelecimentos')
          .select('*')
          .eq('id', userContext.estabelecimentoAtual)
          .single()

        if (estabelecimento) {
          let progressoEstab = 0
          const campos = [
            'razao_social',
            'cnpj',
            'telefone',
            'email',
            'endereco_completo',
            'cidade',
          ]

          const camposPreenchidos = campos.filter(
            (campo) => estabelecimento[campo],
          )
          progressoEstab = Math.round(
            (camposPreenchidos.length / campos.length) * 100,
          )

          await atualizarProgresso(
            'configuracao_estabelecimento',
            progressoEstab,
          )
        }
      }
    } catch (error) {
      console.error('Erro ao calcular progresso automático:', error)
    }
  }

  return {
    progressoData,
    loading,
    tarefas,
    tarefasVisiveis,
    progressoGeral,
    tarefasPendentes,
    todasConcluidas,
    carregarProgresso,
    atualizarProgresso,
    marcarComoConcluida,
    calcularProgressoAutomatico,
  }
})