import { useState } from 'react';
import { BarChart3, Download, FileText, LogOut, Shield, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { ConsolidatedReports } from './ConsolidatedReports';

export function SindicoDashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Síndico';
  const [activeTab, setActiveTab] = useState('reports');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const monthlyData = [
    { id: 'jan', month: 'Jan', organico: 450, reciclavel: 320, rejeito: 180 },
    { id: 'fev', month: 'Fev', organico: 480, reciclavel: 340, rejeito: 170 },
    { id: 'mar', month: 'Mar', organico: 510, reciclavel: 380, rejeito: 150 },
    { id: 'abr', month: 'Abr', organico: 530, reciclavel: 410, rejeito: 140 },
    { id: 'mai', month: 'Mai', organico: 560, reciclavel: 450, rejeito: 120 },
  ];

  const wasteDistribution = [
    { id: 'organico', name: 'Orgânico', value: 45, color: '#22c55e' },
    { id: 'reciclavel', name: 'Reciclável', value: 35, color: '#3b82f6' },
    { id: 'rejeito', name: 'Rejeito', value: 20, color: '#6b7280' },
  ];

  const participationData = [
    { id: 'week1', week: 'Sem 1', participation: 72 },
    { id: 'week2', week: 'Sem 2', participation: 78 },
    { id: 'week3', week: 'Sem 3', participation: 85 },
    { id: 'week4', week: 'Sem 4', participation: 89 },
  ];

  const downloadReport = () => {
    alert('Relatório mensal gerado com sucesso! Em um ambiente real, o PDF seria baixado automaticamente.');
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Moradores</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">248</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    86 apartamentos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participação</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">89%</div>
                  <Progress value={89} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    +12% vs mês anterior
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Economia Mensal</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 2.450</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Redução de taxas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CO₂ Evitado</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">1.2t</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Neste mês
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Mensal de Resíduos (kg)</CardTitle>
                  <CardDescription>Últimos 5 meses</CardDescription>
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

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Resíduos</CardTitle>
                  <CardDescription>Maio 2026</CardDescription>
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
                        {wasteDistribution.map((entry) => (
                          <Cell key={`analytics-pie-${entry.id}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Moradores</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">248</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    86 apartamentos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participação</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">89%</div>
                  <Progress value={89} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    +12% vs mês anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Economia Mensal</CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">R$ 2.450</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Redução de taxas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CO₂ Evitado</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">1.2t</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Neste mês
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle>Evolução Mensal de Resíduos (kg)</CardTitle>
                  <CardDescription>Últimos 5 meses</CardDescription>
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
                  <CardDescription>Maio 2026</CardDescription>
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
                        {wasteDistribution.map((entry) => (
                          <Cell key={`analytics-pie-${entry.id}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="old-analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Participação Semanal</CardTitle>
                <CardDescription>
                  Percentual de moradores que utilizaram o sistema corretamente
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={participationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="participation"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Participação (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho por Torre</CardTitle>
                  <CardDescription>Comparativo de separação correta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { tower: 'Torre A', score: 92, color: 'bg-green-500' },
                      { tower: 'Torre B', score: 88, color: 'bg-green-500' },
                      { tower: 'Torre C', score: 85, color: 'bg-yellow-500' },
                      { tower: 'Torre D', score: 78, color: 'bg-orange-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.tower}</span>
                          <span className="text-sm font-bold">{item.score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas e Observações</CardTitle>
                  <CardDescription>Itens que requerem atenção</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600">Positivo</Badge>
                        <span className="text-sm">Meta de reciclagem atingida</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600">Info</Badge>
                        <span className="text-sm">Nova campanha educativa disponível</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-600">Atenção</Badge>
                        <span className="text-sm">Torre D abaixo da meta (78%)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="old-reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Disponíveis</CardTitle>
                <CardDescription>
                  Gere e baixe relatórios para assembleias e prestação de contas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <h3 className="font-medium">Relatório Mensal Completo</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Estatísticas, gráficos e análise completa do mês atual
                      </p>
                    </div>
                    <Button onClick={downloadReport} className="bg-purple-600 hover:bg-purple-700">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-green-600" />
                        <h3 className="font-medium">Certificado de Sustentabilidade</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Documento com impacto ambiental e conquistas do condomínio
                      </p>
                    </div>
                    <Button onClick={downloadReport} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium">Relatório de Economia</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Análise financeira da redução de taxas e custos operacionais
                      </p>
                    </div>
                    <Button onClick={downloadReport} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados para Assembleia</CardTitle>
                <CardDescription>
                  Principais conquistas para apresentação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <p className="text-sm text-green-800 mb-1">Redução de Rejeitos</p>
                    <p className="text-3xl font-bold text-green-600">-33%</p>
                    <p className="text-xs text-green-700 mt-1">vs ano anterior</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                    <p className="text-sm text-blue-800 mb-1">Aumento Reciclagem</p>
                    <p className="text-3xl font-bold text-blue-600">+45%</p>
                    <p className="text-xs text-blue-700 mt-1">vs ano anterior</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                    <p className="text-sm text-purple-800 mb-1">Economia Total</p>
                    <p className="text-3xl font-bold text-purple-600">R$ 12.8k</p>
                    <p className="text-xs text-purple-700 mt-1">Últimos 6 meses</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                    <p className="text-sm text-emerald-800 mb-1">Engajamento</p>
                    <p className="text-3xl font-bold text-emerald-600">89%</p>
                    <p className="text-xs text-emerald-700 mt-1">Moradores ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
