import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Search, ArrowUpDown, ArrowRight, MapPin, CircleHelp } from "lucide-react";
import { type SolarPlant } from "../ui/plantCard";
import { normalizeSolisAlarmState } from '../../lib/solisAlarmState';

interface PlantsTableProps {
  plants: SolarPlant[];
  onSelectPlant: (plant: SolarPlant) => void;
}

function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex size-4 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
        aria-label="Ver explicação"
      >
        <CircleHelp className="size-3.5" />
      </button>
      <span className="pointer-events-none absolute right-0 top-5 z-30 w-56 whitespace-normal break-words rounded-md bg-gray-900 px-2 py-1.5 text-left text-[11px] leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

export function PlantsTable({ plants, onSelectPlant }: PlantsTableProps) {
  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SolarPlant["status"]>("all");
  const [sortField, setSortField] = useState<keyof SolarPlant | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const handleSort = (field: keyof SolarPlant) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredPlants = plants.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.location.toLowerCase().includes(searchTerm.toLowerCase());
    // Garante comparação robusta de status
    const statusValue = String(plant.status).toLowerCase();
    const filterValue = String(statusFilter).toLowerCase();
    const matchesStatus = filterValue === 'all' || statusValue === filterValue;
    return matchesSearch && matchesStatus;
  });

  const sortedPlants = [...filteredPlants].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === "asc" 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedPlants.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedPlants = sortedPlants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetToFirstPage = () => setPage(1);

  const formatAddressForTooltip = (location: string) => {
    if (!location || location.trim().toLowerCase() === 'localização não informada') {
      return 'Endereço não informado';
    }

    return location
      .split(' - ')
      .map((part) => part.replace(/([A-Za-zÀ-ÿ])(\d)/g, '$1 $2').trim())
      .join(' - ');
  };

  const getGoogleMapsUrl = (plant: SolarPlant) => {
    if (Number.isFinite(plant.latitude) && Number.isFinite(plant.longitude)) {
      return `https://www.google.com/maps?q=${plant.latitude},${plant.longitude}`;
    }

    const fallbackQuery = plant.location?.trim();
    if (!fallbackQuery || fallbackQuery.toLowerCase() === 'localização não informada') {
      return null;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(fallbackQuery)}`;
  };

  const getDataSourceLabel = (plant: SolarPlant) => (plant.hasRealData ? 'API' : 'Estimado');
  const getDataSourceClass = (plant: SolarPlant) => (
    plant.hasRealData
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-600'
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg sm:text-2xl">Clientes - Usinas Solares</CardTitle>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full whitespace-nowrap">Clique para ver detalhes</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetToFirstPage();
                }}
                className="pl-9 w-full text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | SolarPlant["status"]);
                resetToFirstPage();
              }}
              className="h-10 rounded-md border border-gray-300 px-3 text-sm bg-white text-gray-700 sm:min-w-[180px]"
              aria-label="Filtrar por status"
            >
              <option value="all">Todos os status</option>
              <option value="online">Online</option>
              <option value="warning">Atenção</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1 rounded-md border overflow-auto [&_[data-slot=table-container]]:overflow-visible">
          <Table>
            <TableHeader className="bg-white shadow-sm">
              <TableRow>
                <TableHead className="sticky top-0 z-20 bg-white text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-foreground whitespace-nowrap"
                    >
                      Cliente
                      <ArrowUpDown className="size-3" />
                    </button>
                    <InfoHint text="Origem do dado: nome do cliente/usina vem do cadastro interno da planta no banco de dados." />
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-white text-xs sm:text-sm hidden sm:table-cell">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSort('location')}
                      className="flex items-center gap-1 hover:text-foreground whitespace-nowrap"
                    >
                      Localização
                      <ArrowUpDown className="size-3" />
                    </button>
                    <InfoHint text="Origem do dado: coordenadas/endereço vindos do cadastro da planta; quando há latitude/longitude, o mapa usa essas coordenadas." />
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-white text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <InfoHint text="Origem do dado: status é calculado pelo dashboard com base em dados da API (quando disponíveis), alarmes e regras de fallback." />
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-white text-right text-xs sm:text-sm">
                  <div className="ml-auto flex w-fit items-center gap-1">
                    <button
                      onClick={() => handleSort('currentGeneration')}
                      className="flex items-center gap-1 hover:text-foreground whitespace-nowrap"
                    >
                      Geração
                      <ArrowUpDown className="size-3" />
                    </button>
                    <InfoHint text="Geração atual (kW). Se houver integração ativa, vem da API; caso contrário, é estimada pelo dashboard." />
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-white text-right text-xs sm:text-sm hidden md:table-cell">
                  <div className="ml-auto flex w-fit items-center gap-1">
                    <button
                      onClick={() => handleSort('capacity')}
                      className="flex items-center gap-1 hover:text-foreground whitespace-nowrap"
                    >
                      Capacidade
                      <ArrowUpDown className="size-3" />
                    </button>
                    <InfoHint text="Capacidade instalada da usina (kW/kWp) vinda do cadastro da planta no banco. Não é cálculo em tempo real da API." />
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-white text-right text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                  <div className="ml-auto flex w-fit items-center gap-1">
                    <span>Eficiência Diária</span>
                    <InfoHint text="Eficiência diária (%): (energia de hoje / meta diária estimada) x 100, limitada a 100%." />
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-white text-right text-xs sm:text-sm hidden lg:table-cell">
                  <div className="ml-auto flex w-fit items-center gap-1">
                    <button
                      onClick={() => handleSort('efficiency')}
                      className="flex items-center gap-1 hover:text-foreground whitespace-nowrap"
                    >
                      Eficiência Mensal
                      <ArrowUpDown className="size-3" />
                    </button>
                    <InfoHint text="Eficiência mensal (%): (geração mensal / meta mensal estimada) x 100, limitada a 100%." />
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-white text-xs sm:text-sm hidden md:table-cell">
                  <div className="flex w-fit items-center gap-1">
                    <span>Meta Mensal</span>
                    <InfoHint text="Meta mensal: geração do mês (API) versus meta estimada pela capacidade da usina." />
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-white text-xs sm:text-sm hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <span>Última Atualização</span>
                    <InfoHint text="Origem do dado: horário gerado no backend no momento da resposta do dashboard (carimbo de atualização da consulta)." />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPlants.map((plant) => {
                  const generationPercentage = (plant.currentGeneration / plant.capacity) * 100;
                  const monthlyProgress = (plant.monthlyGeneration / plant.monthlyTarget) * 100;
                  
                  return (
                    <TableRow
                      key={plant.id}
                      className="cursor-pointer hover:bg-amber-50 hover:shadow-sm transition-colors text-xs sm:text-sm border-l-4 border-l-transparent hover:border-l-amber-500 group"
                      onClick={() => onSelectPlant(plant)}
                    >
                      <TableCell className="font-medium whitespace-nowrap">{plant.name}</TableCell>
                      <TableCell className="text-gray-600 hidden sm:table-cell whitespace-nowrap text-center align-middle">
                        <div className="flex items-center justify-center">
                          {getGoogleMapsUrl(plant) ? (
                            <a
                              href={getGoogleMapsUrl(plant) ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-md p-1 text-blue-600 hover:bg-blue-50"
                              title={formatAddressForTooltip(plant.location)}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <MapPin className="size-4" />
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col items-start gap-0.5">
                          <Badge className={`${statusColors[plant.status]} text-white text-xs`}>
                            {statusLabels[plant.status]}
                          </Badge>
                          {/* Removido badge secundário Solis, exibe só status principal */}
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div title={plant.hasRealData
                          ? 'Geração atual recebida da API em tempo quase real.'
                          : 'Geração atual estimada por fallback interno (sem dado real recente da API).'}>
                          <div className="font-medium text-xs sm:text-sm">{plant.currentGeneration.toFixed(1)} kW</div>
                          <div className="mt-1">
                            <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${getDataSourceClass(plant)}`}>
                              {getDataSourceLabel(plant)}
                            </span>
                          </div>
                          <Progress value={generationPercentage} className="h-1 w-16 sm:w-20 ml-auto mt-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium hidden md:table-cell whitespace-nowrap">
                        {plant.capacity} kW
                      </TableCell>
                      <TableCell
                        className="text-right hidden lg:table-cell whitespace-nowrap"
                        title={plant.hasRealData
                          ? 'Eficiência diária calculada com energia real da API (hoje / meta diária).'
                          : 'Eficiência diária estimada por fallback de status.'}
                      >
                        <span className={`font-medium text-xs sm:text-sm ${
                          (plant.dailyEfficiency ?? 0) >= 95 ? 'text-green-600' :
                          (plant.dailyEfficiency ?? 0) >= 90 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {(plant.dailyEfficiency ?? 0).toFixed(1)}%
                        </span>
                        <div className="mt-1">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${getDataSourceClass(plant)}`}>
                            {getDataSourceLabel(plant)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-right hidden lg:table-cell whitespace-nowrap"
                        title={plant.hasRealData
                          ? 'Eficiência mensal calculada com geração real da API (mês / meta mensal).'
                          : 'Eficiência mensal em fallback por status (sem base completa da API).'}
                      >
                        <span className={`font-medium text-xs sm:text-sm ${
                          plant.efficiency >= 95 ? 'text-green-600' : 
                          plant.efficiency >= 90 ? 'text-amber-600' : 
                          'text-red-600'
                        }`}>
                          {plant.efficiency}%
                        </span>
                        <div className="mt-1">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${getDataSourceClass(plant)}`}>
                            {getDataSourceLabel(plant)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="hidden md:table-cell"
                        title={plant.hasRealData
                          ? 'Valor à esquerda vem da API (geração mensal real). Meta à direita é cálculo estimado por capacidade.'
                          : 'Sem dado mensal real recente da API: valores podem usar estimativas/fallback.'}
                      >
                        <div className="w-24 lg:w-32">
                          <div className="text-xs lg:text-sm mb-1">
                            {plant.monthlyGeneration.toFixed(0)} / {plant.monthlyTarget.toFixed(0)} kWh
                          </div>
                          <div className="mb-1">
                            <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${getDataSourceClass(plant)}`}>
                              {getDataSourceLabel(plant)}
                            </span>
                          </div>
                          <Progress value={monthlyProgress} className="h-1" />
                          <div className="text-xs text-gray-500 mt-1">
                            {monthlyProgress.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Ref: {plant.energyMonthLabel ?? 'sem mês/ano'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-500 hidden lg:table-cell whitespace-nowrap">
                        {plant.lastUpdate}
                      </TableCell>
                      <TableCell className="text-right pr-2">
                        <ArrowRight className="size-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Exibindo {paginatedPlants.length} de {sortedPlants.length} cliente(s) filtrado(s) | Total: {plants.length}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="plantsPageSize" className="whitespace-nowrap">Linhas por página</label>
            <select
              id="plantsPageSize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                resetToFirstPage();
              }}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={currentPage <= 1}
              className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="whitespace-nowrap">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
