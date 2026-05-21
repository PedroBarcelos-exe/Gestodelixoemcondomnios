import { Award, Leaf, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { ChartContainer } from './ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export function ImpactStats() {
  const monthlyContribution = [
    { id: 'jan', month: 'Jan', score: 65 },
    { id: 'fev', month: 'Fev', score: 72 },
    { id: 'mar', month: 'Mar', score: 78 },
    { id: 'abr', month: 'Abr', score: 85 },
    { id: 'mai', month: 'Mai', score: 87 },
  ];

  const achievements = [
    { title: 'Estrela Verde', description: '30 dias consecutivos de separação correta', earned: true },
    { title: 'Eco Warrior', description: '100 descartes corretos', earned: true },
    { title: 'Reciclador Master', description: '50kg de recicláveis', earned: true },
    { title: 'Consciente', description: 'Zero rejeito por 7 dias', earned: false },
  ];

  const impactData = [
    { label: 'CO₂ evitado', value: '45kg', icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Árvores salvas', value: '12', icon: Award, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { label: 'Água economizada', value: '380L', icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {impactData.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Neste mês
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Desempenho Mensal</CardTitle>
          <CardDescription>
            Score de sustentabilidade baseado em separação correta e frequência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Score Atual</span>
              <span className="text-2xl font-bold text-green-600">87/100</span>
            </div>
            <Progress value={87} className="h-3" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyContribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Conquistas
          </CardTitle>
          <CardDescription>
            Badges desbloqueadas pelo seu compromisso ambiental
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  achievement.earned
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${achievement.earned ? 'text-yellow-600' : 'text-gray-400'}`}>
                    <Award className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    {achievement.earned && (
                      <Badge className="mt-2 bg-yellow-600">Conquistado</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Comparação com o Condomínio
          </CardTitle>
          <CardDescription>
            Veja como você está contribuindo para as metas coletivas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Sua separação correta</span>
                <span className="text-sm font-bold text-green-600">87%</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={87} className="flex-1" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Média do condomínio</span>
                <span className="text-sm font-bold">82%</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={82} className="flex-1" />
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <p className="text-center font-medium text-green-800">
                🌟 Parabéns! Você está 5% acima da média do condomínio!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
