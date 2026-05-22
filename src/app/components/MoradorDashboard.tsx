import { useState, useEffect } from 'react';
import { Calendar, Package, TrendingUp, Trash2, LogOut, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CollectionCalendar } from './CollectionCalendar';
import { SchedulePickup } from './SchedulePickup';
import { ImpactStats } from './ImpactStats';
import { moradorService, DashboardData } from '../../services/moradorService';
import { ChatbotWidget } from './ChatbotWidget';

export function MoradorDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Morador');
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await moradorService.getDashboard();
        setDashboardData(data);
        if (data.nome) {
          setUserName(data.nome);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const upcomingCollections = [
    { type: 'Orgânico', date: '2026-05-15', day: 'Amanhã', color: 'bg-green-500' },
    { type: 'Reciclável', date: '2026-05-16', day: 'Sexta', color: 'bg-blue-500' },
    { type: 'Rejeito', date: '2026-05-17', day: 'Sábado', color: 'bg-gray-500' },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-emerald-600 border-b border-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">GreenBin</h1>
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
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-white border border-green-200 shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Visão Geral</TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Calendário</TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Agendar</TabsTrigger>
            <TabsTrigger value="impact" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Meu Impacto</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-green-200 bg-gradient-to-br from-white to-green-50 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meta Mensal</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData?.meta_mensal_pct ?? 87}%
                  </div>
                  <Progress value={dashboardData?.meta_mensal_pct ?? 87} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {dashboardData?.descartes_corretos ?? 26} de {dashboardData?.total_descartes ?? 30} descartes corretos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-white to-green-50 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próxima Coleta</CardTitle>
                  <Calendar className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {dashboardData?.proxima_coleta ? 'Amanhã' : 'Sem agendadas'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {dashboardData?.proxima_coleta 
                      ? `${dashboardData.proxima_coleta.tipo.charAt(0).toUpperCase() + dashboardData.proxima_coleta.tipo.slice(1)} - ${new Date(dashboardData.proxima_coleta.data).toLocaleDateString('pt-BR')}`
                      : 'Nenhuma coleta próxima'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-white to-green-50 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                  <Package className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {dashboardData?.agendamentos_pendentes ?? 2}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Volumosos pendentes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Collections */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Coletas</CardTitle>
                <CardDescription>
                  Prepare seus resíduos conforme o tipo de coleta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingCollections.map((collection, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${collection.color}`} />
                        <div>
                          <p className="font-medium">{collection.type}</p>
                          <p className="text-sm text-gray-600">{collection.day}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{collection.date}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <CollectionCalendar />
          </TabsContent>

          <TabsContent value="schedule">
            <SchedulePickup />
          </TabsContent>

          <TabsContent value="impact">
            <ImpactStats />
          </TabsContent>
        </Tabs>
      </main>

      {/* Assistente Virtual de IA Integrado */}
      <ChatbotWidget onRedirectTab={setActiveTab} />
    </div>
  );
}
