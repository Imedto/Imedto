import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'

export const useNotificacoesStore = defineStore('notificacoes', () => {
  const solicitacoesPendentes = ref<any[]>([])
  
  async function carregarSolicitacoes() {
    const { data } = await supabase
      .from('solicitacao_vinculo')
      .select(`
        *,
        estabelecimentos(nome),
        profissoes(nome),
        especialidades(nome)
      `)
      .eq('status', 'pendente')
    
    solicitacoesPendentes.value = data || []
  }
  
  async function aceitarSolicitacao(solicitacaoId: string) {
    // Lógica para aceitar
  }
  
  return {
    solicitacoesPendentes,
    carregarSolicitacoes,
    aceitarSolicitacao,
  }
})