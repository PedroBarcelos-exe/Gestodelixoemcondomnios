import { useState } from 'react';
import { CheckCircle, Clock, Package, LogOut, Wrench, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { CollectionCalendar } from './CollectionCalendar';

export function ZeladorDashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Zelador';
  const [activeTab, setActiveTab] = useState('tasks');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const [pickupRequests, setPickupRequests] = useState([
    { id: 1, apt: '301', item: 'Sofá 3 lugares', status: 'pending', date: '2026-05-15', requester: 'João Silva' },
    { id: 2, apt: '205', item: 'Geladeira', status: 'pending', date: '2026-05-16', requester: 'Maria Santos' },
    { id: 3, apt: '102', item: 'Colchão', status: 'completed', date: '2026-05-13', requester: 'Pedro Costa' },
  ]);

  const [todayTasks, setTodayTasks] = useState([
    { id: 1, task: 'Organizar área de coleta seletiva', completed: true },
    { id: 2, task: 'Verificar lixeiras do térreo', completed: true },
    { id: 3, task: 'Preparar área para coleta de orgânicos', completed: false },
    { id: 4, task: 'Retirar sofá do apto 301', completed: false },
  ]);

  const toggleTask = (taskId: number) => {
    setTodayTasks(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
  };

  const completePickup = (id: number) => {
    setPickupRequests(requests =>
      requests.map(r => r.id === id ? { ...r, status: 'completed' } : r)
    );
  };

  const pendingCount = pickupRequests.filter(r => r.status === 'pending').length;
  const completedToday = todayTasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-emerald-600 border-b border-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">GreenBin - Zelador</h1>
                <p className="text-sm text-green-100">Olá, {userName}</p>
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
          <TabsList className="grid w-full grid-cols-3 max-w-xl bg-white border border-green-200 shadow-sm">
            <TabsTrigger value="tasks" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Tarefas</TabsTrigger>
            <TabsTrigger value="pickups" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Agendamentos
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-orange-500">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Calendário</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tarefas Hoje</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedToday}/{todayTasks.length}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Completadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                  <Package className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingCount}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pendentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alertas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sem problemas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Tarefas do Dia</CardTitle>
                <CardDescription>
                  Marque as tarefas conforme forem completadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`flex-1 cursor-pointer ${task.completed ? 'line-through text-gray-500' : ''}`}
                      >
                        {task.task}
                      </label>
                      {task.completed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pickups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Coleta de Volumosos</CardTitle>
                <CardDescription>
                  Gerencie as solicitações dos moradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pickupRequests.map((request) => (
                    <div key={request.id} className="p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
                              Apto {request.apt}
                            </Badge>
                            <Badge variant={request.status === 'pending' ? 'destructive' : 'outline'}>
                              {request.status === 'pending' ? 'Pendente' : 'Concluído'}
                            </Badge>
                          </div>
                          <p className="font-medium">{request.item}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Solicitante: {request.requester}
                          </p>
                          <p className="text-sm text-gray-500">
                            Data: {new Date(request.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => completePickup(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <CollectionCalendar showAdminFeatures />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
