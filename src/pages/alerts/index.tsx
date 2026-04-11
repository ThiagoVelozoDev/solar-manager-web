import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ChevronsUpDown, CircleAlert, Clock, Filter, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

interface AlarmItem {
  id: number;
  providerId: string;
  externalAlarmId: string;
  stationId: string | null;
  stationName: string | null;
  inverterSn: string | null;
  alarmCode: string | null;
  alarmLevel: string | null;
  alarmType: string | null;
  status: string | null;
  message: string | null;
  messagePt: string | null;
  happenedAt: string | null;
  lastSeenAt: string;
  resolvedAt: string | null;
  isActive: boolean;
  rawJson?: {
    alarmBeginTime?: string | number | null;
    alarmEndTime?: string | number | null;
    alarmTime?: string | number | null;
    happenedAt?: string | number | null;
    updateTime?: string | number | null;
  } | null;
}

type AlarmSortKey = 'alarmLevel' | 'stationName' | 'inverterSn' | 'alarmCode' | 'message' | 'messagePt' | 'status' | 'duration' | 'happenedAt';
type SortDirection = 'asc' | 'desc';
type AlarmStatusFilter = 'all' | 'active' | 'resolved';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const AUTO_REFRESH_SECONDS = 60;

interface AlarmResponse {
  summary: {
    total: number;
    active: number;
    critical: number;
    warning: number;
  };
  items: AlarmItem[];
}

