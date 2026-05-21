import { useState } from 'react';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface CollectionCalendarProps {
  showAdminFeatures?: boolean;
}

export function CollectionCalendar({ showAdminFeatures = false }: CollectionCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const collectionSchedule = {
    organic: [1, 3, 5], // Segunda, Quarta, Sexta
    recyclable: [2, 4], // Terça, Quinta
    reject: [6], // Sábado
  };

  const getDayCollectionType = (day: Date) => {
    const dayOfWeek = day.getDay();
    if (collectionSchedule.organic.includes(dayOfWeek)) return 'organic';
    if (collectionSchedule.recyclable.includes(dayOfWeek)) return 'recyclable';
    if (collectionSchedule.reject.includes(dayOfWeek)) return 'reject';
    return null;
  };

  const getCollectionLabel = (type: string | null) => {
    switch (type) {
      case 'organic': return { label: 'Orgânico', color: 'bg-green-500' };
      case 'recyclable': return { label: 'Reciclável', color: 'bg-blue-500' };
      case 'reject': return { label: 'Rejeito', color: 'bg-gray-500' };
      default: return null;
    }
  };

  const selectedDayType = date ? getDayCollectionType(date) : null;
  const selectedDayInfo = getCollectionLabel(selectedDayType);

  const modifiers = {
    organic: (day: Date) => {
      const dayOfWeek = day.getDay();
      return collectionSchedule.organic.includes(dayOfWeek);
    },
    recyclable: (day: Date) => {
      const dayOfWeek = day.getDay();
      return collectionSchedule.recyclable.includes(dayOfWeek);
    },
    reject: (day: Date) => {
      const dayOfWeek = day.getDay();
      return collectionSchedule.reject.includes(dayOfWeek);
    }
  };

  const modifiersStyles = {
    organic: {
      backgroundColor: 'rgb(34, 197, 94)',
      color: 'white',
      fontWeight: 'bold'
    },
    recyclable: {
      backgroundColor: 'rgb(59, 130, 246)',
      color: 'white',
      fontWeight: 'bold'
    },
    reject: {
      backgroundColor: 'rgb(107, 114, 128)',
      color: 'white',
      fontWeight: 'bold'
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Coletas</CardTitle>
          <CardDescription>
            Dias coloridos indicam o tipo de coleta
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Legenda</CardTitle>
            <CardDescription>Tipos de coleta por dia da semana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="font-medium">Resíduos Orgânicos</p>
                <p className="text-sm text-gray-600">Segunda, Quarta e Sexta</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Recicláveis</p>
                <p className="text-sm text-gray-600">Terça e Quinta</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gray-500" />
              <div className="flex-1">
                <p className="font-medium">Rejeitos</p>
                <p className="text-sm text-gray-600">Sábado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {date && selectedDayInfo && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>Dia Selecionado</CardTitle>
              <CardDescription>
                {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                <div className={`w-3 h-3 rounded-full ${selectedDayInfo.color}`} />
                <div>
                  <p className="font-medium text-lg">{selectedDayInfo.label}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDayType === 'organic' && 'Restos de alimentos, cascas, folhas'}
                    {selectedDayType === 'recyclable' && 'Papéis, plásticos, metais, vidros'}
                    {selectedDayType === 'reject' && 'Resíduos não recicláveis'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showAdminFeatures && (
          <Card>
            <CardHeader>
              <CardTitle>Dicas para Moradores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Separe os resíduos na fonte</p>
              <p>• Lave embalagens recicláveis</p>
              <p>• Descarte eletrônicos em pontos específicos</p>
              <p>• Agende volumosos com antecedência</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
