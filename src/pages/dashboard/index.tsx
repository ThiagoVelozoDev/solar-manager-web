import { useState } from "react";
import { StatusCard } from "../../components/ui/statusCard";
import type { SolarPlant } from "../../components/ui/plantCard";
import { AlertsPanel, type Alert } from "../../components/ui/alertsPanel";
import { EnergyChart } from "../../components/ui/energyChart";
import { PlantDetailsModal } from "../../components/ui/plantDateilModal";
import { PlantsTable } from "../../components/ui/plantsTable";
import { Zap, Factory, TrendingUp, DollarSign } from "lucide-react";

// Dados mock para demonstração
const mockPlants: SolarPlant[] = [
  {
    id: '1',
    name: 'Thiago Lima Velozo',
    location: 'Boa Vista, RR',
    capacity: 250,
    currentGeneration: 187.5,
    status: 'online',
    efficiency: 94,
    lastUpdate: '28/01/26 14:30',
    monthlyGeneration: 4850,
    monthlyTarget: 5200,
  },
  {
    id: '2',
    name: 'Elan Cardeque',
    location: 'Boa Vista, RR',
    capacity: 180,
    currentGeneration: 142.8,
    status: 'online',
    efficiency: 96,
    lastUpdate: '28/01/26 14:30',
    monthlyGeneration: 3920,
    monthlyTarget: 4100,
  },
  {
    id: '3',
    name: 'Rodrigo Lacerda',
    location: 'Boa Vista, RR',
    capacity: 320,
    currentGeneration: 198.4,
    status: 'warning',
    efficiency: 88,
    lastUpdate: '28/01/26 14:28',
    monthlyGeneration: 5100,
    monthlyTarget: 6400,
  },
  {
    id: '4',
    name: 'Gustavo Lima',
    location: 'Boa Vista , RR',
    capacity: 200,
    currentGeneration: 156.0,
    status: 'online',
    efficiency: 95,
    lastUpdate: '28/01/26 14:30',
    monthlyGeneration: 4250,
    monthlyTarget: 4500,
  },
];

const mockAlerts: Alert[] = [
  {
    id: '1',
    plantName: 'Rodrigo Lacerda',
    type: 'warning',
    message: 'Inversor 4 apresentando eficiência reduzida (88%). Recomenda-se inspeção.',
    timestamp: '28/01/26 14:15',
  },
  {
    id: '2',
    plantName: 'Gustavo Lima',
    type: 'info',
    message: 'Manutenção preventiva agendada para 05/02/26.',
    timestamp: '28/01/26 10:00',
  },
  {
    id: '3',
    plantName: 'Elan Cardeque',
    type: 'critical',
    message: 'String de painéis 3B não está gerando energia. Verificar conexões.',
    timestamp: '28/01/26 08:45',
  },
];

const dailyChartData = [
  { time: '06:00', generation: 0, target: 0 },
  { time: '07:00', generation: 45, target: 50 },
  { time: '08:00', generation: 98, target: 110 },
  { time: '09:00', generation: 152, target: 160 },
  { time: '10:00', generation: 198, target: 200 },
  { time: '11:00', generation: 235, target: 230 },
  { time: '12:00', generation: 248, target: 240 },
  { time: '13:00', generation: 242, target: 235 },
  { time: '14:00', generation: 215, target: 210 },
  { time: '15:00', generation: 178, target: 180 },
  { time: '16:00', generation: 125, target: 135 },
  { time: '17:00', generation: 68, target: 75 },
  { time: '18:00', generation: 12, target: 15 },
];

const monthlyChartData = [
  { month: 'Jul', generation: 18.2, target: 19.5 },
  { month: 'Ago', generation: 19.8, target: 19.5 },
  { month: 'Set', generation: 18.5, target: 19.0 },
  { month: 'Out', generation: 20.1, target: 20.0 },
  { month: 'Nov', generation: 21.3, target: 20.5 },
  { month: 'Dez', generation: 22.0, target: 21.0 },
  { month: 'Jan', generation: 18.1, target: 21.2 },
];

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [selectedPlant, setSelectedPlant] = useState<SolarPlant | null>(null);

  const totalGeneration = mockPlants.reduce((sum, plant) => sum + plant.currentGeneration, 0);
  const totalCapacity = mockPlants.reduce((sum, plant) => sum + plant.capacity, 0);
  const averageEfficiency = mockPlants.reduce((sum, plant) => sum + plant.efficiency, 0) / mockPlants.length;
  const monthlyRevenue = 285.4; // valor estimado em R$ mil

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-6 py-8">
        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="Geração Total"
            value={`${totalGeneration.toFixed(1)} kW`}
            subtitle={`de ${totalCapacity} kW`}
            icon={Zap}
            color="bg-amber-500"
            trend={{ value: '12.5%', isPositive: true }}
          />
          <StatusCard
            title="Usinas Ativas"
            value={mockPlants.filter(p => p.status === 'online').length.toString()}
            subtitle={`de ${mockPlants.length} totais`}
            icon={Factory}
            color="bg-green-500"
          />
          <StatusCard
            title="Eficiência Média"
            value={`${averageEfficiency.toFixed(1)}%`}
            subtitle="Performance geral"
            icon={TrendingUp}
            color="bg-blue-500"
            trend={{ value: '2.1%', isPositive: true }}
          />
          <StatusCard
            title="Receita Mensal"
            value={`R$ ${monthlyRevenue.toFixed(1)}k`}
            subtitle="Estimativa"
            icon={DollarSign}
            color="bg-purple-500"
            trend={{ value: '8.3%', isPositive: true }}
          />
        </div>

        {/* Gráfico de Geração */}
        <div className="mb-8">
          <EnergyChart data={{ daily: dailyChartData, monthly: monthlyChartData }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tabela de Clientes */}
          <div className="lg:col-span-2">
            <PlantsTable plants={mockPlants} onSelectPlant={setSelectedPlant} />
          </div>

          {/* Painel de Alertas - altura total */}
          <div className="lg:h-[calc(100vh-32rem)]">
            <AlertsPanel alerts={alerts} onDismiss={handleDismissAlert} />
          </div>
        </div>
      </main>

      {/* Modal de Detalhes da Usina */}
      <PlantDetailsModal
        plant={selectedPlant}
        isOpen={!!selectedPlant}
        onClose={() => setSelectedPlant(null)}
      />
    </div>
  );
}