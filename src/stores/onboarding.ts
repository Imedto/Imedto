import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'
import router from '@/router'

export const useOnboardingStore = defineStore('onboarding', () => {
  const authStore = useAuthStore()

  // Estados
  const step = ref(1)
  const tipoCadastro = ref<'profissional' | 'estabelecimento' | null>(null)
  const tipoPessoa = ref<'fisica' | 'juridica'>('fisica')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const dadosPessoais = ref({
    nomeCompleto: '',
    cpf: '',
    profissaoId: null as string | null,
  })

  const dadosEstabelecimento = ref({
    nome: '',
    cnpj: '',
  })

  // Actions
  function nextStep() {
    if (step.value < 3) {
      step.value++
    }
  }

  function previousStep() {
    if (step.value > 1) {
      step.value--
    }
  }

  function setTipoCadastro(tipo: 'profissional' | 'estabelecimento') {
    tipoCadastro.value = tipo
    nextStep()
  }

  function resetError() {
    error.value = null
  }

  async function salvarDadosPessoais() {
    try {
      loading.value = true
      error.value = null

      const userId = authStore.currentUser?.user?.id
      if (!userId) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar se já existe um profissional para este user_id
      const { data: profissionalExistente, error: errorBusca } = await supabase
        .from('profissionais')
        .select('id, onboarding_completo')
        .eq('user_id', userId)
        .maybeSingle()

      if (errorBusca) {
        console.error('Erro ao buscar profissional:', errorBusca)
        throw errorBusca
      }

      let profissionalId: string

      if (profissionalExistente) {
        // Se já existe, atualiza
        console.log('Profissional já existe, atualizando...')
        
        const { data: profissionalAtualizado, error: errorUpdate } = await supabase
          .from('profissionais')
          .update({
            nome_completo: dadosPessoais.value.nomeCompleto,
            cpf: dadosPessoais.value.cpf,
            profissao_id: dadosPessoais.value.profissaoId,
          })
          .eq('user_id', userId)
          .select()
          .single()

        if (errorUpdate) throw errorUpdate
        profissionalId = profissionalAtualizado.id
      } else {
        // Se não existe, insere
        console.log('Criando novo profissional...')
        
        const { data: novoProfissional, error: errorInsert } = await supabase
          .from('profissionais')
          .insert({
            user_id: userId,
            nome_completo: dadosPessoais.value.nomeCompleto,
            cpf: dadosPessoais.value.cpf,
            profissao_id: dadosPessoais.value.profissaoId,
            onboarding_completo: false,
          })
          .select()
          .single()

        if (errorInsert) throw errorInsert
        profissionalId = novoProfissional.id
      }

      // Se escolheu apenas profissional, marca como completo
      if (tipoCadastro.value === 'profissional') {
        await marcarOnboardingCompleto()
        router.push('/')
      } else {
        // Se vai criar estabelecimento, vai para próximo passo
        nextStep()
      }

      return profissionalId
    } catch (err: any) {
      console.error('Erro ao salvar dados pessoais:', err)
      error.value = err.message || 'Erro ao salvar dados pessoais'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function criarEstabelecimento() {
    try {
      loading.value = true
      error.value = null

      const userId = authStore.currentUser?.user?.id
      if (!userId) {
        throw new Error('Usuário não autenticado')
      }

      console.log('Iniciando criação do estabelecimento...')

      // 1. Buscar ID do profissional
      const { data: profissional, error: errorProfissional } = await supabase
        .from('profissionais')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (errorProfissional || !profissional) {
        console.error('Erro ao buscar profissional:', errorProfissional)
        throw new Error('Profissional não encontrado. Complete o passo anterior.')
      }

      console.log('Profissional encontrado:', profissional.id)

      // 2. Criar estabelecimento
      console.log('Criando estabelecimento...')
      const { data: estabelecimento, error: estabError } = await supabase
        .from('estabelecimentos')
        .insert({
          nome: dadosEstabelecimento.value.nome,
          cnpj: dadosEstabelecimento.value.cnpj || null,
        })
        .select()
        .single()

      if (estabError) {
        console.error('Erro ao criar estabelecimento:', estabError)
        throw estabError
      }

      console.log('Estabelecimento criado:', estabelecimento.id)

      // 3. Criar vínculo como admin
      console.log('Criando vínculo como admin...')
      const { error: vinculoError } = await supabase
        .from('vinculo_profissional_estabelecimento')
        .insert({
          profissional_id: profissional.id,
          estabelecimento_id: estabelecimento.id,
          is_admin: true,
          ativo: true,
        })

      if (vinculoError) {
        console.error('Erro ao criar vínculo:', vinculoError)
        throw vinculoError
      }

      console.log('Vínculo criado com sucesso!')

      // 4. Marcar onboarding como completo
      await marcarOnboardingCompleto()

      // 5. Redirecionar para home
      router.push('/')

      return estabelecimento
    } catch (err: any) {
      console.error('Erro ao criar estabelecimento:', err)
      error.value = err.message || 'Erro ao criar estabelecimento'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function marcarOnboardingCompleto() {
    const userId = authStore.currentUser?.user?.id
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    console.log('Marcando onboarding como completo...')

    const { error } = await supabase
      .from('profissionais')
      .update({ onboarding_completo: true })
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao marcar onboarding completo:', error)
      throw error
    }

    console.log('Onboarding marcado como completo!')
  }

  function limparDados() {
    step.value = 1
    tipoCadastro.value = null
    tipoPessoa.value = 'fisica'
    dadosPessoais.value = {
      nomeCompleto: '',
      cpf: '',
      profissaoId: null,
    }
    dadosEstabelecimento.value = {
      nome: '',
      cnpj: '',
    }
    error.value = null
  }

  return {
    step,
    tipoCadastro,
    tipoPessoa,
    dadosPessoais,
    dadosEstabelecimento,
    loading,
    error,
    nextStep,
    previousStep,
    setTipoCadastro,
    resetError,
    salvarDadosPessoais,
    criarEstabelecimento,
    limparDados,
  }
})