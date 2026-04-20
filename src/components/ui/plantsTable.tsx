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
import { Search, ArrowRight, MapPin, ChevronLeft, ChevronRight, Zap, Activity } from "lucide-react";
import { type SolarPlant } from "../ui/plantCard";

interface PlantsTableProps {
  plants: SolarPlant[];
  onSelectPlant: (plant: SolarPlant) => void;
}

const statusColors: Record<string, string> = {
  online:  'bg-green-500',
  warning: 'bg-amber-500',
  offline: 'bg-red-500',
};
const statusLabels: Record<string, string> = {
  online:  'Online',
  warning: 'Atenção',
  offline: 'Offline',
};
const statusBadge: Record<string, string> = {
  online:  'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  offline: 'bg-red-100  text-red-700  border-red-200',
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function EfficiencyText({ value }: { value: number }) {
  const cls =
    value >= 95 ? 'text-green-600' :
    value >= 80 ? 'text-amber-600' :
    'text-red-600';
  return <span className={`font-semibold tabular-nums ${cls}`}>{value.toFixed(1)}%</span>;
}

function SourceBadge({ hasRealData }: { hasRealData: boolean }) {
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
      hasRealData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {hasRealData ? 'API' : 'Est.'}
    </span>
  );
}

function getGoogleMapsUrl(plant: SolarPlant): string | null {
  if (Number.isFinite(plant.latitude) && Number.isFinite(plant.longitude)) {
    return `https://www.google.com/maps?q=${plant.latitude},${plant.longitude}`;
  }
  const q = plant.location?.trim();
  if (!q || q.toLowerCase() === 'localização não informada') return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
}

