import { Download, TrendingDown, DollarSign, Leaf, Users, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ChartContainer } from './ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';

export function ConsolidatedReports() {
  const monthlyData = [
    { id: 'jan', month: 'Jan', organico: 450, reciclavel: 320, rejeito: 180 },
    { id: 'fev', month: 'Fev', organico: 480, reciclavel: 340, rejeito: 170 },
    { id: 'mar', month: 'Mar', organico: 510, reciclavel: 380, rejeito: 150 },
    { id: 'abr', month: 'Abr', organico: 530, reciclavel: 410, rejeito: 140 },
    { id: 'mai', month: 'Mai', organico: 560, reciclavel: 450, rejeito: 120 },
  ];

  const participationData = [
    { id: 'week1', week: 'Sem 1', taxa: 72 },
    { id: 'week2', week: 'Sem 2', taxa: 78 },
    { id: 'week3', week: 'Sem 3', taxa: 85 },
    { id: 'week4', week: 'Sem 4', taxa: 89 },
  ];

  const wasteDistribution = [
    { id: 'organico', name: 'Orgânico', value: 45, color: '#22c55e' },
    { id: 'reciclavel', name: 'Reciclável', value: 35, color: '#3b82f6' },
    { id: 'rejeito', name: 'Rejeito', value: 20, color: '#6b7280' },
  ];

  const topMoradores = [
    { name: 'João Silva', apt: '301', score: 98, descartes: 124 },
    { name: 'Maria Santos', apt: '205', score: 96, descartes: 118 },
    { name: 'Pedro Costa', apt: '102', score: 94, descartes: 115 },
    { name: 'Ana Paula', apt: '407', score: 92, descartes: 112 },
    { name: 'Carlos Mendes', apt: '508', score: 90, descartes: 108 },
  ];

  const downloadReport = () => {
    alert('Relatório completo sendo gerado em PDF...');
  };

  return (
    <div className="space-y-6">
      {/* Relatório de Economia */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="w-7 h-7 text-green-700" />
                Relatório de Economia Mensal
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Análise financeira - Maio 2026
              </CardDescription>
            </div>
            <Button onClick={downloadReport} className="bg-green-700 hover:bg-green-800">
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-green-100">
              <div className="text-sm text-gray-600 mb-2">Custo Mensal Anterior</div>
              <div className="text-3xl font-bold text-red-600 mb-1">R$ 4.850,00</div>
              <div className="text-xs text-gray-500">Taxa de coleta padrão</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
              <div className="text-sm text-gray-600 mb-2">Investimento GreenBin</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">R$ 950,00</div>
              <div className="text-xs text-gray-500">Mensalidade do software</div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-green-100 mb-2">Economia Líquida</div>
              <div className="text-3xl font-bold text-white mb-1">R$ 2.450,00</div>
              <div className="text-xs text-green-200">↓ 50.5% vs custo anterior</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h4 className="font-semibold text-lg mb-4 text-gray-900">Como economizamos</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Redução de Rejeitos</div>
                    <div className="text-sm text-gray-600">33% menos volume de lixo comum</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-700">-R$ 1.600</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Otimização de Coletas</div>
                    <div className="text-sm text-gray-600">Agendamento inteligente de volumosos</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-700">-R$ 850</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Aumento de Reciclagem</div>
                    <div className="text-sm text-gray-600">45% mais materiais reciclados</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-purple-700">-R$ 950</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatório de Participação dos Moradores */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="w-7 h-7 text-blue-700" />
                Relatório de Participação dos Moradores
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Engajamento e desempenho individual - Maio 2026
              </CardDescription>
            </div>
            <Button onClick={downloadReport} className="bg-blue-700 hover:bg-blue-800">
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-600 mb-2">Total de Moradores</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">248</div>
              <div className="text-sm text-gray-500">86 apartamentos</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-600 mb-2">Taxa de Engajamento</div>
              <div className="text-4xl font-bold text-blue-600 mb-1">89%</div>
              <Progress value={89} className="mt-2" />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-600 mb-2">Descartes Corretos</div>
              <div className="text-4xl font-bold text-green-600 mb-1">2.184</div>
              <div className="text-sm text-green-600">+12% vs mês anterior</div>
            </div>
          </div>

          {/* Evolução Semanal */}
          <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            <h4 className="font-semibold text-lg mb-4">Evolução Semanal de Participação</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={participationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="taxa"
                    stroke="#2563eb"
                    strokeWidth={3}
                    name="Taxa de Participação (%)"
                    dot={{ fill: '#2563eb', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Moradores */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h4 className="font-semibold text-lg mb-4">Top 5 Moradores do Mês</h4>
            <div className="space-y-3">
              {topMoradores.map((morador, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {idx + 1}º
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{morador.name}</div>
                      <div className="text-sm text-gray-600">Apto {morador.apt}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-700">{morador.score}</div>
                    <div className="text-xs text-gray-600">{morador.descartes} descartes</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatório de Impacto Ambiental */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Leaf className="w-7 h-7 text-emerald-700" />
                Relatório de Impacto Ambiental
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Benefícios sustentáveis alcançados - Maio 2026
              </CardDescription>
            </div>
            <Button onClick={downloadReport} className="bg-emerald-700 hover:bg-emerald-800">
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <Leaf className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-700 mb-1">1.2t</div>
              <div className="text-sm text-gray-600">CO₂ Evitado</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <TrendingDown className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-700 mb-1">-33%</div>
              <div className="text-sm text-gray-600">Rejeitos Reduzidos</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <Package className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-700 mb-1">+45%</div>
              <div className="text-sm text-gray-600">Reciclagem</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <Users className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-orange-700 mb-1">89%</div>
              <div className="text-sm text-gray-600">Participação Ativa</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-semibold text-lg mb-4">Evolução Mensal (kg)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="organico" fill="#22c55e" name="Orgânico" />
                    <Bar dataKey="reciclavel" fill="#3b82f6" name="Reciclável" />
                    <Bar dataKey="rejeito" fill="#6b7280" name="Rejeito" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-semibold text-lg mb-4">Distribuição Atual</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wasteDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {wasteDistribution.map((entry) => (
                        <Cell key={`impact-pie-${entry.id}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
