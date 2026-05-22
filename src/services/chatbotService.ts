import { api, isApiOnline } from './api';

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
    action: 'redirect_schedule' | 'add_calendar_reminder' | 'show_ecoponto_location';
  };
}

export const chatbotService = {
  async sendMessage(message: string, sessaoId: string = 'session_1'): Promise<ChatbotResponse> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.post('/chatbot/message', {
          message,
          sessao_id: sessaoId
        });
        return response.data;
      } catch (err) {
        console.error('Erro na API do chatbot, usando mock fallback:', err);
      }
    }

    // Fallback Mock Inteligente com as dúvidas solicitadas
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simula latência natural da IA
    const msg_l = message.toLowerCase();
    
    let responseText = `Olá! Sou o GreenBin Helper, seu assistente ecológico. Baseado nas regras do condomínio: restos de alimento e guardanapos usados devem ser descartados no Lixo Orgânico (coletas segundas e quintas às 07:00). Plásticos, metais e papéis secos vão na Coleta Seletiva (terças às 08:00). Posso ajudar com mais alguma dúvida sobre descarte?`;
    let suggested_reminder = false;
    let reminder_details: any = null;

    if (msg_l.includes('isopor')) {
      responseText = `Olá! Sim, o **isopor é 100% reciclável**! De acordo com as nossas regras, você deve descartá-lo limpo e sem resíduos de alimentos diretamente no contêiner azul de **Recicláveis** no subsolo. Caso o isopor esteja engordurado ou sujo de molhos (como caixas de pizza), descarte-o no lixo de rejeitos (lixo comum) para não inviabilizar a reciclagem dos demais itens.`;
    } else if (msg_l.includes('vidro')) {
      responseText = `O descarte de vidro deve ser feito **exclusivamente no Ecoponto de Vidro do térreo**, perto da garagem B. A coleta de vidros ocorre quinzenalmente nas sextas-feiras às 09:00. 
      ⚠️ **Dica de Segurança**: Copos e potes quebrados devem ser embalados em jornal ou dentro de uma garrafa PET cortada para proteger os nossos zeladores!`;
      suggested_reminder = true;
      reminder_details = {
        tipo: 'vidro',
        mensagem: 'Gostaria de criar um lembrete para a coleta quinzenal de vidros nas sextas-feiras?',
        action: 'add_calendar_reminder'
      };
    } else if (msg_l.includes('eletrônico') || msg_l.includes('pilha') || msg_l.includes('bateria')) {
      responseText = `Olá! Pilhas, baterias e pequenos aparelhos eletrônicos (cabos, carregadores, celulares antigos) devem ser descartados no **Coletor Ecológico no hall de entrada principal** (ao lado da portaria). Eles possuem metais pesados perigosos e nunca devem ir para o lixo comum. 
      Para eletrônicos grandes (como TVs, monitores e geladeiras), por favor, agende uma **Coleta de Volumosos** no app!`;
      suggested_reminder = true;
      reminder_details = {
        tipo: 'volumoso',
        mensagem: 'Deseja ir para a tela de agendamento de volumosos para descartar um eletrônico de grande porte?',
        action: 'redirect_schedule'
      };
    } else if (msg_l.includes('lâmpada')) {
      responseText = `Amélia, o descarte de lâmpadas deve ser no **ecoponto do térreo**, ao lado da zeladoria, nunca no lixo comum devido ao mercúrio perigoso. Quer que eu marque um lembrete para você levar até lá mais tarde?`;
      suggested_reminder = true;
      reminder_details = {
        tipo: 'oleo',
        mensagem: 'Quer que eu crie um lembrete no seu celular para descartar a lâmpada hoje à noite?',
        action: 'add_calendar_reminder'
      };
    } else if (msg_l.includes('óleo')) {
      responseText = `O descarte de óleo de cozinha usado nunca deve ser feito no ralo da pia! Armazene o óleo em uma garrafa PET transparente e bem fechada e deposite-a no tambor verde de óleo no **Ecoponto do térreo**.`;
    }

    return {
      response: responseText,
      suggested_reminder,
      reminder_details
    };
  },

  async getHistory(sessaoId: string = 'session_1'): Promise<ChatMessage[]> {
    const online = await isApiOnline();
    if (online) {
      try {
        const response = await api.get(`/chatbot/historico?sessao_id=${sessaoId}`);
        return response.data;
      } catch (err) {
        console.error('Erro ao pegar histórico do chatbot:', err);
      }
    }

    return [
      { id: '1', role: 'assistant', conteudo: 'Olá! Sou o GreenBin Helper. Estou treinado com todas as regras do condomínio e posso tirar suas dúvidas sobre descarte de lixo orgânico, reciclagem, vidro, isopor, eletrônicos e muito mais. Como posso te ajudar hoje?' }
    ];
  }
};
