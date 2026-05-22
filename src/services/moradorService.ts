import { api, isApiOnline } from './api';

export interface DashboardData {
  nome: string;
  apartamento?: string;
  meta_mensal_pct: number;
  descartes_corretos: number;
  total_descartes: number;
  agendamentos_pendentes: number;
  proxima_coleta?: {
    id: string;
    tipo: string;
    data: string;
    horario: string;
    descricao?: string;
  };
}

export interface PickupSchedule {
  id: string;
  tipo_item: string;
  descricao: string;
  data_preferencial: string;
  data_agendada?: string;
  status: 'pendente' | 'aprovado' | 'concluido' | 'cancelado';
  observacao_zelador?: string;
  created_at?: string;
}

export interface ImpactData {
  total_kg_descartados: number;
  co2_evitado_kg: number;
  arvores_equivalentes: number;
  por_tipo: Record<string, number>;
  total_registros: number;
}

export const moradorService = {
  async getDashboard(): Promise<DashboardData> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.get('/moradores/dashboard');
        return response.data;
      } catch (err) {
        console.error('Erro na API, usando mock:', err);
      }
    }
    
    // Fallback Mock
    return {
      nome: localStorage.getItem('userName') || 'Morador Demo',
      apartamento: '301',
      meta_mensal_pct: 87,
      descartes_corretos: 26,
      total_descartes: 30,
      agendamentos_pendentes: 2,
      proxima_coleta: {
        id: '1',
        tipo: 'organico',
        data: new Date(Date.now() + 86400000).toISOString().split('T')[0], // amanhã
        horario: '07:00',
        descricao: 'Coleta de resíduos orgânicos'
      }
    };
  },

  async getAgendamentos(): Promise<PickupSchedule[]> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.get('/moradores/agendamentos');
        // Converter chaves de snake_case do Python para camelCase se necessário
        return response.data.map((item: any) => ({
          id: item.id,
          tipo_item: item.tipo_item,
          descricao: item.descricao,
          data_preferencial: item.data_preferencial,
          data_agendada: item.data_agendada,
          status: item.status,
          observacao_zelador: item.observacao_zelador,
          created_at: item.created_at
        }));
      } catch (err) {
        console.error('Erro na API, usando mock:', err);
      }
    }
    
    // Fallback Mock
    return [
      {
        id: '1',
        tipo_item: 'Mesa de jantar',
        descricao: 'Mesa de madeira 6 lugares',
        data_preferencial: '2026-05-20',
        status: 'pendente'
      },
      {
        id: '2',
        tipo_item: 'Colchão',
        descricao: 'Colchão de solteiro',
        data_preferencial: '2026-05-18',
        status: 'aprovado',
        observacao_zelador: 'Será coletado na quarta de manhã.'
      }
    ];
  },

  async criarAgendamento(tipo_item: string, descricao: string, data_preferencial: string): Promise<PickupSchedule> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.post('/moradores/agendamentos', {
          tipo_item,
          descricao,
          data_preferencial
        });
        return response.data;
      } catch (err) {
        console.error('Erro na API ao criar agendamento:', err);
      }
    }
    
    // Fallback Mock
    return {
      id: Math.random().toString(),
      tipo_item,
      descricao,
      data_preferencial,
      status: 'pendente'
    };
  },

  async getImpacto(): Promise<ImpactData> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.get('/moradores/impacto');
        return response.data;
      } catch (err) {
        console.error('Erro na API, usando mock:', err);
      }
    }
    
    // Fallback Mock
    return {
      total_kg_descartados: 42.5,
      co2_evitado_kg: 21.25,
      arvores_equivalentes: 1.01,
      por_tipo: {
        'organico': 25.0,
        'reciclavel': 12.5,
        'rejeito': 5.0
      },
      total_registros: 30
    };
  }
};
