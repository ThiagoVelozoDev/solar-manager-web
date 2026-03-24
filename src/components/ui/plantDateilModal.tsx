import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { type SolarPlant } from "../ui/plantCard";
import {
  MapPin,
  Zap,
  Sun,
  CloudRain,
  Thermometer,
  Wind,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Progress } from "../../components/ui/progress";

interface PlantDetailsModalProps {
  plant: SolarPlant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlantDetailsModal({ plant, isOpen, onClose }: PlantDetailsModalProps) {
  if (!plant) return null;

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

  // Dados simulados para o modal
  const weatherData = {
    temperature: 28,
    humidity: 65,
    windSpeed: 12,
    cloudCover: 15,
    irradiance: 850,
  };

  const inverters = [
    { id: 1, name: 'Inversor 1', status: 'online', power: 45.2, efficiency: 98 },
    { id: 2, name: 'Inversor 2', status: 'online', power: 47.8, efficiency: 97 },
    { id: 3, name: 'Inversor 3', status: 'online', power: 46.5, efficiency: 98 },
    { id: 4, name: 'Inversor 4', status: 'warning', power: 38.1, efficiency: 92 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{plant.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="size-4 text-gray-500" />
                <span className="text-sm text-gray-500">{plant.location}</span>
              </div>
            </div>
            <Badge className={`${statusColors[plant.status]} text-white`}>
              {statusLabels[plant.status]}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
            <TabsTrigger value="weather">Condições</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="size-5 text-amber-500" />
                  <span className="font-medium">Geração Atual</span>
                </div>
                <p className="text-3xl font-bold">{plant.currentGeneration.toFixed(1)} kW</p>
                <Progress 
                  value={(plant.currentGeneration / plant.capacity) * 100} 
                  className="mt-2 h-2" 
                />
                <p className="text-sm text-gray-500 mt-1">
                  de {plant.capacity} kW de capacidade
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-5 text-blue-500" />
                  <span className="font-medium">Eficiência</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{plant.efficiency}%</p>
                <p className="text-sm text-gray-500 mt-1">Performance do sistema</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="size-5 text-purple-500" />
                  <span className="font-medium">Geração Mensal</span>
                </div>
                <p className="text-3xl font-bold">{plant.monthlyGeneration.toFixed(0)} MWh</p>
                <Progress 
                  value={(plant.monthlyGeneration / plant.monthlyTarget) * 100} 
                  className="mt-2 h-2" 
                />
                <p className="text-sm text-gray-500 mt-1">
                  Meta: {plant.monthlyTarget} MWh
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="size-5 text-orange-500" />
                  <span className="font-medium">Horas de Sol</span>
                </div>
                <p className="text-3xl font-bold">6.8h</p>
                <p className="text-sm text-gray-500 mt-1">Hoje</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4 mt-4">
            <div className="space-y-3">
              {inverters.map((inverter) => (
                <div key={inverter.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        inverter.status === 'online' ? 'bg-green-500' : 'bg-amber-500'
                      }`} />
                      <span className="font-medium">{inverter.name}</span>
                    </div>
                    <Badge variant="outline">
                      {inverter.status === 'online' ? 'Online' : 'Atenção'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Potência</p>
                      <p className="text-xl font-bold">{inverter.power} kW</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Eficiência</p>
                      <p className="text-xl font-bold text-green-600">{inverter.efficiency}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="size-5 text-red-500" />
                  <span className="font-medium">Temperatura</span>
                </div>
                <p className="text-3xl font-bold">{weatherData.temperature}°C</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CloudRain className="size-5 text-blue-500" />
                  <span className="font-medium">Umidade</span>
                </div>
                <p className="text-3xl font-bold">{weatherData.humidity}%</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="size-5 text-gray-500" />
                  <span className="font-medium">Vento</span>
                </div>
                <p className="text-3xl font-bold">{weatherData.windSpeed} km/h</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="size-5 text-amber-500" />
                  <span className="font-medium">Irradiância</span>
                </div>
                <p className="text-3xl font-bold">{weatherData.irradiance} W/m²</p>
              </div>

              <div className="p-4 border rounded-lg col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <CloudRain className="size-5 text-gray-400" />
                  <span className="font-medium">Cobertura de Nuvens</span>
                </div>
                <p className="text-3xl font-bold">{weatherData.cloudCover}%</p>
                <Progress value={weatherData.cloudCover} className="mt-2 h-2" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
