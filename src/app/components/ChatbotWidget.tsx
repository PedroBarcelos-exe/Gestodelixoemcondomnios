import { Bot, Leaf, Send, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { chatbotService, ChatMessage } from '../../services/chatbotService';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

type ScheduleStep = 'idle' | 'asking_item' | 'asking_description' | 'asking_date';

interface ChatbotWidgetProps {
  onRedirectTab?: (tab: string) => void;
}

export function ChatbotWidget({ onRedirectTab }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<ScheduleStep>('idle');
  const [scheduleData, setScheduleData] = useState({ tipo_item: '', descricao: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = [
    'Posso jogar isopor?',
    'Dia de coleta de vidro?',
    'Onde descarto eletrônico?',
    'Quero agendar uma coleta'
  ];

  const INPUT_PLACEHOLDERS: Record<ScheduleStep, string> = {
    idle: 'Pergunte sobre regras de descarte...',
    asking_item: 'Ex: sofá, geladeira, cama...',
    asking_description: 'Descreva o item...',
    asking_date: 'Ex: 30/06/2026',
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await chatbotService.getHistory();
        setMessages(history);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      role: 'assistant',
      conteudo: text
    }]);
  };

  const botReply = (text: string, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(text);
    }, delay);
  };

  const handleScheduleConversation = async (text: string) => {
    const input = text.trim();

    if (/^(cancelar|cancel|não quero|nao quero|sair|parar|desistir)$/i.test(input)) {
      setScheduleStep('idle');
      setScheduleData({ tipo_item: '', descricao: '' });
      botReply('Tudo bem, agendamento cancelado! Se precisar de mais alguma coisa, é só falar.', 500);
      return;
    }

    if (scheduleStep === 'asking_item') {
      setScheduleData(prev => ({ ...prev, tipo_item: input }));
      setScheduleStep('asking_description');
      botReply(`Legal! Agora me dê uma breve descrição do item — tamanho, cor, estado ou qualquer detalhe que ajude o zelador a identificá-lo.`);

    } else if (scheduleStep === 'asking_description') {
      setScheduleData(prev => ({ ...prev, descricao: input }));
      setScheduleStep('asking_date');
      botReply('Perfeito! E qual a data preferida para a coleta? Me informe no formato DD/MM/AAAA — ex: 30/06/2026.');

    } else if (scheduleStep === 'asking_date') {
      const match = input.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      if (!match) {
        botReply('Hmm, não reconheci essa data. Por favor, use o formato DD/MM/AAAA — ex: 30/06/2026.', 600);
        return;
      }
      const [, day, month, year] = match;
      const fullYear = year.length === 2 ? `20${year}` : year;
      const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const { tipo_item, descricao } = scheduleData;

      setScheduleStep('idle');
      setScheduleData({ tipo_item: '', descricao: '' });
      setIsTyping(true);

      try {
        await chatbotService.schedulePickup(tipo_item, descricao || tipo_item, isoDate);
        const dataFormatada = new Date(`${isoDate}T12:00:00`).toLocaleDateString('pt-BR');
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(`Agendamento solicitado com sucesso! ✅ Sua coleta de "${tipo_item}" está registrada para ${dataFormatada} com status Pendente. O zelador irá analisar e confirmar a data em breve.`);
          toast.success('Coleta agendada com sucesso!');
        }, 1000);
      } catch {
        setIsTyping(false);
        addBotMessage('Ops, tive um problema ao registrar o agendamento. Pode tentar novamente?');
        toast.error('Erro ao criar agendamento.');
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      role: 'user',
      conteudo: text
    }]);
    setInputValue('');

    if (scheduleStep !== 'idle') {
      await handleScheduleConversation(text);
      return;
    }

    setIsTyping(true);
    try {
      const result = await chatbotService.sendMessage(text);

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'assistant',
        conteudo: result.response
      }]);

      if (result.suggested_reminder && result.reminder_details) {
        const { action, mensagem } = result.reminder_details;
        if (action === 'create_agendamento') {
          setTimeout(() => {
            addBotMessage('Qual item você precisa descartar? Pode ser sofá, geladeira, cama, armário, fogão ou outro item volumoso.');
            setScheduleStep('asking_item');
          }, 800);
        } else {
          setTimeout(() => {
            toast(mensagem, {
              description: 'Clique abaixo para realizar a ação correspondente:',
              action: {
                label: 'Confirmar',
                onClick: () => {
                  if (action === 'redirect_schedule' && onRedirectTab) {
                    onRedirectTab('schedule');
                    setIsOpen(false);
                  } else {
                    toast.success('Lembrete inteligente agendado com sucesso!');
                  }
                }
              },
              duration: 10000,
            });
          }, 1200);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro na comunicação com a IA');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-tr from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center relative group"
        >
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="absolute right-16 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md">
            Assistente Virtual GreenBin
          </span>
        </button>
      )}

      {isOpen && (
        <Card className="w-80 md:w-96 h-[500px] flex flex-col shadow-2xl border-green-200 overflow-hidden animate-in slide-in-from-bottom duration-300 bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-700 to-emerald-600 text-white p-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                <Bot className="w-5 h-5 text-green-100" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  GreenBin Helper
                  <Badge variant="outline" className="text-[10px] text-green-100 border-green-300/40">IA RAG</Badge>
                </CardTitle>
                <p className="text-[11px] text-green-100/90">Especialista nas regras do condomínio</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-green-700'}`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Leaf className="w-3.5 h-3.5" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-green-50/70 border border-green-100 text-gray-800 rounded-tl-none font-medium'
                }`}>
                  {msg.conteudo}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 max-w-[85%] mr-auto items-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-green-700 text-white">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-green-50/70 border border-green-100 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {messages.length <= 1 && !isTyping && scheduleStep === 'idle' && (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Dúvidas Frequentes</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] text-green-700 bg-green-50 hover:bg-green-100 border border-green-100 rounded-full px-2.5 py-1 text-left transition-colors font-medium cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <CardFooter className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
            <Input
              placeholder={INPUT_PLACEHOLDERS[scheduleStep]}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(inputValue); }}
              className="flex-1 bg-white border-green-200 focus-visible:ring-emerald-500 text-sm h-9"
            />
            <Button
              size="icon"
              onClick={() => handleSendMessage(inputValue)}
              className="bg-emerald-600 hover:bg-emerald-700 h-9 w-9 text-white rounded-full flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
