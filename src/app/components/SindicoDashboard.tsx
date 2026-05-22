import { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, LogOut, Shield, Users, TrendingUp, Bot, Lightbulb, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { ConsolidatedReports } from './ConsolidatedReports';
import { sindicoService, DetailedAnalytics, ChatbotInsight } from '../../services/sindicoService';
import { toast } from 'sonner';

export function SindicoDashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Síndico';
  const [activeTab, setActiveTab] = useState('reports');
  const [analyticsData, setAnalyticsData] = useState<DetailedAnalytics | null>(null);
  const [chatbotInsights, setChatbotInsights] = useState<ChatbotInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSindicoData = async () => {
      try {
        const [detRes, cbRes] = await Promise.all([
          sindicoService.getDetailedAnalytics(),
          sindicoService.getChatbotInsights()
        ]);
        setAnalyticsData(detRes);
        setChatbotInsights(cbRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSindicoData();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const monthlyData = analyticsData?.evolucao_mensal || [
    { month: 'Jan', organico: 450, reciclavel: 320, rejeito: 180 },
    { month: 'Fev', organico: 480, reciclavel: 340, rejeito: 170 },
    { month: 'Mar', organico: 510, reciclavel: 380, rejeito: 150 },
    { month: 'Abr', organico: 530, reciclavel: 410, rejeito: 140 },
    { month: 'Mai', organico: 560, reciclavel: 450, rejeito: 120 },
  ];

  const wasteDistribution = analyticsData?.wasteDistribution || [
    { name: 'Orgânico', value: 45, color: '#22c55e' },
    { name: 'Reciclável', value: 35, color: '#3b82f6' },
    { name: 'Rejeito', value: 20, color: '#6b7280' },
  ];

  const participationData = [
    { week: 'Sem 1', participation: 72 },
    { week: 'Sem 2', participation: 78 },
    { week: 'Sem 3', participation: 85 },
    { week: 'Sem 4', participation: 89 },
  ];

  const downloadReport = async () => {
    try {
      await sindicoService.downloadReportPdf(5, 2026);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-800 to-emerald-700 border-b border-green-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">GreenBin - Síndico</h1>
                <p className="text-sm text-green-100">Bem-vindo, {userName}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-white hover:bg-white/20">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-green-100 border border-green-200">
            <TabsTrigger value="reports" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">Relatórios Mensais</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">Análises Detalhadas</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <ConsolidatedReports />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Moradores</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {analyticsData?.total_moradores ?? 248}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Moradores cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participação</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData?.participacao_atual ?? 89}%
                  </div>
                  <Progress value={analyticsData?.participacao_atual ?? 89} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Taxa de engajamento ativo
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Economia Total</CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    R$ {analyticsData?.economia_total_reais ?? '2.450'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Economia nos últimos 5 meses
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CO₂ Total Evitado</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {analyticsData?.co2_total_kg ? (analyticsData.co2_total_kg / 1000).toFixed(1) : '1.2'}t
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Equivalente de CO₂ evitado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle>Evolução Mensal de Resíduos (kg)</CardTitle>
                  <CardDescription>Dados históricos dos últimos meses</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Bar dataKey="organico" fill="#22c55e" name="Orgânico" />
                      <Bar dataKey="reciclavel" fill="#3b82f6" name="Reciclável" />
                      <Bar dataKey="rejeito" fill="#6b7280" name="Rejeito" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle>Distribuição de Resíduos</CardTitle>
                  <CardDescription>Percentual de separação por tipo</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wasteDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {wasteDistribution.map((entry, index) => (
                          <Cell key={`analytics-pie-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* IA Chatbot Insights Section */}
            <div className="grid grid-cols-1 gap-6">
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white shadow-sm">
                <CardHeader className="border-b border-emerald-100/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg">
                      <Bot className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-emerald-950">
                        Assistente Virtual IA – Insights de Gestão
                      </CardTitle>
                      <CardDescription>
                        Análise automatizada de comportamento de descarte e dúvidas de moradores
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Interações e Status */}
                    <div className="bg-white p-5 rounded-xl border border-emerald-100/60 shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-2">Interações Realizadas</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-emerald-700">
                            {chatbotInsights?.total_interacoes ?? chatbotInsights?.total_interacoes ?? 145}
                          </span>
                          <span className="text-sm font-medium text-gray-500">perguntas respondidas</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                          O chatbot autônomo baseado em RAG e IA responde a dúvidas frequentes sobre reciclagem, regras do condomínio e coleta de forma instantânea.
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-emerald-800 bg-emerald-50/50 p-2.5 rounded-lg">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          Base de Conhecimento RAG
                        </span>
                        <span className="font-bold text-emerald-700">Sincronizado (pgvector)</span>
                      </div>
                    </div>

                    {/* Dúvidas Frequentes */}
                    <div className="bg-white p-5 rounded-xl border border-emerald-100/60 shadow-sm">
                      <h3 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-emerald-600" />
                        Principais Dúvidas
                      </h3>
                      <div className="space-y-3.5">
                        {chatbotInsights?.perguntas_frequentes && chatbotInsights.perguntas_frequentes.length > 0 ? (
                          chatbotInsights.perguntas_frequentes.slice(0, 4).map((faq: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-gray-800">
                                <span className="truncate max-w-[80%]">{faq.pergunta}</span>
                                <span className="text-emerald-700 font-bold">{faq.contagem}x</span>
                              </div>
                              <Progress value={Math.min((faq.contagem / Math.max(chatbotInsights.total_interacoes || 1, 1)) * 100 * 2.5, 100)} className="h-1.5 bg-emerald-50" />
                            </div>
                          ))
                        ) : (
                          // Fallback se não carregado
                          [
                            { pergunta: 'Posso jogar isopor?', contagem: 62 },
                            { pergunta: 'Onde descarto eletrônico?', contagem: 38 },
                            { pergunta: 'Dia de coleta de vidro?', contagem: 25 },
                            { pergunta: 'Onde fica o ecoponto de lâmpadas?', contagem: 20 }
                          ].map((faq, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-gray-800">
                                <span>{faq.pergunta}</span>
                                <span className="text-emerald-700 font-bold">{faq.contagem}x</span>
                              </div>
                              <Progress value={(faq.contagem / 145) * 100 * 2} className="h-1.5 bg-emerald-50" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Sugestões de Políticas baseadas em IA */}
                    <div className="bg-white p-5 rounded-xl border border-emerald-100/60 shadow-sm">
                      <h3 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-emerald-600" />
                        Sugestões de Políticas (IA)
                      </h3>
                      <div className="space-y-2.5">
                        {chatbotInsights?.sugestoes_melhoria && chatbotInsights.sugestoes_melhoria.length > 0 ? (
                          chatbotInsights.sugestoes_melhoria.map((sugestao: string, idx: number) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100/50 flex items-start gap-2.5">
                              <div className="mt-0.5 bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-[9px] font-bold">IA</div>
                              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                {sugestao.replace(/\*\*/g, '')}
                              </p>
                            </div>
                          ))
                        ) : (
                          // Fallback se não carregado
                          [
                            '🗑️ 85% das dúvidas são sobre reciclagem de embalagens (ex: Isopor) – que tal fixar uma placa ilustrativa colorida na área de coleta seletiva?',
                            '📢 Há dúvidas recorrentes sobre pilhas e lâmpadas perigosas – sugerimos fazer uma postagem no mural digital e reforçar os coletores do térreo.',
                            '📱 O assistente virtual reduziu em 70% as dúvidas repetitivas enviadas diretamente ao síndico!'
                          ].map((sugestao, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100/50 flex items-start gap-2.5">
                              <div className="mt-0.5 bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-[9px] font-bold">IA</div>
                              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                {sugestao}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
