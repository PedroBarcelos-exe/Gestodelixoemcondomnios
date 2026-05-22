import { useState, useEffect } from 'react';
import { Calendar, Package, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { moradorService } from '../../services/moradorService';

export function SchedulePickup() {
  const [itemType, setItemType] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mySchedules, setMySchedules] = useState<any[]>([]);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await moradorService.getAgendamentos();
        // Mapear campos do backend para manter compatibilidade com o JSX do frontend
        const mapped = data.map(s => ({
          id: s.id,
          item: s.tipo_item.charAt(0).toUpperCase() + s.tipo_item.slice(1),
          date: s.data_agendada || s.data_preferencial,
          status: s.status,
          description: s.description
        }));
        setMySchedules(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    loadSchedules();
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await moradorService.criarAgendamento(itemType, description, preferredDate);
      setSubmitted(true);
      setItemType('');
      setDescription('');
      setPreferredDate('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'approved':
        return <Badge className="bg-green-600">Aprovado</Badge>;
      case 'completed':
        return <Badge variant="outline">Concluído</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agendar Coleta de Volumosos</CardTitle>
          <CardDescription>
            Solicite a retirada de móveis, eletrodomésticos e outros itens grandes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Solicitação enviada com sucesso! O zelador irá aprovar em breve.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemType">Tipo de Item</Label>
              <Select value={itemType} onValueChange={setItemType} required>
                <SelectTrigger id="itemType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sofa">Sofá</SelectItem>
                  <SelectItem value="cama">Cama / Colchão</SelectItem>
                  <SelectItem value="mesa">Mesa</SelectItem>
                  <SelectItem value="armario">Armário</SelectItem>
                  <SelectItem value="geladeira">Geladeira</SelectItem>
                  <SelectItem value="fogao">Fogão</SelectItem>
                  <SelectItem value="lavadora">Máquina de Lavar</SelectItem>
                  <SelectItem value="eletronico">Eletrônico</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Item</Label>
              <Textarea
                id="description"
                placeholder="Ex: Sofá de 3 lugares, cor bege, em bom estado"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredDate">Data Preferencial</Label>
              <Input
                id="preferredDate"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-gray-600">
                A data está sujeita à aprovação do zelador
              </p>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              <Package className="w-4 h-4 mr-2" />
              Solicitar Coleta
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Dicas Importantes</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Agende com pelo menos 48h de antecedência</li>
              <li>• Itens devem estar acessíveis para retirada</li>
              <li>• Eletrônicos: prefira pontos de coleta especializados</li>
              <li>• Móveis muito grandes podem ter taxa adicional</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus Agendamentos</CardTitle>
          <CardDescription>
            Acompanhe o status das suas solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mySchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum agendamento realizado</p>
              </div>
            ) : (
              mySchedules.map((schedule) => (
                <div key={schedule.id} className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{schedule.item}</h4>
                        {getStatusBadge(schedule.status)}
                      </div>
                      <p className="text-sm text-gray-600">{schedule.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(schedule.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {schedule.status === 'pending' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Aguardando aprovação do zelador
                    </p>
                  )}
                  {schedule.status === 'approved' && (
                    <p className="text-xs text-green-600 mt-2">
                      Aprovado! O item será coletado na data agendada.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
