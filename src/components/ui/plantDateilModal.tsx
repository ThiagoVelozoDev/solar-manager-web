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
  Thermometer,
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

  const hasOperationalData =
    plant.temperature !== null && plant.temperature !== undefined ||
    plant.todayEnergy !== null && plant.todayEnergy !== undefined ||
    plant.yearEnergy !== null && plant.yearEnergy !== undefined ||
    plant.totalEnergy !== null && plant.totalEnergy !== undefined;

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
            {plant.statusReason ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Motivo do status</p>
                    <p className="mt-1 text-sm text-amber-800">{plant.statusReason}</p>
                    {plant.statusAlarmMessage ? (
                      <p className="mt-2 text-xs text-amber-900">
                        Alarme: {plant.statusAlarmMessage}
                        {plant.statusAlarmCode ? ` (código ${plant.statusAlarmCode})` : ''}
                        {plant.statusAlarmLevel ? ` - nível ${plant.statusAlarmLevel}` : ''}
                      </p>
                    ) : null}
                    {plant.statusAlarmAt ? (
                      <p className="mt-1 text-xs text-amber-900">
                        Última ocorrência do alarme: {new Date(plant.statusAlarmAt).toLocaleString('pt-BR')}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                    {plant.statusReasonSource === 'api-derived' ? 'Derivado da API' : 'Regra do dashboard'}
                  </Badge>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-white">
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

              <div className="p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-5 text-blue-500" />
                  <span className="font-medium">Eficiência</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{plant.efficiency}%</p>
                <p className="text-sm text-gray-500 mt-1">Performance do sistema</p>
              </div>

              <div className="p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="size-5 text-purple-500" />
                  <span className="font-medium">Geração Mensal {plant.energyMonthLabel ? `(${plant.energyMonthLabel})` : ''}</span>
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

              <div className="p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="size-5 text-orange-500" />
                  <span className="font-medium">Horas de Sol</span>
                </div>
                <p className="text-3xl font-bold">6.8h</p>
                <p className="text-sm text-gray-500 mt-1">Hoje - valor simulado</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4 mt-4">
            {!plant.inverters || plant.inverters.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Nenhum equipamento encontrado para esta usina na API no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {plant.inverters.map((inverter) => (
                  <div key={inverter.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          inverter.status === 'online' ? 'bg-green-500' : inverter.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <span className="font-medium">{inverter.name}</span>
                          <p className="text-xs text-gray-500">
                            {inverter.brand || '-'} / {inverter.model || '-'}
                            {inverter.serialNumber ? ` - SN: ${inverter.serialNumber}` : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {inverter.status === 'online' ? 'Online' : inverter.status === 'warning' ? 'Atenção' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Potência</p>
                        <p className="text-xl font-bold">{inverter.powerKw.toFixed(2)} kW</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Eficiência</p>
                        <p className="text-xl font-bold text-green-600">{inverter.efficiency.toFixed(1)}%</p>
                      </div>
                    </div>
                    {inverter.lastMetricAt ? (
                      <p className="mt-2 text-xs text-gray-500">
                        Última métrica: {new Date(inverter.lastMetricAt).toLocaleString('pt-BR')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weather" className="space-y-4 mt-4">
            {!hasOperationalData ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Não há dados operacionais suficientes para exibir condições desta usina no momento.
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="size-5 text-red-500" />
                  <span className="font-medium">Temperatura</span>
                </div>
                <p className="text-3xl font-bold">
                  {plant.temperature !== null && plant.temperature !== undefined
                    ? `${plant.temperature.toFixed(1)}°C`
                    : '--'}
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="size-5 text-amber-500" />
                  <span className="font-medium">Energia Hoje {plant.energyDayLabel ? `(${plant.energyDayLabel})` : ''}</span>
                </div>
                <p className="text-3xl font-bold">
                  {plant.todayEnergy !== null && plant.todayEnergy !== undefined
                    ? `${plant.todayEnergy.toFixed(2)} kWh`
                    : '--'}
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="size-5 text-blue-500" />
                  <span className="font-medium">Energia no Ano</span>
                </div>
                <p className="text-3xl font-bold">
                  {plant.yearEnergy !== null && plant.yearEnergy !== undefined
                    ? `${plant.yearEnergy.toFixed(2)} kWh`
                    : '--'}
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-5 text-green-500" />
                  <span className="font-medium">Energia Total</span>
                </div>
                <p className="text-3xl font-bold">
                  {plant.totalEnergy !== null && plant.totalEnergy !== undefined
                    ? `${plant.totalEnergy.toFixed(2)} kWh`
                    : '--'}
                </p>
              </div>

              <div className="p-4 border rounded-lg col-span-2 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sun className="size-5 text-orange-500" />
                    <span className="font-medium">Fonte dos dados</span>
                  </div>
                  <Badge variant="outline">
                    {plant.hasRealData ? 'Dados reais da API' : 'Dados estimados'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Última atualização recebida: {plant.lastUpdate}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
