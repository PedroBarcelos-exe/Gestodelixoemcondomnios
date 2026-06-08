import { api } from './api';
import { moradorService, PickupSchedule } from './moradorService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  conteudo: string;
  created_at?: string;
}

export interface ChatbotResponse {
  response: string;
  suggested_reminder: boolean;
  reminder_details?: {
    tipo: 'volumoso' | 'vidro' | 'oleo';
    mensagem: string;
    action: 'redirect_schedule' | 'add_calendar_reminder' | 'show_ecoponto_location' | 'create_agendamento';
  };
}

export const chatbotService = {
  async sendMessage(message: string, sessaoId: string = 'session_1'): Promise<ChatbotResponse> {
    const response = await api.post('/chatbot/message', {
      message,
      sessao_id: sessaoId
    });
    return response.data;
  },

  async getHistory(sessaoId: string = 'session_1'): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/chatbot/historico?sessao_id=${sessaoId}`);
      return response.data;
    } catch {
      return [
        { id: '1', role: 'assistant', conteudo: 'Olá! Sou o GreenBin Helper. Estou treinado com todas as regras do condomínio e posso tirar suas dúvidas sobre descarte de resíduos. Como posso te ajudar?' }
      ];
    }
  },

  async schedulePickup(tipo_item: string, descricao: string, data_preferencial: string): Promise<PickupSchedule> {
    return moradorService.criarAgendamento(tipo_item, descricao, data_preferencial);
  }
};
