import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { useUserContextStore } from './userContext'

export interface Paciente {
  id: string
  cpf: string | null
  documento_internacional: string | null
  tipo_documento: 'cpf' | 'internacional'
  nome_completo: string
  data_nascimento: string | null
  email: string | null
  telefone: string | null
  telefone_secundario: string | null
  celular: string | null
  endereco: string | null
  observacoes: string | null
  foto_url: string | null
  created_at: string
  updated_at: string
}

export interface PacienteEstabelecimento {
  id: string
  paciente_id: string
  estabelecimento_id: string
  data_primeira_consulta: string
  ativo: boolean
}

export const usePacientesStore = defineStore('pacientes', () => {
  const userContext = useUserContextStore()

  // Estados
  const pacientes = ref<Paciente[]>([])
  const pacienteSelecionado = ref<Paciente | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filtros
  const termoBusca = ref('')

  // Computeds
  const pacientesFiltrados = computed(() => {
    if (!termoBusca.value) return pacientes.value

    const termo = termoBusca.value.toLowerCase()
    return pacientes.value.filter((p) => {
      return (
        p.nome_completo?.toLowerCase().includes(termo) ||
        p.cpf?.includes(termo) ||
        p.telefone?.includes(termo) ||
        p.celular?.includes(termo)
      )
    })
  })

  // Actions
  async function carregarPacientes() {
    try {
      loading.value = true
      error.value = null

      if (!userContext.estabelecimentoAtual) {
        throw new Error('Nenhum estabelecimento selecionado')
      }

      const { data, error: queryError } = await supabase
        .from('pacientes')
        .select(
          `
          *,
          paciente_estabelecimento!inner (
            estabelecimento_id,
            data_primeira_consulta,
            ativo
          )
        `,
        )
        .eq(
          'paciente_estabelecimento.estabelecimento_id',
          userContext.estabelecimentoAtual,
        )
        .eq('paciente_estabelecimento.ativo', true)
        .order('nome_completo')

      if (queryError) throw queryError

      pacientes.value = data || []
    } catch (err: any) {
      console.error('Erro ao carregar pacientes:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function carregarPaciente(id: string) {
    try {
      loading.value = true
      error.value = null

      const { data, error: queryError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single()

      if (queryError) throw queryError

      pacienteSelecionado.value = data
      return data
    } catch (err: any) {
      console.error('Erro ao carregar paciente:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function buscarPorDocumento(documento: string, tipo: 'cpf' | 'internacional' = 'cpf') {
    try {
      const campo = tipo === 'cpf' ? 'cpf' : 'documento_internacional'
      
      const { data, error: queryError } = await supabase
        .from('pacientes')
        .select('*')
        .eq(campo, documento)
        .maybeSingle()

      if (queryError) throw queryError

      return data
    } catch (err: any) {
      console.error('Erro ao buscar paciente:', err)
      throw err
    }
  }

  async function buscarOuCriarPaciente(dados: Partial<Paciente>) {
    try {
      loading.value = true
      error.value = null

      // Usar a função do Supabase para buscar ou criar
      const { data, error: rpcError } = await supabase.rpc(
        'buscar_ou_criar_paciente',
        {
          p_cpf: dados.cpf || null,
          p_documento_internacional: dados.documento_internacional || null,
          p_nome_completo: dados.nome_completo || null,
          p_data_nascimento: dados.data_nascimento || null,
          p_telefone: dados.telefone || null,
          p_celular: dados.celular || null,
          p_email: dados.email || null,
          p_endereco: dados.endereco || null,
        },
      )

      if (rpcError) throw rpcError

      return data as string // retorna o ID do paciente
    } catch (err: any) {
      console.error('Erro ao buscar ou criar paciente:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function criarPaciente(dados: Partial<Paciente>) {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('pacientes')
        .insert({
          cpf: dados.cpf || null,
          documento_internacional: dados.documento_internacional || null,
          tipo_documento: dados.tipo_documento || 'cpf',
          nome_completo: dados.nome_completo,
          data_nascimento: dados.data_nascimento || null,
          email: dados.email || null,
          telefone: dados.telefone || null,
          telefone_secundario: dados.telefone_secundario || null,
          celular: dados.celular || null,
          endereco: dados.endereco || null,
          observacoes: dados.observacoes || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return data
    } catch (err: any) {
      console.error('Erro ao criar paciente:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function atualizarPaciente(id: string, dados: Partial<Paciente>) {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('pacientes')
        .update(dados)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Atualizar lista local
      const index = pacientes.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        pacientes.value[index] = { ...pacientes.value[index], ...data }
      }

      return data
    } catch (err: any) {
      console.error('Erro ao atualizar paciente:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function vincularAoEstabelecimento(
    pacienteId: string,
    estabelecimentoId: string,
  ) {
    try {
      // Usar a função do Supabase para vincular
      const { data, error: rpcError } = await supabase.rpc(
        'vincular_paciente_estabelecimento',
        {
          p_paciente_id: pacienteId,
          p_estabelecimento_id: estabelecimentoId,
        },
      )

      if (rpcError) throw rpcError

      return data as string // retorna o ID do vínculo
    } catch (err: any) {
      console.error('Erro ao vincular paciente:', err)
      throw err
    }
  }

  async function verificarVinculo(
    pacienteId: string,
    estabelecimentoId: string,
  ) {
    try {
      const { data, error: queryError } = await supabase
        .from('paciente_estabelecimento')
        .select('*')
        .eq('paciente_id', pacienteId)
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
        .maybeSingle()

      if (queryError) throw queryError

      return data !== null
    } catch (err: any) {
      console.error('Erro ao verificar vínculo:', err)
      throw err
    }
  }

  async function buscarPacientes(termo: string, limite = 20) {
    try {
      if (!userContext.estabelecimentoAtual) {
        throw new Error('Nenhum estabelecimento selecionado')
      }

      let query = supabase
        .from('pacientes')
        .select(
          `
          *,
          paciente_estabelecimento!inner (
            estabelecimento_id
          )
        `,
        )
        .eq(
          'paciente_estabelecimento.estabelecimento_id',
          userContext.estabelecimentoAtual,
        )
        .order('nome_completo')
        .limit(limite)

      if (termo) {
        query = query.or(
          `nome_completo.ilike.%${termo}%,cpf.ilike.%${termo}%,telefone.ilike.%${termo}%,celular.ilike.%${termo}%`,
        )
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      return data || []
    } catch (err: any) {
      console.error('Erro ao buscar pacientes:', err)
      throw err
    }
  }

  function limpar() {
    pacientes.value = []
    pacienteSelecionado.value = null
    error.value = null
    termoBusca.value = ''
  }

  return {
    // Estados
    pacientes,
    pacienteSelecionado,
    loading,
    error,
    termoBusca,
    // Computeds
    pacientesFiltrados,
    // Actions
    carregarPacientes,
    carregarPaciente,
    buscarPorDocumento,
    buscarOuCriarPaciente,
    criarPaciente,
    atualizarPaciente,
    vincularAoEstabelecimento,
    verificarVinculo,
    buscarPacientes,
    limpar,
  }
})