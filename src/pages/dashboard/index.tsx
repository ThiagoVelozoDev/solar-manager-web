import { useEffect, useRef, useState } from "react";
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { StatusCard } from "../../components/ui/statusCard";
import type { SolarPlant } from "../../components/ui/plantCard";
import { AlertsPanel, type Alert } from "../../components/ui/alertsPanel";
import { EnergyChart } from "../../components/ui/energyChart";
import { PlantDetailsModal } from "../../components/ui/plantDateilModal";
import { PlantsTable } from "../../components/ui/plantsTable";
import { Zap, Factory, TrendingUp, DollarSign, RefreshCw, ChevronRight, ChevronLeft, Clock } from "lucide-react";
import { apiFetch } from '../../lib/api';

const AUTO_REFRESH_SECONDS = 60;

interface DashboardOverviewResponse {
  summary: {
    totalGeneration: number;
    totalCapacity: number;
    onlinePlants: number;
    totalPlants: number;
    averageEfficiency: number;
    monthlyRevenue: number;
    totalCompanies: number;
    totalUsers: number;
    activeUsers: number;
  };
  plants: SolarPlant[];
  alerts: Alert[];
  charts: {
    daily: Array<{ time: string; generation: number | null; target: number }>;
    monthly: Array<{ month: string; generation: number; target: number }>;
  };
}

interface SyncStatus {
  inProgress: boolean;
  lastSync: {
    stationsSynced: number;
    invertersSynced: number;
    errors: string[];
    timestamp: string;
  } | null;
}

