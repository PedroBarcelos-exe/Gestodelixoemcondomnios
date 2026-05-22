import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Leaf, User, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { chatbotService, ChatMessage } from '../../services/chatbotService';
import { toast } from 'sonner';

interface ChatbotWidgetProps {
  onRedirectTab?: (tab: string) => void;
}

export function ChatbotWidget({ onRedirectTab }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = [
    'Posso jogar isopor?',
    'Dia de coleta de vidro?',
    'Onde descarto eletrônico?',
    'Regra sobre lâmpadas?'
  ];

  // Carrega histórico inicial
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

  // Rola até a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Adiciona pergunta do usuário
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      conteudo: text
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await chatbotService.sendMessage(text);
      
      // Adiciona resposta do assistente
      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        conteudo: result.response
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      // Trata lembretes inteligentes sugeridos pela IA
      if (result.suggested_reminder && result.reminder_details) {
        const details = result.reminder_details;
        setTimeout(() => {
          toast(details.mensagem, {
            description: "Clique abaixo para realizar a ação correspondente:",
            action: {
              label: "Confirmar",
              onClick: () => {
                if (details.action === 'redirect_schedule' && onRedirectTab) {
                  onRedirectTab('schedule');
                  setIsOpen(false);
                } else {
                  toast.success("Lembrete inteligente agendado com sucesso!");
                }
              }
            },
            duration: 10000,
          });
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na comunicação com a IA");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Balão flutuante de abertura */}
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

      {/* Janela de Chat */}
      {isOpen && (
        <Card className="w-80 md:w-96 h-[500px] flex flex-col shadow-2xl border-green-200 overflow-hidden animate-in slide-in-from-bottom duration-300 bg-white/95 backdrop-blur-sm">
          {/* Header */}
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

          {/* Área de Mensagens */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    msg.role === 'user' ? 'bg-emerald-600' : 'bg-green-700'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Leaf className="w-3.5 h-3.5" />}
                </div>
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-green-50/70 border border-green-100 text-gray-800 rounded-tl-none font-medium'
                  }`}
                >
                  {msg.conteudo}
                </div>
              </div>
            ))}

            {/* Balão de digitando */}
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

          {/* Dúvidas Rápidas */}
          {messages.length <= 1 && !isTyping && (
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

          {/* Footer / Input */}
          <CardFooter className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
            <Input
              placeholder="Pergunte sobre regras de descarte..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputValue);
              }}
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
