import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ChevronRight} from 'lucide-react'
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Filter, Plus, Trash2, Wrench } from "lucide-react";
import { phases, mockPlants, serviceReasons, serviceTypes, loadWorkOrders, saveWorkOrders } from "./types";
import type { WorkOrder } from "./types";

interface Filters {
  plant_id: string;
  service_type: string;
  service_reason: string;
  phase: string;
  created_date_from: string;
  created_date_to: string;
  scheduled_date_from: string;
  scheduled_date_to: string;
  concluded_date_from: string;
  concluded_date_to: string;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    plant_id: "",
    service_type: "",
    service_reason: "",
    phase: "",
    created_date_from: "",
    created_date_to: "",
    scheduled_date_from: "",
    scheduled_date_to: "",
    concluded_date_from: "",
    concluded_date_to: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const orders = loadWorkOrders();
    setWorkOrders(orders);
  }, []);

  const persist = (items: WorkOrder[]) => {
    setWorkOrders(items);
    saveWorkOrders(items);
  };

  const handleDelete = (id: string) => {
    const next = workOrders.filter((wo) => wo.id !== id);
    persist(next);
  };

  const filteredWorkOrders = workOrders.filter((wo) => {
    if (filters.plant_id && wo.plant_id !== filters.plant_id) return false;
    if (filters.service_type && wo.service_type !== filters.service_type) return false;
    if (filters.service_reason && wo.service_reason !== filters.service_reason) return false;
    if (filters.phase && wo.phase !== filters.phase) return false;
    if (filters.created_date_from && new Date(wo.created_at) < new Date(filters.created_date_from)) return false;
    if (filters.created_date_to && new Date(wo.created_at) > new Date(filters.created_date_to)) return false;
    if (filters.scheduled_date_from && wo.scheduled_date && new Date(wo.scheduled_date) < new Date(filters.scheduled_date_from)) return false;
    if (filters.scheduled_date_to && wo.scheduled_date && new Date(wo.scheduled_date) > new Date(filters.scheduled_date_to)) return false;
    if (filters.concluded_date_from && wo.concluded_date && new Date(wo.concluded_date) < new Date(filters.concluded_date_from)) return false;
    if (filters.concluded_date_to && wo.concluded_date && new Date(wo.concluded_date) > new Date(filters.concluded_date_to)) return false;
    return true;
  });

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      plant_id: "",
      service_type: "",
      service_reason: "",
      phase: "",
      created_date_from: "",
      created_date_to: "",
      scheduled_date_from: "",
      scheduled_date_to: "",
      concluded_date_from: "",
      concluded_date_to: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <nav className="flex" aria-label="Breadcrumb">
          <span className="text-gray-900 font-semibold">Ordens de Serviço</span>
          <ChevronRight className="size-4" />
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#383F46] p-2 sm:p-3 rounded-lg">
              <Wrench className="size-5 sm:size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Ordens de Serviço</h1>
              <p className="text-sm text-gray-500">Gerencie e acompanhe todas as ordens</p>
            </div>
          </div>

          <Button
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2"
            onClick={() => navigate("/maintenance/create")}
          >
            <Plus className="size-4" />
            Nova OS
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-white mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <Filter className="size-4" />
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              </button>
              {Object.values(filters).some((v) => v) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </CardHeader>

          {showFilters && (
            <CardContent className="bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Usina</label>
                  <select
                    value={filters.plant_id}
                    onChange={(e) => handleFilterChange("plant_id", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Todas</option>
                    {mockPlants.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Serviço</label>
                  <select
                    value={filters.service_type}
                    onChange={(e) => handleFilterChange("service_type", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Todos</option>
                    {serviceTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo</label>
                  <select
                    value={filters.service_reason}
                    onChange={(e) => handleFilterChange("service_reason", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Todos</option>
                    {serviceReasons.map((reason, idx) => (
                      <option key={idx} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fase</label>
                  <select
                    value={filters.phase}
                    onChange={(e) => handleFilterChange("phase", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">Todas</option>
                    {phases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Criação (De)</label>
                  <input
                    type="date"
                    value={filters.created_date_from}
                    onChange={(e) => handleFilterChange("created_date_from", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabela de Ordens de Serviço */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">
              Ordens de Serviço ({filteredWorkOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">OS ID</TableHead>
                    <TableHead className="text-xs sm:text-sm">Usina</TableHead>
                    <TableHead className="text-xs sm:text-sm">Tipo Serviço</TableHead>
                    <TableHead className="text-xs sm:text-sm">Motivo</TableHead>
                    <TableHead className="text-xs sm:text-sm">Fase</TableHead>
                    <TableHead className="text-xs sm:text-sm">Equipe</TableHead>
                    <TableHead className="text-xs sm:text-sm">Criação</TableHead>
                    <TableHead className="text-xs sm:text-sm">Programação</TableHead>
                    <TableHead className="text-xs sm:text-sm">Conclusão</TableHead>
                    <TableHead className="text-xs sm:text-sm text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-gray-500 text-xs sm:text-sm"
                      >
                        Nenhuma ordem de serviço encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorkOrders.map((workOrder) => (
                      <TableRow key={workOrder.id} className="text-xs sm:text-sm hover:bg-gray-50">
                        <TableCell className="font-semibold">{workOrder.wo_id}</TableCell>
                        <TableCell>{workOrder.plant_name}</TableCell>
                        <TableCell>{workOrder.service_type}</TableCell>
                        <TableCell>{workOrder.service_reason}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              workOrder.phase === "55"
                                ? "bg-green-100 text-green-800"
                                : workOrder.phase === "01"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : workOrder.phase === "04"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {phases.find((p) => p.id === workOrder.phase)?.name || workOrder.phase}
                          </span>
                        </TableCell>
                        <TableCell>{workOrder.team_name || "-"}</TableCell>
                        <TableCell>{workOrder.created_at}</TableCell>
                        <TableCell>{workOrder.scheduled_date || "-"}</TableCell>
                        <TableCell>{workOrder.concluded_date || "-"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {workOrder.phase === "01" && (
                              <>
                                <button
                                  onClick={() => navigate(`/maintenance/edit/${workOrder.id}`)}
                                  className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 rounded transition whitespace-nowrap"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => navigate(`/maintenance/edit/${workOrder.id}`)}  
                                  className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded transition whitespace-nowrap"
                                >
                                  Programar
                                </button>
                              </>
                            )}
                            {workOrder.phase === "04" && (
                              <button
                                onClick={() => navigate(`/maintenance/conclusion/${workOrder.id}`)}
                                className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 rounded transition whitespace-nowrap"
                              >
                                Concluir
                              </button>
                            )}
                            {(workOrder.phase === "55" || workOrder.phase === "12") && (
                              <button
                                onClick={() => navigate(`/maintenance/edit/${workOrder.id}`)}
                                className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 rounded transition whitespace-nowrap"
                              >
                                Editar Conclusão
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(workOrder.id)}
                              className="p-1.5 text-xs hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="size-4 text-red-500 hover:text-red-700" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-xs sm:text-sm text-gray-500">
              Total de {filteredWorkOrders.length} ordem{filteredWorkOrders.length !== 1 ? "s" : ""} de
              serviço
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}