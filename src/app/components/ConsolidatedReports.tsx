import { Calendar, DollarSign, Download, Leaf, Package, RefreshCw, TrendingDown, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { DetailedAnalytics, MonthlyReportData, TopMorador, sindicoService } from '../../services/sindicoService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const INVESTIMENTO_GREENBIN = 950;

export function ConsolidatedReports() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);
  const [topMoradores, setTopMoradores] = useState<TopMorador[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [r, a, top] = await Promise.all([
          sindicoService.getReport(mes, ano),
          sindicoService.getDetailedAnalytics(),
          sindicoService.getTopMoradores(mes, ano),
        ]);
        setReport(r);
        setAnalytics(a);
        setTopMoradores(top);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar relatórios');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mes, ano]);

const economiaLiquida = report?.economia_reais ?? 0;
  const custoAnterior = economiaLiquida + INVESTIMENTO_GREENBIN;
  const percentualReducao = custoAnterior > 0 ? ((economiaLiquida / custoAnterior) * 100).toFixed(1) : '0';
  const ecoReciclavel = Math.round((report?.total_reciclavel_kg ?? 0) * 0.8);
  const ecoOrganico = Math.round((report?.total_organico_kg ?? 0) * 0.3);

  const totalKg = (report?.total_organico_kg ?? 0) + (report?.total_reciclavel_kg ?? 0) + (report?.total_rejeito_kg ?? 0);
  const pctReciclavel = totalKg > 0 ? Math.round((report?.total_reciclavel_kg ?? 0) / totalKg * 100) : 0;
  const pctRejeito = totalKg > 0 ? Math.round((report?.total_rejeito_kg ?? 0) / totalKg * 100) : 0;
  const co2Tons = ((report?.co2_evitado_kg ?? 0) / 1000).toFixed(2);

  const chartData = analytics?.evolucao_mensal ?? [];
  const wasteData = analytics?.wasteDistribution ?? [];
  const participationChartData = analytics?.participationData?.map(d => ({ week: d.week, taxa: d.participation })) ?? [];

  const nomeMes = MESES_NOME[mes - 1] ?? '';

  const handleDownloadPdfTipo = async (tipo: 'financeiro' | 'ambiental' | 'participacao') => {
    setPdfLoading(true);
    try {
      await sindicoService.downloadReportPdf(mes, ano, tipo);
    } catch {
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setPdfLoading(false);
    }
  };

  const PdfButton = ({ className, tipo }: { className: string; tipo: 'financeiro' | 'ambiental' | 'participacao' }) => (
    <Button onClick={() => handleDownloadPdfTipo(tipo)} disabled={pdfLoading} className={className}>
      {pdfLoading
        ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
        : <><Download className="w-4 h-4 mr-2" />Baixar PDF</>
      }
    </Button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-green-700">
        <RefreshCw className="w-8 h-8 animate-spin mr-3" />
        <span className="text-sm font-medium">Carregando relatórios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de período */}
      <div className="flex items-center gap-4 flex-wrap bg-white rounded-xl border border-green-100 px-5 py-3 shadow-sm">
        <Calendar className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-gray-600">Período:</span>
        <select
          value={mes}
          onChange={e => setMes(Number(e.target.value))}
          className="border border-green-200 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {MESES_NOME.map((nome, idx) => (
            <option key={idx + 1} value={idx + 1}>{nome}</option>
          ))}
        </select>
        <select
          value={ano}
          onChange={e => setAno(Number(e.target.value))}
          className="border border-green-200 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {[hoje.getFullYear(), hoje.getFullYear() - 1].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

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
                Análise financeira — {nomeMes} de {ano}
              </CardDescription>
            </div>
            <PdfButton tipo="financeiro" className="bg-green-700 hover:bg-green-800" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-green-100">
              <div className="text-sm text-gray-600 mb-2">Custo Estimado Sem GreenBin</div>
              <div className="text-3xl font-bold text-red-600 mb-1">
                R$ {custoAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-500">Referência comparativa do mês</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
              <div className="text-sm text-gray-600 mb-2">Investimento GreenBin</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">R$ 950,00</div>
              <div className="text-xs text-gray-500">Mensalidade do software</div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-green-100 mb-2">Economia Líquida</div>
              <div className="text-3xl font-bold text-white mb-1">
                R$ {economiaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-green-200">↓ {percentualReducao}% vs referência</div>
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
                    <div className="text-sm text-gray-600">{report?.total_organico_kg?.toFixed(0)} kg de orgânicos gerenciados</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-700">
                  R$ {ecoOrganico.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Aumento de Reciclagem</div>
                    <div className="text-sm text-gray-600">{report?.total_reciclavel_kg?.toFixed(0)} kg recicláveis coletados</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-700">
                  R$ {ecoReciclavel.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatório de Participação */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="w-7 h-7 text-blue-700" />
                Relatório de Participação dos Moradores
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Engajamento e desempenho individual — {nomeMes} de {ano}
              </CardDescription>
            </div>
            <PdfButton tipo="participacao" className="bg-blue-700 hover:bg-blue-800" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-600 mb-2">Total de Moradores</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{analytics?.total_moradores ?? 0}</div>
              <div className="text-sm text-gray-500">Moradores cadastrados</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-600 mb-2">Taxa de Engajamento</div>
              <div className="text-4xl font-bold text-blue-600 mb-1">{analytics?.participacao_atual ?? 0}%</div>
              <Progress value={analytics?.participacao_atual ?? 0} className="mt-2" />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-sm text-gray-600 mb-2">Moradores Ativos</div>
              <div className="text-4xl font-bold text-green-600 mb-1">{report?.moradores_ativos ?? 0}</div>
              <div className="text-sm text-green-600">no período selecionado</div>
            </div>
          </div>

          {participationChartData.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-md mb-6">
              <h4 className="font-semibold text-lg mb-4">Evolução de Participação</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={participationChartData}>
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
          )}

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h4 className="font-semibold text-lg mb-4">Top 5 Moradores do Mês</h4>
            {topMoradores.length > 0 ? (
              <div className="space-y-3">
                {topMoradores.map((morador, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{morador.nome}</div>
                        <div className="text-sm text-gray-600">Apto {morador.apartamento}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-700">{morador.score}%</div>
                      <div className="text-xs text-gray-600">{morador.descartes} descartes</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">Sem registros de descarte no período selecionado.</p>
            )}
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
                Benefícios sustentáveis alcançados — {nomeMes} de {ano}
              </CardDescription>
            </div>
            <PdfButton tipo="ambiental" className="bg-emerald-700 hover:bg-emerald-800" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <Leaf className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-700 mb-1">{co2Tons}t</div>
              <div className="text-sm text-gray-600">CO₂ Evitado</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <TrendingDown className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-700 mb-1">{pctRejeito}%</div>
              <div className="text-sm text-gray-600">Rejeito do Total</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <Package className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-700 mb-1">{pctReciclavel}%</div>
              <div className="text-sm text-gray-600">Taxa de Reciclagem</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <Users className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-orange-700 mb-1">{analytics?.participacao_atual ?? 0}%</div>
              <div className="text-sm text-gray-600">Participação Ativa</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h4 className="font-semibold text-lg mb-4">Evolução Mensal (kg)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
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
            )}

            {wasteData.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h4 className="font-semibold text-lg mb-4">Distribuição Atual</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wasteData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {wasteData.map((entry, idx) => (
                          <Cell key={`impact-pie-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
