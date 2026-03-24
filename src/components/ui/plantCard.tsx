import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { MapPin, Zap, Calendar, TrendingUp } from "lucide-react";
import { Progress } from "../ui/progress";

export interface SolarPlant {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentGeneration: number;
  status: 'online' | 'warning' | 'offline';
  efficiency: number;
  lastUpdate: string;
  monthlyGeneration: number;
  monthlyTarget: number;
}

interface PlantCardProps {
  plant: SolarPlant;
  onClick: () => void;
}

export function PlantCard({ plant, onClick }: PlantCardProps) {
  const statusColors = {
    online: 'bg-green-500',
    warning: 'bg-amber-500',
    offline: 'bg-red-500',
  };

  const statusLabels = {
    online: 'Online',
    warning: 'Atenção',
    offline: 'Offline',
  };

  const generationPercentage = (plant.currentGeneration / plant.capacity) * 100;
  const monthlyProgress = (plant.monthlyGeneration / plant.monthlyTarget) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{plant.name}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin className="size-3" />
              {plant.location}
            </div>
          </div>
          <Badge className={`${statusColors[plant.status]} text-white`}>
            {statusLabels[plant.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Geração Atual */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <span className="text-sm font-medium">Geração Atual</span>
              </div>
              <span className="font-bold text-lg">
                {plant.currentGeneration.toFixed(1)} kW
              </span>
            </div>
            <Progress value={generationPercentage} className="h-2" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                Capacidade: {plant.capacity} kW
              </span>
              <span className="text-xs font-medium">
                {generationPercentage.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Meta Mensal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-blue-500" />
                <span className="text-sm font-medium">Meta Mensal</span>
              </div>
              <span className="text-sm font-medium">
                {plant.monthlyGeneration.toFixed(0)} / {plant.monthlyTarget} MWh
              </span>
            </div>
            <Progress value={monthlyProgress} className="h-2" />
            <span className="text-xs text-gray-500 mt-1 block">
              {monthlyProgress.toFixed(0)}% da meta atingida
            </span>
          </div>

          {/* Eficiência */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-gray-400" />
              <span className="text-xs text-gray-500">Eficiência</span>
            </div>
            <span className="text-sm font-medium text-green-600">
              {plant.efficiency}%
            </span>
          </div>

          <div className="text-xs text-gray-400 text-right">
            Atualizado: {plant.lastUpdate}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