/* ─── Mobile card ─────────────────────────────────────── */
function PlantCard({ plant, onClick }: { plant: SolarPlant; onClick: () => void }) {
  const mapsUrl = getGoogleMapsUrl(plant);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#008ed3] hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900 text-sm">{plant.name}</p>
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#008ed3] hover:underline"
            >
              <MapPin className="size-3" />
              <span className="truncate max-w-[180px]">{plant.location}</span>
            </a>
          ) : (
            <p className="mt-0.5 text-xs text-gray-400 truncate">{plant.location}</p>
          )}
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge[plant.status]}`}>
          <span className={`size-1.5 rounded-full ${statusColors[plant.status]}`} />
          {statusLabels[plant.status]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="size-3 text-[#008ed3]" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Geração</span>
          </div>
          <p className="font-semibold text-sm text-gray-900">{plant.currentGeneration.toFixed(1)} kW</p>
          <Progress value={(plant.currentGeneration / plant.capacity) * 100} className="h-1 mt-1.5" />
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-1 mb-1">
            <Activity className="size-3 text-[#0055a3]" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Eficiência</span>
          </div>
          <EfficiencyText value={plant.efficiency} />
          <p className="text-[10px] text-gray-400 mt-1">{plant.capacity} kW cap.</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <SourceBadge hasRealData={plant.hasRealData} />
        <span className="text-[10px] text-gray-400">{plant.lastUpdate}</span>
      </div>
    </button>
  );
}

/* ─── Main component ──────────────────────────────────── */
export function PlantsTable({ plants, onSelectPlant }: PlantsTableProps) {
  const [searchTerm, setSearchTerm]       = useState("");
  const [statusFilter, setStatusFilter]   = useState<"all" | SolarPlant["status"]>("all");
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(10);

  const filteredPlants = plants.filter((plant) => {
    const matchSearch =
      plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === 'all' || String(plant.status).toLowerCase() === String(statusFilter).toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalPages    = Math.max(1, Math.ceil(filteredPlants.length / pageSize));
  const currentPage   = Math.min(page, totalPages);
  const paginated     = filteredPlants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPage = () => setPage(1);

  const statusCounts = {
    all:     plants.length,
    online:  plants.filter((p) => String(p.status) === 'online').length,
    warning: plants.filter((p) => String(p.status) === 'warning').length,
    offline: plants.filter((p) => String(p.status) === 'offline').length,
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Usinas Solares</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Clique em uma usina para ver detalhes</p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <Input
              placeholder="Buscar cliente ou local..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(['all', 'online', 'warning', 'offline'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatusFilter(s); resetPage(); }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? s === 'all'     ? 'bg-[#0055a3] text-white border-[#0055a3]'
                  : s === 'online'  ? 'bg-green-600 text-white border-green-600'
                  : s === 'warning' ? 'bg-amber-500 text-white border-amber-500'
                  :                   'bg-red-600   text-white border-red-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {s !== 'all' && (
                <span className={`size-1.5 rounded-full ${
                  s === 'online' ? 'bg-current' : s === 'warning' ? 'bg-current' : 'bg-current'
                }`} />
              )}
              {s === 'all' ? 'Todos' : statusLabels[s]}
              <span className={`rounded-full px-1.5 text-[10px] ${
                statusFilter === s ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {statusCounts[s]}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0 sm:px-6 sm:pb-6">

        {/* ── Mobile: cards ── */}
        <div className="sm:hidden flex flex-col gap-2 overflow-y-auto px-4 pb-4 flex-1">
          {paginated.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">Nenhuma usina encontrada</p>
          ) : (
            paginated.map((plant) => (
              <PlantCard key={plant.id} plant={plant} onClick={() => onSelectPlant(plant)} />
            ))
          )}
        </div>

        {/* ── Tablet / Desktop: table ── */}
        <div className="hidden sm:flex flex-col flex-1 overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-auto flex-1">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="sticky top-0 z-20 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap pl-4">
                    Cliente / Local
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right whitespace-nowrap">
                    Geração
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right whitespace-nowrap hidden md:table-cell">
                    Capacidade
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right whitespace-nowrap hidden lg:table-cell">
                    Efic. Mensal
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden xl:table-cell">
                    Meta Mensal
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 bg-gray-50 w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-gray-400">
                      Nenhuma usina encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((plant) => {
                    const mapsUrl = getGoogleMapsUrl(plant);
                    const genPct  = Math.min((plant.currentGeneration / plant.capacity) * 100, 100);
                    const monPct  = Math.min((plant.monthlyGeneration  / plant.monthlyTarget)  * 100, 100);
                    return (
                      <TableRow
                        key={plant.id}
                        className="cursor-pointer group border-l-2 border-l-transparent hover:border-l-[#008ed3] hover:bg-[#e6f4fc]/50 transition-colors"
                        onClick={() => onSelectPlant(plant)}
                      >
                        {/* Cliente / Local */}
                        <TableCell className="pl-4 py-3">
                          <p className="font-semibold text-sm text-gray-900 truncate max-w-[180px]">{plant.name}</p>
                          {mapsUrl ? (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs text-[#008ed3] hover:underline mt-0.5"
                            >
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{plant.location}</span>
                            </a>
                          ) : (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{plant.location}</p>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge[plant.status]}`}>
                            <span className={`size-1.5 rounded-full ${statusColors[plant.status]}`} />
                            {statusLabels[plant.status]}
                          </span>
                        </TableCell>

                        {/* Geração */}
                        <TableCell className="py-3 text-right whitespace-nowrap">
                          <p className="font-semibold text-sm text-gray-900">{plant.currentGeneration.toFixed(1)} kW</p>
                          <Progress value={genPct} className="h-1 w-16 ml-auto mt-1.5" />
                          <div className="flex justify-end mt-1">
                            <SourceBadge hasRealData={plant.hasRealData} />
                          </div>
                        </TableCell>

                        {/* Capacidade */}
                        <TableCell className="py-3 text-right font-medium text-sm text-gray-700 whitespace-nowrap hidden md:table-cell">
                          {plant.capacity} kW
                        </TableCell>

                        {/* Efic. Mensal */}
                        <TableCell className="py-3 text-right whitespace-nowrap hidden lg:table-cell">
                          <EfficiencyText value={plant.efficiency} />
                          <div className="flex justify-end mt-1">
                            <SourceBadge hasRealData={plant.hasRealData} />
                          </div>
                        </TableCell>

                        {/* Meta Mensal */}
                        <TableCell className="py-3 hidden xl:table-cell">
                          <div className="w-32">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{plant.monthlyGeneration.toFixed(0)}</span>
                              <span>{plant.monthlyTarget.toFixed(0)} kWh</span>
                            </div>
                            <Progress value={monPct} className="h-1.5" />
                            <p className="text-[10px] text-gray-400 mt-1">{monPct.toFixed(0)}% da meta</p>
                          </div>
                        </TableCell>

                        {/* Arrow */}
                        <TableCell className="py-3 pr-3 text-right">
                          <ArrowRight className="size-4 text-gray-300 group-hover:text-[#008ed3] transition-colors ml-auto" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── Pagination ── */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 px-4 sm:px-0">
          <span>
            {filteredPlants.length} usina{filteredPlants.length !== 1 ? 's' : ''} encontrada{filteredPlants.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' && ` · filtro: ${statusLabels[statusFilter]}`}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }}
              className="rounded border border-gray-300 px-2 py-1 text-xs bg-white"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / pág.</option>)}
            </select>
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center justify-center size-7 rounded border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="whitespace-nowrap tabular-nums">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center justify-center size-7 rounded border border-gray-300 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