export default function DashboardPage() {
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState<DashboardOverviewResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<SolarPlant | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [alertsOnlyActivePlants, setAlertsOnlyActivePlants] = useState(true);
  const [isAlertsPanelCollapsed, setIsAlertsPanelCollapsed] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const countdownRef = useRef(AUTO_REFRESH_SECONDS);
  const drilldownRef = useRef<string | null>(null);

  const resetCountdown = () => {
    countdownRef.current = AUTO_REFRESH_SECONDS;
    setCountdown(AUTO_REFRESH_SECONDS);
  };

  const fetchDashboard = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        alertsActivePlantsOnly: alertsOnlyActivePlants ? 'true' : 'false',
      });
      const response = await apiFetch<DashboardOverviewResponse>(`/dashboard/overview?${query.toString()}`);
      setDashboardData(response);
      setAlerts(response.alerts);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Nao foi possivel carregar o dashboard';
      setError(message);
      toast.error(message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, [alertsOnlyActivePlants]);

  useEffect(() => {
    resetCountdown();
    const interval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        countdownRef.current = AUTO_REFRESH_SECONDS;
        setCountdown(AUTO_REFRESH_SECONDS);
        void fetchDashboard(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alertsOnlyActivePlants]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await apiFetch('/sync/trigger', { method: 'POST' });
      toast.loading('Sincronização iniciada...', { id: 'sync-status' });

      // Poll para ver o status
      let attempts = 0;
      const maxAttempts = 120; // 2 minutos no máximo

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const status = await apiFetch<SyncStatus>('/sync/status');
          if (!status.inProgress) {
            clearInterval(pollInterval);

            if (status.lastSync?.errors.length === 0) {
              toast.dismiss('sync-status');
              toast.success(
                `✓ Sincronização completa!\n${status.lastSync.stationsSynced} estações, ${status.lastSync.invertersSynced} inversores sincronizados`,
              );
              // Recarrega o dashboard com os dados reais
              await new Promise((r) => setTimeout(r, 1000));
              await fetchDashboard();
              resetCountdown();
            } else {
              toast.dismiss('sync-status');
              toast.error(
                `Sincronização com erros:\n${status.lastSync?.errors.join('\n') || 'Erro desconhecido'}`,
              );
            }
          }
        } catch (err) {
          console.error('Erro ao verificar status de sincronização:', err);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          toast.dismiss('sync-status');
          toast.error('Sincronização expirou (tempo limite atingido)');
        }
      }, 1000);
    } catch (err) {
      toast.error(String(err) || 'Erro ao iniciar sincronização');
    } finally {
      setSyncing(false);
    }
  };

  const plants = dashboardData?.plants ?? [];
  const totalGeneration = dashboardData?.summary.totalGeneration ?? 0;
  const totalCapacity = dashboardData?.summary.totalCapacity ?? 0;
  const averageEfficiency = dashboardData?.summary.averageEfficiency ?? 0;
  const monthlyRevenue = dashboardData?.summary.monthlyRevenue ?? 0;
  const onlinePlants = dashboardData?.summary.onlinePlants ?? 0;
  const totalPlants = dashboardData?.summary.totalPlants ?? 0;

  const handleDismissAlert = (id: string) => {
    setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== id));
  };

  useEffect(() => {
    if (plants.length === 0) return;

    const params = new URLSearchParams(location.search);
    const plantIdParam = params.get('plantId');
    const inverterSnParam = params.get('inverterSn');
    if (!plantIdParam && !inverterSnParam) return;

    const key = `${plantIdParam ?? ''}|${inverterSnParam ?? ''}`;
    if (drilldownRef.current === key) return;

    let matchedPlant: SolarPlant | undefined;
    if (inverterSnParam) {
      matchedPlant = plants.find((plant) =>
        plant.inverters?.some((inv) => inv.serialNumber === inverterSnParam),
      );
    } else if (plantIdParam) {
      matchedPlant = plants.find((plant) => plant.id === plantIdParam);
    }

    if (matchedPlant) {
      setSelectedPlant(matchedPlant);
      drilldownRef.current = key;
    }
  }, [plants, location.search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header com botão de sincronização */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Visão geral do monitoramento solar</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              <Clock className="size-4 shrink-0" />
              <span>
                Atualiza em{' '}
                <span className={`font-semibold tabular-nums ${countdown <= 10 ? 'text-amber-600' : 'text-gray-700'}`}>
                  {countdown}s
                </span>
              </span>
            </div>
            <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={alertsOnlyActivePlants}
                onChange={(event) => setAlertsOnlyActivePlants(event.target.checked)}
              />
              Exibir alarmes só de usinas ativas
            </label>
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar API'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatusCard
            title="Geração Total"
            value={`${totalGeneration.toFixed(1)} kW`}
            subtitle={`de ${totalCapacity} kW`}
            icon={Zap}
            color="bg-[#0055a3]"
            trend={{ value: '12.5%', isPositive: true }}
          />
          <StatusCard
            title="Usinas Ativas"
            value={onlinePlants.toString()}
            subtitle={`de ${totalPlants} totais`}
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
            subtitle="Estimativa baseada na geração"
            icon={DollarSign}
            color="bg-purple-500"
            trend={{ value: '8.3%', isPositive: true }}
          />
        </div>

        {/* Gráfico de Geração */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <EnergyChart data={dashboardData?.charts ?? { daily: [], monthly: [] }} />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          {/* Tabela de Usinas */}
          <div className={`min-w-0 xl:min-h-[600px] ${isAlertsPanelCollapsed ? 'xl:flex-1' : 'xl:flex-[3]'}`}>
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
                Carregando dados...
              </div>
            ) : (
              <PlantsTable plants={plants} onSelectPlant={setSelectedPlant} />
            )}
          </div>

          {/* Painel de Alertas */}
          <div className={`transition-all duration-300 ${isAlertsPanelCollapsed ? 'xl:w-12' : 'xl:w-80 xl:shrink-0'}`}>
            {isAlertsPanelCollapsed ? (
              <div className="rounded-xl border border-gray-200 bg-white p-3 flex xl:flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAlertsPanelCollapsed(false)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  title="Expandir Alertas"
                >
                  <ChevronLeft className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAlertsPanelCollapsed(true)}
                    className="hidden xl:inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    title="Recolher Alertas"
                  >
                    Recolher
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <AlertsPanel alerts={alerts} onDismiss={handleDismissAlert} />
              </div>
            )}
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