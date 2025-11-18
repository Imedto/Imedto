import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { useUserContextStore } from './userContext'

export interface Agendamento {
  id: string
  estabelecimento_id: string
  profissional_id: string
  paciente_id: string | null
  data_hora_inicio: string
  data_hora_fim: string
  duracao_minutos: number
  tipo_atendimento: string
  status: 'agendado' | 'confirmado' | 'em_atendimento' | 'realizado' | 'cancelado' | 'faltou'
  observacoes: string | null
  cor_evento: string
  created_at: string
  // Relacionamentos
  pacientes?: {
    id: string
    nome_completo: string
    telefone: string
    celular: string
  }
  profissionais?: {
    id: string
    nome_completo: string
  }
}

export const useAgendamentoStore = defineStore('agendamento', () => {
  const userContext = useUserContextStore()

  // Estados
  const agendamentos = ref<Agendamento[]>([])
  const agendamentoSelecionado = ref<Agendamento | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filtros
  const dataInicio = ref<string>('')
  const dataFim = ref<string>('')
  const profissionalFiltro = ref<string | null>(null)
  const statusFiltro = ref<string | null>(null)

  // Computeds
  const agendamentosFiltrados = computed(() => {
    let resultado = agendamentos.value

    if (profissionalFiltro.value) {
      resultado = resultado.filter(
        (a) => a.profissional_id === profissionalFiltro.value,
      )
    }

    if (statusFiltro.value) {
      resultado = resultado.filter((a) => a.status === statusFiltro.value)
    }

    return resultado
  })

  const agendamentosHoje = computed(() => {
    const hoje = new Date().toISOString().split('T')[0]
    return agendamentos.value.filter((a) => {
      const dataAgendamento = a.data_hora_inicio.split('T')[0]
      return dataAgendamento === hoje
    })
  })

  const proximosAgendamentos = computed(() => {
    const agora = new Date()
    return agendamentos.value
      .filter((a) => {
        const dataAgendamento = new Date(a.data_hora_inicio)
        return dataAgendamento > agora && a.status === 'agendado'
      })
      .sort((a, b) => {
        return (
          new Date(a.data_hora_inicio).getTime() -
          new Date(b.data_hora_inicio).getTime()
        )
      })
      .slice(0, 5)
  })

  // Actions
  async function carregarAgendamentos(inicio?: string, fim?: string) {
    try {
      loading.value = true
      error.value = null

      if (!userContext.estabelecimentoAtual) {
        throw new Error('Nenhum estabelecimento selecionado')
      }

      let query = supabase
        .from('evento_agendamento')
        .select(
          `
          *,
          pacientes (
            id,
            nome_completo,
            telefone,
            celular
          ),
          profissionais (
            id,
            nome_completo
          )
        `,
        )
        .eq('estabelecimento_id', userContext.estabelecimentoAtual)
        .order('data_hora_inicio', { ascending: true })

      // Filtrar por data se fornecido
      if (inicio) {
        query = query.gte('data_hora_inicio', inicio)
      }
      if (fim) {
        query = query.lte('data_hora_inicio', fim)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      agendamentos.value = data || []
    } catch (err: any) {
      console.error('Erro ao carregar agendamentos:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function carregarAgendamento(id: string) {
    try {
      loading.value = true
      error.value = null

      const { data, error: queryError } = await supabase
        .from('evento_agendamento')
        .select(
          `
          *,
          pacientes (
            id,
            nome_completo,
            telefone,
            celular,
            data_nascimento
          ),
          profissionais (
            id,
            nome_completo,
            profissoes (
              nome
            )
          )
        `,
        )
        .eq('id', id)
        .single()

      if (queryError) throw queryError

      agendamentoSelecionado.value = data
      return data
    } catch (err: any) {
      console.error('Erro ao carregar agendamento:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function criarAgendamento(dados: Partial<Agendamento>) {
    try {
      loading.value = true
      error.value = null

      if (!userContext.estabelecimentoAtual) {
        throw new Error('Nenhum estabelecimento selecionado')
      }

      const { data, error: insertError } = await supabase
        .from('evento_agendamento')
        .insert({
          estabelecimento_id: userContext.estabelecimentoAtual,
          profissional_id: dados.profissional_id,
          paciente_id: dados.paciente_id || null,
          data_hora_inicio: dados.data_hora_inicio,
          data_hora_fim: dados.data_hora_fim,
          duracao_minutos: dados.duracao_minutos || 30,
          tipo_atendimento: dados.tipo_atendimento || 'consulta',
          status: dados.status || 'agendado',
          observacoes: dados.observacoes || null,
          cor_evento: dados.cor_evento || '#452B97',
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Adicionar à lista local
      await carregarAgendamentos()

      return data
    } catch (err: any) {
      console.error('Erro ao criar agendamento:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function atualizarAgendamento(
    id: string,
    dados: Partial<Agendamento>,
  ) {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('evento_agendamento')
        .update(dados)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Atualizar lista local
      const index = agendamentos.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        agendamentos.value[index] = { ...agendamentos.value[index], ...data }
      }

      return data
    } catch (err: any) {
      console.error('Erro ao atualizar agendamento:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelarAgendamento(id: string, motivo?: string) {
    return atualizarAgendamento(id, {
      status: 'cancelado',
      observacoes: motivo || 'Cancelado',
    })
  }

  async function confirmarAgendamento(id: string) {
    return atualizarAgendamento(id, { status: 'confirmado' })
  }

  async function iniciarAtendimento(id: string) {
    return atualizarAgendamento(id, { status: 'em_atendimento' })
  }

  async function finalizarAtendimento(id: string) {
    return atualizarAgendamento(id, { status: 'realizado' })
  }

  async function marcarFalta(id: string) {
    return atualizarAgendamento(id, { status: 'faltou' })
  }

  function limpar() {
    agendamentos.value = []
    agendamentoSelecionado.value = null
    error.value = null
  }

  return {
    // Estados
    agendamentos,
    agendamentoSelecionado,
    loading,
    error,
    dataInicio,
    dataFim,
    profissionalFiltro,
    statusFiltro,
    // Computeds
    agendamentosFiltrados,
    agendamentosHoje,
    proximosAgendamentos,
    // Actions
    carregarAgendamentos,
    carregarAgendamento,
    criarAgendamento,
    atualizarAgendamento,
    cancelarAgendamento,
    confirmarAgendamento,
    iniciarAtendimento,
    finalizarAtendimento,
    marcarFalta,
    limpar,
  }
})