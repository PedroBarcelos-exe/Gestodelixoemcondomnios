from { api, isApiOnline } from './api';

export interface ZeladorTask {
  id: string;
  descricao: string;
  completed: boolean;
  prioridade?: 'baixa' | 'media' | 'alta';
  categoria?: 'limpeza' | 'coleta' | 'manutencao' | 'outro';
}

export interface PickupRequest {
  id: string;
  apt: string;
  bloco?: string;
  item: string;
  requester: string;
  status: 'pending' | 'completed' | 'approved';
  date: string;
}

export const zeladorService = {
  async getStats(): Promise<{ tarefas_total: number; tarefas_concluidas: number; agendamentos_pendentes: number; alertas: number }> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.get('/zelador/stats');
        return {
          tarefas_total: response.data.tarefas_total,
          tarefas_concluidas: response.data.tarefas_concluidas,
          agendamentos_pendentes: response.data.agendamentos_pendentes,
          alertas: response.data.alertas
        };
      } catch (err) {
        console.error('Erro na API, usando mock:', err);
      }
    }
    
    // Fallback Mock
    return {
      tarefas_total: 4,
      tarefas_concluidas: 2,
      agendamentos_pendentes: 2,
      alertas: 0
    };
  },

  async getTasks(): Promise<ZeladorTask[]> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.get('/zelador/tarefas');
        return response.data.map((t: any) => ({
          id: t.id,
          descricao: t.descricao,
          completed: t.concluida,
          prioridade: t.prioridade,
          categoria: t.categoria
        }));
      } catch (err) {
        console.error('Erro na API, usando mock:', err);
      }
    }
    
    // Fallback Mock
    return [
      { id: '1', descricao: 'Organizar área de coleta seletiva', completed: true, prioridade: 'alta', categoria: 'coleta' },
      { id: '2', descricao: 'Verificar lixeiras do térreo', completed: true, prioridade: 'media', categoria: 'limpeza' },
      { id: '3', descricao: 'Preparar área para coleta de orgânicos', completed: false, prioridade: 'media', categoria: 'coleta' },
      { id: '4', descricao: 'Retirar sofá do apto 301', completed: false, prioridade: 'alta', categoria: 'coleta' },
    ];
  },

  async toggleTask(taskId: string, completed: boolean): Promise<void> {
    const online = await isApiOnline();
    if (online) {
      try {
        await api.put(`/zelador/tarefas/${taskId}`, { concluida: completed });
        return;
      } catch (err) {
        console.error('Erro na API ao atualizar tarefa:', err);
      }
    }
  },

  async getPickupRequests(): Promise<PickupRequest[]> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.get('/zelador/agendamentos');
        return response.data.map((r: any) => ({
          id: r.id,
          apt: r.profiles?.apartamento || 'S/N',
          bloco: r.profiles?.bloco || '',
          item: r.tipo_item,
          requester: r.profiles?.nome || 'Morador',
          status: r.status === 'pendente' ? 'pending' : r.status === 'aprovado' ? 'approved' : 'completed',
          date: r.data_preferencial
        }));
      } catch (err) {
        console.error('Erro na API, usando mock:', err);
      }
    }
    
    // Fallback Mock
    return [
      { id: '1', apt: '301', item: 'Sofá 3 lugares', status: 'pending', date: '2026-05-15', requester: 'João Silva' },
      { id: '2', apt: '205', item: 'Geladeira', status: 'pending', date: '2026-05-16', requester: 'Maria Santos' },
      { id: '3', apt: '102', item: 'Colchão', status: 'completed', date: '2026-05-13', requester: 'Pedro Costa' },
    ];
  },

  async completePickup(requestId: string): Promise<void> {
    const online = await isApiOnline();
    if (online) {
      try {
        await api.put(`/zelador/agendamentos/${requestId}/concluir`);
        return;
      } catch (err) {
        console.error('Erro na API ao concluir coleta:', err);
      }
    }
  }
};