const levelStyle = (value: string | null) => {
  const text = (value ?? '').toLowerCase();
  if (text.includes('critical') || text === '3') return 'bg-red-100 text-red-700 border-red-200';
  if (text.includes('warn') || text === '2') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<AlarmItem[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [stationFilter, setStationFilter] = useState('all');
  const [messagePtFilter, setMessagePtFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<AlarmStatusFilter>('all');
  const [happenedDateFilter, setHappenedDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortKey, setSortKey] = useState<AlarmSortKey>('happenedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const countdownRef = useRef(AUTO_REFRESH_SECONDS);

  const resetCountdown = () => {
    countdownRef.current = AUTO_REFRESH_SECONDS;
    setCountdown(AUTO_REFRESH_SECONDS);
  };

  const fetchAlarms = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);
    try {
      const query = new URLSearchParams({
        limit: '300',
        active: 'false',
      });
      const response = await apiFetch<AlarmResponse>(`/alerts?${query.toString()}`);
      setItems(response.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar os alarmes';
      toast.error(message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const triggerSyncAndRefresh = async () => {
    try {
      await apiFetch('/sync/trigger', { method: 'POST' });
      toast.success('Sincronização adicionada na fila. Atualizando alarmes em alguns segundos...');
      setTimeout(() => {
        void fetchAlarms(false);
        resetCountdown();
      }, 4000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível disparar sincronização';
      toast.error(message);
    }
  };

  useEffect(() => {
    void fetchAlarms();
  }, []);

  useEffect(() => {
    resetCountdown();
    const interval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        countdownRef.current = AUTO_REFRESH_SECONDS;
        setCountdown(AUTO_REFRESH_SECONDS);
        void fetchAlarms(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, levelFilter, stationFilter, messagePtFilter, statusFilter, happenedDateFilter, rowsPerPage]);

  const parseAlarmDate = (value: unknown): Date | null => {
    if (value === null || value === undefined) return null;
    const parsed = new Date(value as string | number | Date);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  };

  const getAlarmDurationMs = (item: AlarmItem): number | null => {
    const start =
      parseAlarmDate(item.rawJson?.alarmBeginTime) ??
      parseAlarmDate(item.rawJson?.alarmTime) ??
      parseAlarmDate(item.rawJson?.happenedAt) ??
      parseAlarmDate(item.happenedAt) ??
      parseAlarmDate(item.lastSeenAt);

    if (!start) return null;

    const end =
      parseAlarmDate(item.rawJson?.alarmEndTime) ??
      parseAlarmDate(item.rawJson?.updateTime) ??
      parseAlarmDate(item.resolvedAt) ??
      (item.isActive ? new Date() : parseAlarmDate(item.lastSeenAt));

    if (!end) return null;

    return Math.max(0, end.getTime() - start.getTime());
  };

  const formatDuration = (durationMs: number | null): string => {
    if (durationMs === null) return '-';
    const totalSeconds = Math.floor(durationMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getSortableValue = (item: AlarmItem, key: AlarmSortKey): string | number => {
    if (key === 'happenedAt') {
      const timestamp = new Date(item.happenedAt ?? item.lastSeenAt).getTime();
      return Number.isFinite(timestamp) ? timestamp : 0;
    }

    if (key === 'duration') {
      return getAlarmDurationMs(item) ?? 0;
    }

    return String(item[key] ?? '').toLowerCase();
  };

  const stationOptions = useMemo(() => {
    const options = Array.from(new Set(items.map((item) => (item.stationName ?? item.stationId ?? '').trim()).filter(Boolean)));
    return options.sort((left, right) => left.localeCompare(right, 'pt-BR'));
  }, [items]);

  const messagePtOptions = useMemo(() => {
    const options = Array.from(new Set(items.map((item) => (item.messagePt ?? '').trim()).filter(Boolean)));
    return options.sort((left, right) => left.localeCompare(right, 'pt-BR'));
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      if (levelFilter !== 'all') {
        const level = (item.alarmLevel ?? '').toLowerCase();
        if (levelFilter === 'critical' && !(level.includes('critical') || level === '3')) return false;
        if (levelFilter === 'warning' && !(level.includes('warn') || level === '2')) return false;
        if (levelFilter === 'info' && (level.includes('critical') || level.includes('warn') || level === '3' || level === '2')) return false;
      }

      if (stationFilter !== 'all') {
        const stationValue = (item.stationName ?? item.stationId ?? '').trim();
        if (stationValue !== stationFilter) return false;
      }

      if (messagePtFilter !== 'all') {
        const messagePtValue = (item.messagePt ?? '').trim();
        if (messagePtValue !== messagePtFilter) return false;
      }

      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'resolved' && item.isActive) return false;

      if (happenedDateFilter) {
        const happenedAtDate = new Date(item.happenedAt ?? item.lastSeenAt);
        const happenedAtKey = Number.isFinite(happenedAtDate.getTime()) ? happenedAtDate.toISOString().slice(0, 10) : '';
        if (happenedAtKey !== happenedDateFilter) return false;
      }

      if (!term) return true;

      const blob = [
        item.stationName,
        item.stationId,
        item.inverterSn,
        item.alarmCode,
        item.message,
        item.messagePt,
        item.status,
      ].join(' ').toLowerCase();

      return blob.includes(term);
    });
  }, [items, levelFilter, stationFilter, messagePtFilter, statusFilter, happenedDateFilter, search]);

  const sortedItems = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const copy = [...filteredItems];
    copy.sort((left, right) => {
      const a = getSortableValue(left, sortKey);
      const b = getSortableValue(right, sortKey);

      if (typeof a === 'number' && typeof b === 'number') {
        return (a - b) * direction;
      }

      return String(a).localeCompare(String(b), 'pt-BR') * direction;
    });
    return copy;
  }, [filteredItems, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / rowsPerPage));

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedItems]);

  const toggleSort = (key: AlarmSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  const SortIcon = ({ column }: { column: AlarmSortKey }) => {
    if (sortKey !== column) return <ChevronsUpDown className="ml-1 inline size-3 text-gray-400" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="ml-1 inline size-3 text-blue-600" />
      : <ChevronDown className="ml-1 inline size-3 text-blue-600" />;
  };

  const clearFilters = () => {
    setSearch('');
    setLevelFilter('all');
    setStationFilter('all');
    setMessagePtFilter('all');
    setStatusFilter('all');
    setHappenedDateFilter('');
    setPage(1);
  };

  const summary = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.isActive).length,
    critical: items.filter((item) => ((item.alarmLevel ?? '').toLowerCase().includes('critical') || item.alarmLevel === '3')).length,
    warning: items.filter((item) => ((item.alarmLevel ?? '').toLowerCase().includes('warn') || item.alarmLevel === '2')).length,
  }), [items]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Alarmes</h1>
          <p className="text-sm text-gray-600">Monitore alarmes ativos e histórico recebido da API Solis.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            <Clock className="size-4 shrink-0" />
            <span>
              Atualiza em{' '}
              <span className={`font-semibold tabular-nums ${countdown <= 10 ? 'text-amber-600' : 'text-gray-700'}`}>
                {countdown}s
              </span>
            </span>
          </div>
          <button
            onClick={triggerSyncAndRefresh}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sincronizar agora
          </button>
          <button
            onClick={() => { void fetchAlarms(false); resetCountdown(); }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Total</p>
          <p className="text-2xl font-semibold text-gray-900">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-emerald-700">Ativos</p>
          <p className="text-2xl font-semibold text-emerald-700">{summary.active}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs uppercase text-red-700">Críticos</p>
          <p className="text-2xl font-semibold text-red-700">{summary.critical}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase text-amber-700">Avisos</p>
          <p className="text-2xl font-semibold text-amber-700">{summary.warning}</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por usina, inversor, código ou mensagem..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-gray-500" />
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value as 'all' | 'critical' | 'warning' | 'info')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Todos os níveis</option>
                <option value="critical">Crítico</option>
                <option value="warning">Aviso</option>
                <option value="info">Informativo</option>
              </select>
            </div>
            <select
              value={stationFilter}
              onChange={(event) => setStationFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Todas as usinas</option>
              {stationOptions.map((station) => (
                <option key={station} value={station}>{station}</option>
              ))}
            </select>
            <select
              value={messagePtFilter}
              onChange={(event) => setMessagePtFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Todas as mensagens (PT)</option>
              {messagePtOptions.map((messagePt) => (
                <option key={messagePt} value={messagePt}>{messagePt}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AlarmStatusFilter)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="resolved">Resolvido</option>
            </select>
            <input
              type="date"
              value={happenedDateFilter}
              onChange={(event) => setHappenedDateFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              title="Data do ocorrido"
              aria-label="Data do ocorrido"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">Carregando alarmes...</div>
          ) : sortedItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">Nenhum alarme encontrado com os filtros atuais.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  {([
                    ['alarmLevel', 'Nível'],
                    ['stationName', 'Usina'],
                    ['inverterSn', 'Inversor'],
                    ['alarmCode', 'Código'],
                    ['message', 'Mensagem original'],
                    ['messagePt', 'Mensagem (PT)'],
                    ['status', 'Status'],
                    ['duration', 'Duração'],
                    ['happenedAt', 'Ocorrido em'],
                  ] as [AlarmSortKey, string][]).map(([col, label]) => (
                    <th key={col} className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 transition hover:bg-gray-200 ${
                          sortKey === col ? 'font-semibold text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        {label}
                        <SortIcon column={col} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${levelStyle(item.alarmLevel)}`}>
                        <CircleAlert className="size-3" />
                        {item.alarmLevel ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.stationName ?? item.stationId ?? 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-700">{item.inverterSn ?? '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{item.alarmCode ?? '-'}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[460px]">
                      <span className="line-clamp-2">{item.message ?? '-'}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 max-w-[460px]">
                      <span className="line-clamp-2">{item.messagePt ?? '-'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${item.isActive ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.isActive ? 'Ativo' : 'Resolvido'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{formatDuration(getAlarmDurationMs(item))}</td>
                    <td className="px-3 py-2 text-gray-600">{new Date(item.happenedAt ?? item.lastSeenAt).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && sortedItems.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 text-xs text-gray-600 md:flex-row md:items-center md:justify-between">
            <div>
              Exibindo {pageRows.length} de {sortedItems.length} registro(s)
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="rowsPerPage" className="text-xs">Linhas por página</label>
              <select
                id="rowsPerPage"
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded border border-gray-300 px-2 py-1"
              >
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <button
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50"
              >
                Anterior
              </button>
              <span>Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4" />
          <p>
            Os alarmes são ingeridos automaticamente no ciclo de sincronização. Se sua conta Solis expor novos campos,
            eles também ficam salvos em raw_json no banco para análise técnica.
          </p>
        </div>
      </div>
    </div>
  );
}
