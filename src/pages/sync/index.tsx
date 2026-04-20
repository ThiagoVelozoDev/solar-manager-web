import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { Clock3, RefreshCw, Activity, Database, Layers, Timer } from 'lucide-react';

interface TableProgress {
  done: number;
  expected: number;
  remaining: number;
}

interface ProviderProgress {
  provider: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  startedAt: string | null;
  updatedAt: string;
  elapsedMs: number;
  estimatedRemainingMs: number | null;
  stations: {
    done: number;
    total: number;
    remaining: number;
  };
  inverters: {
    done: number;
    totalKnown: number;
    remainingKnown: number;
  };
  tables: {
    plant: TableProgress;
    inverterMetrics: TableProgress;
    energyGeneration: TableProgress;
    alarmEvent: TableProgress;
  };
  processedUnits: number;
  knownTotalUnits: number;
  errorsCount: number;
  lastError: string | null;
}

interface ProviderRuntimeStatus {
  id: string;
  label: string;
  enabled: boolean;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRunAt: string | null;
  lastResult: {
    provider: string;
    stationsSynced: number;
    invertersSynced: number;
    tableStats: {
      plant: TableProgress;
      inverterMetrics: TableProgress;
      energyGeneration: TableProgress;
      alarmEvent: TableProgress;
    };
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    errors: string[];
    timestamp: string;
  } | null;
  progress: ProviderProgress | null;
}

interface SyncRunRow {
  id: number;
  providerId: string;
  providerLabel: string;
  triggerType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  stationsSynced: number;
  invertersSynced: number;
  errorsCount: number;
}

interface SyncErrorRow {
  id: number;
  providerId: string;
  triggerType: string | null;
  sourceRoute: string | null;
  providerRoute: string;
  scope: string;
  stationId: string | null;
  inverterSn: string | null;
  errorName: string | null;
  errorMessage: string;
  happenedAt: string;
}

interface AlarmSyncRow {
  id: number;
  stationName: string | null;
  alarmCode: string | null;
  alarmLevel: string | null;
  message: string | null;
  messagePt: string | null;
  isActive: boolean;
  happenedAt: string | null;
  lastSeenAt: string;
  resolvedAt: string | null;
  rawJson?: {
    alarmBeginTime?: string | number | null;
    alarmEndTime?: string | number | null;
    alarmTime?: string | number | null;
    happenedAt?: string | number | null;
    updateTime?: string | number | null;
  } | null;
}

interface SyncStatusResponse {
  inProgress: boolean;
  lastSync: ProviderRuntimeStatus['lastResult'] | null;
  monitor: {
    queue: {
      status: 'idle' | 'running' | 'queued';
      trigger: 'manual' | 'scheduler' | null;
      running: boolean;
      queued: boolean;
      cycleStartedAt: string | null;
      cycleFinishedAt: string | null;
      currentProviderIndex: number | null;
      totalProviders: number;
      providersCompleted: number;
      currentProviderId: string | null;
    };
    automation: {
      enabled: boolean;
      intervalMs: number;
      nextRunAt: string | null;
      lastScheduledAt: string | null;
    };
    providers: ProviderRuntimeStatus[];
    lastCompletedCycleAt: string | null;
  };
}

const RUNS_PAGE_SIZE = 8;
const ERRORS_PAGE_SIZE = 10;

type SortDirection = 'asc' | 'desc';
type RunSortKey = 'startedAt' | 'providerLabel' | 'status' | 'durationMs' | 'errorsCount';
type ErrorSortKey = 'happenedAt' | 'providerRoute' | 'scope' | 'errorMessage';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const formatDuration = (ms: number | null) => {
  if (ms === null || ms < 0) return '-';

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return '-';
  const value = new Date(iso);
  if (!Number.isFinite(value.getTime())) return '-';
  return value.toLocaleString('pt-BR');
};

const toTime = (iso: string | null) => {
  if (!iso) return null;
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : null;
};

const normalize = (value: unknown) => String(value ?? '').toLowerCase();

const parseAlarmDate = (value: unknown): Date | null => {
  if (value === null || value === undefined) return null;
  const parsed = new Date(value as string | number | Date);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const getAlarmDurationMs = (item: AlarmSyncRow): number | null => {
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

const isInDateRange = (iso: string, fromDate: string, toDate: string) => {
  const time = toTime(iso);
  if (time === null) return false;

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`).getTime();
    if (time < from) return false;
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59.999`).getTime();
    if (time > to) return false;
  }

  return true;
};

const ProgressBar = ({ done, total }: { done: number; total: number }) => {
  const percent = total > 0 ? Math.min(100, (done / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <span>{done} / {total}</span>
        <span>{percent.toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default function SyncMonitorPage() {
  const [data, setData] = useState<SyncStatusResponse | null>(null);
  const [runs, setRuns] = useState<SyncRunRow[]>([]);
  const [errors, setErrors] = useState<SyncErrorRow[]>([]);
  const [alarms, setAlarms] = useState<AlarmSyncRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [runSearch, setRunSearch] = useState('');
  const [runStatus, setRunStatus] = useState('all');
  const [runFromDate, setRunFromDate] = useState('');
  const [runToDate, setRunToDate] = useState('');
  const [runsPage, setRunsPage] = useState(1);
  const [runsPageSize, setRunsPageSize] = useState(RUNS_PAGE_SIZE);
  const [runSortKey, setRunSortKey] = useState<RunSortKey>('startedAt');
  const [runSortDirection, setRunSortDirection] = useState<SortDirection>('desc');

  const [errorSearch, setErrorSearch] = useState('');
  const [errorScope, setErrorScope] = useState('all');
  const [errorFromDate, setErrorFromDate] = useState('');
  const [errorToDate, setErrorToDate] = useState('');
  const [errorsPage, setErrorsPage] = useState(1);
  const [errorsPageSize, setErrorsPageSize] = useState(ERRORS_PAGE_SIZE);
  const [errorSortKey, setErrorSortKey] = useState<ErrorSortKey>('happenedAt');
  const [errorSortDirection, setErrorSortDirection] = useState<SortDirection>('desc');

  const fetchStatus = async (silent = false) => {
    if (!silent) setRefreshing(true);

    try {
      const response = await apiFetch<SyncStatusResponse>('/sync/status');
      setData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao consultar status da sincronização';
      toast.error(message);
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  const fetchAudit = async () => {
    try {
      const [runsResponse, errorsResponse, alarmsResponse] = await Promise.all([
        apiFetch<{ items: SyncRunRow[] }>('/sync/runs?limit=200'),
        apiFetch<{ items: SyncErrorRow[] }>('/sync/errors?limit=500'),
        apiFetch<{ items: AlarmSyncRow[] }>('/alerts?limit=20&active=false'),
      ]);
      setRuns(runsResponse.items ?? []);
      setErrors(errorsResponse.items ?? []);
      setAlarms(alarmsResponse.items ?? []);
    } catch (error) {
      console.error('Erro ao consultar auditoria de sincronização:', error);
    }
  };

  const triggerNow = async () => {
    try {
      await apiFetch('/sync/trigger', { method: 'POST' });
      toast.success('Sincronização adicionada na fila com sucesso.');
      await Promise.all([fetchStatus(true), fetchAudit()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível iniciar sincronização manual';
      toast.error(message);
    }
  };

  useEffect(() => {
    void Promise.all([fetchStatus(true), fetchAudit()]);

    const statusInterval = setInterval(() => {
      void fetchStatus(true);
    }, 2000);

    const auditInterval = setInterval(() => {
      void fetchAudit();
    }, 10000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(auditInterval);
    };
  }, []);

  useEffect(() => setRunsPage(1), [runSearch, runStatus, runFromDate, runToDate, runsPageSize]);
  useEffect(() => setErrorsPage(1), [errorSearch, errorScope, errorFromDate, errorToDate, errorsPageSize]);

  const currentProvider = useMemo(() => {
    if (!data?.monitor.queue.currentProviderId) return null;
    return data.monitor.providers.find((provider) => provider.id === data.monitor.queue.currentProviderId) ?? null;
  }, [data]);

  const providerProgress = currentProvider?.progress;

  const nowRemainingMs = useMemo(() => {
    if (!data?.monitor.automation.nextRunAt) return null;
    const target = new Date(data.monitor.automation.nextRunAt).getTime();
    const diff = target - Date.now();
    return diff > 0 ? diff : 0;
  }, [data]);

  const filteredRuns = useMemo(() => {
    const term = normalize(runSearch.trim());

    return runs.filter((run) => {
      if (runStatus !== 'all' && normalize(run.status) !== normalize(runStatus)) return false;
      if (runFromDate || runToDate) {
        if (!isInDateRange(run.startedAt, runFromDate, runToDate)) return false;
      }

      if (!term) return true;

      const blob = [
        run.providerLabel,
        run.providerId,
        run.triggerType,
        run.status,
        run.startedAt,
      ].join(' ');
      return normalize(blob).includes(term);
    });
  }, [runs, runSearch, runStatus, runFromDate, runToDate]);

  const filteredErrors = useMemo(() => {
    const term = normalize(errorSearch.trim());

    return errors.filter((errorRow) => {
      if (errorScope !== 'all' && normalize(errorRow.scope) !== normalize(errorScope)) return false;
      if (errorFromDate || errorToDate) {
        if (!isInDateRange(errorRow.happenedAt, errorFromDate, errorToDate)) return false;
      }

      if (!term) return true;

      const blob = [
        errorRow.providerRoute,
        errorRow.scope,
        errorRow.errorMessage,
        errorRow.stationId,
        errorRow.inverterSn,
      ].join(' ');
      return normalize(blob).includes(term);
    });
  }, [errors, errorSearch, errorScope, errorFromDate, errorToDate]);

  const sortedRuns = useMemo(() => {
    const direction = runSortDirection === 'asc' ? 1 : -1;
    const copy = [...filteredRuns];

    copy.sort((left, right) => {
      if (runSortKey === 'startedAt') {
        const a = toTime(left.startedAt) ?? 0;
        const b = toTime(right.startedAt) ?? 0;
        return (a - b) * direction;
      }

      if (runSortKey === 'durationMs') {
        return ((left.durationMs ?? 0) - (right.durationMs ?? 0)) * direction;
      }

      if (runSortKey === 'errorsCount') {
        return (left.errorsCount - right.errorsCount) * direction;
      }

      const a = String(left[runSortKey] ?? '');
      const b = String(right[runSortKey] ?? '');
      return a.localeCompare(b, 'pt-BR') * direction;
    });

    return copy;
  }, [filteredRuns, runSortDirection, runSortKey]);

  const sortedErrors = useMemo(() => {
    const direction = errorSortDirection === 'asc' ? 1 : -1;
    const copy = [...filteredErrors];

    copy.sort((left, right) => {
      if (errorSortKey === 'happenedAt') {
        const a = toTime(left.happenedAt) ?? 0;
        const b = toTime(right.happenedAt) ?? 0;
        return (a - b) * direction;
      }

      const a = String(left[errorSortKey] ?? '');
      const b = String(right[errorSortKey] ?? '');
      return a.localeCompare(b, 'pt-BR') * direction;
    });

    return copy;
  }, [filteredErrors, errorSortDirection, errorSortKey]);

  const runsTotalPages = Math.max(1, Math.ceil(sortedRuns.length / runsPageSize));
  const errorsTotalPages = Math.max(1, Math.ceil(sortedErrors.length / errorsPageSize));

  const runsPageRows = useMemo(() => {
    const start = (runsPage - 1) * runsPageSize;
    return sortedRuns.slice(start, start + runsPageSize);
  }, [sortedRuns, runsPage, runsPageSize]);

  const errorsPageRows = useMemo(() => {
    const start = (errorsPage - 1) * errorsPageSize;
    return sortedErrors.slice(start, start + errorsPageSize);
  }, [sortedErrors, errorsPage, errorsPageSize]);

  const toggleRunSort = (key: RunSortKey) => {
    if (runSortKey === key) {
      setRunSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setRunSortKey(key);
    setRunSortDirection('asc');
  };

  const toggleErrorSort = (key: ErrorSortKey) => {
    if (errorSortKey === key) {
      setErrorSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setErrorSortKey(key);
    setErrorSortDirection('asc');
  };

  const runSortIndicator = (key: RunSortKey) => {
    if (runSortKey !== key) return '';
    return runSortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const errorSortIndicator = (key: ErrorSortKey) => {
    if (errorSortKey !== key) return '';
    return errorSortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const uniqueRunStatuses = useMemo(() => Array.from(new Set(runs.map((row) => row.status))).sort(), [runs]);
  const uniqueErrorScopes = useMemo(() => Array.from(new Set(errors.map((row) => row.scope))).sort(), [errors]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 md:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acompanhamento de Sincronização</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitoramento em tempo real da fila, provedores, tabelas alimentadas e estimativa de tempo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchStatus(false)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={triggerNow}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Executar agora
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          Carregando status de sincronização...
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Fila</p>
              <div className="mt-2 flex items-center gap-2 text-gray-900">
                <Layers className="size-4 text-blue-600" />
                <span className="text-lg font-semibold">{data?.monitor.queue.status.toUpperCase()}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Provedores concluídos: {data?.monitor.queue.providersCompleted} / {data?.monitor.queue.totalProviders}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Automação</p>
              <div className="mt-2 flex items-center gap-2 text-gray-900">
                <Activity className="size-4 text-emerald-600" />
                <span className="text-lg font-semibold">{data?.monitor.automation.enabled ? 'ATIVA' : 'DESATIVADA'}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Intervalo: {formatDuration(data?.monitor.automation.intervalMs ?? null)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Próxima execução</p>
              <div className="mt-2 flex items-center gap-2 text-gray-900">
                <Clock3 className="size-4 text-indigo-600" />
                <span className="text-lg font-semibold">{formatDuration(nowRemainingMs)}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">{formatDateTime(data?.monitor.automation.nextRunAt ?? null)}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Tempo da execução atual</p>
              <div className="mt-2 flex items-center gap-2 text-gray-900">
                <Timer className="size-4 text-[#008ed3]" />
                <span className="text-lg font-semibold">{formatDuration(providerProgress?.elapsedMs ?? null)}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                ETA restante: {formatDuration(providerProgress?.estimatedRemainingMs ?? null)}
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Progresso atual do provedor</h2>

            {currentProvider ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-gray-700">
                    Provedor: <strong>{currentProvider.label}</strong> ({currentProvider.id})
                  </p>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {currentProvider.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">Estações</p>
                    <ProgressBar done={providerProgress?.stations.done ?? 0} total={providerProgress?.stations.total ?? 0} />
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">Inversores conhecidos</p>
                    <ProgressBar done={providerProgress?.inverters.done ?? 0} total={providerProgress?.inverters.totalKnown ?? 0} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Nenhum provedor em execução neste momento.</p>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Tabelas alimentadas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Tabela</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Preenchidas</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Esperado</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Faltam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Plant', value: providerProgress?.tables.plant },
                    { label: 'InverterMetrics', value: providerProgress?.tables.inverterMetrics },
                    { label: 'EnergyGeneration', value: providerProgress?.tables.energyGeneration },
                    { label: 'AlarmEvent', value: providerProgress?.tables.alarmEvent },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="px-3 py-2 font-medium text-gray-700">{row.label}</td>
                      <td className="px-3 py-2 text-gray-600">{row.value?.done ?? 0}</td>
                      <td className="px-3 py-2 text-gray-600">{row.value?.expected ?? 0}</td>
                      <td className="px-3 py-2 text-gray-600">{row.value?.remaining ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Provedores (execução serial)</h2>
              <div className="space-y-3">
                {data?.monitor.providers.map((provider) => (
                  <div key={provider.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{provider.label}</p>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-700">
                        {provider.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Última execução: {formatDateTime(provider.lastRunAt)}</p>
                    <p className="text-xs text-gray-600">Último erro: {provider.progress?.lastError ?? '-'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                <Database className="size-4" />
                Histórico do último ciclo
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>Início: {formatDateTime(data?.monitor.queue.cycleStartedAt ?? null)}</p>
                <p>Fim: {formatDateTime(data?.monitor.queue.cycleFinishedAt ?? null)}</p>
                <p>Último ciclo completo: {formatDateTime(data?.monitor.lastCompletedCycleAt ?? null)}</p>
                <p>Disparo: {data?.monitor.queue.trigger ?? '-'}</p>
                <p>Fila pendente: {data?.monitor.queue.queued ? 'Sim' : 'Não'}</p>
              </div>

              {(providerProgress?.errorsCount ?? 0) > 0 && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-medium">Erros detectados: {providerProgress?.errorsCount}</p>
                  <p className="mt-1 break-all">{providerProgress?.lastError}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Histórico de execuções (DB)</h2>

              <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                <input
                  value={runSearch}
                  onChange={(event) => setRunSearch(event.target.value)}
                  placeholder="Pesquisar provedor/status..."
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
                <select
                  value={runStatus}
                  onChange={(event) => setRunStatus(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs"
                >
                  <option value="all">Todos status</option>
                  {uniqueRunStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={runFromDate}
                  onChange={(event) => setRunFromDate(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
                <input
                  type="date"
                  value={runToDate}
                  onChange={(event) => setRunToDate(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="max-h-96 overflow-auto rounded-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleRunSort('startedAt')}>Início{runSortIndicator('startedAt')}</button></th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleRunSort('providerLabel')}>Provedor{runSortIndicator('providerLabel')}</button></th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleRunSort('status')}>Status{runSortIndicator('status')}</button></th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleRunSort('durationMs')}>Duração{runSortIndicator('durationMs')}</button></th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleRunSort('errorsCount')}>Erros{runSortIndicator('errorsCount')}</button></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {runsPageRows.map((run) => (
                      <tr key={run.id}>
                        <td className="px-3 py-2 text-gray-600">{formatDateTime(run.startedAt)}</td>
                        <td className="px-3 py-2 text-gray-700">{run.providerLabel}</td>
                        <td className="px-3 py-2 text-gray-700">{run.status}</td>
                        <td className="px-3 py-2 text-gray-600">{formatDuration(run.durationMs)}</td>
                        <td className="px-3 py-2 text-gray-600">{run.errorsCount}</td>
                      </tr>
                    ))}
                    {runsPageRows.length === 0 && (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={5}>Sem registros para os filtros atuais.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>{sortedRuns.length} registro(s)</span>
                <div className="flex items-center gap-2">
                  <label htmlFor="runsPageSize">Linhas/página</label>
                  <select
                    id="runsPageSize"
                    value={runsPageSize}
                    onChange={(event) => setRunsPageSize(Number(event.target.value))}
                    className="rounded border border-gray-300 px-2 py-1"
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setRunsPage((current) => Math.max(current - 1, 1))}
                    disabled={runsPage <= 1}
                    className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span>Página {runsPage} de {runsTotalPages}</span>
                  <button
                    onClick={() => setRunsPage((current) => Math.min(current + 1, runsTotalPages))}
                    disabled={runsPage >= runsTotalPages}
                    className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Erros estruturados (DB)</h2>

              <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                <input
                  value={errorSearch}
                  onChange={(event) => setErrorSearch(event.target.value)}
                  placeholder="Pesquisar rota, escopo, erro..."
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
                <select
                  value={errorScope}
                  onChange={(event) => setErrorScope(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs"
                >
                  <option value="all">Todos escopos</option>
                  {uniqueErrorScopes.map((scope) => (
                    <option key={scope} value={scope}>{scope}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={errorFromDate}
                  onChange={(event) => setErrorFromDate(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
                <input
                  type="date"
                  value={errorToDate}
                  onChange={(event) => setErrorToDate(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="max-h-96 overflow-auto rounded-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleErrorSort('happenedAt')}>Quando{errorSortIndicator('happenedAt')}</button></th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleErrorSort('providerRoute')}>Rota{errorSortIndicator('providerRoute')}</button></th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleErrorSort('scope')}>Escopo{errorSortIndicator('scope')}</button></th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600"><button onClick={() => toggleErrorSort('errorMessage')}>Erro{errorSortIndicator('errorMessage')}</button></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {errorsPageRows.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-2 text-gray-600">{formatDateTime(item.happenedAt)}</td>
                        <td className="px-2 py-2 text-gray-700">{item.providerRoute}</td>
                        <td className="px-2 py-2 text-gray-700">{item.scope}</td>
                        <td className="px-2 py-2 text-gray-700">{item.errorMessage}</td>
                      </tr>
                    ))}
                    {errorsPageRows.length === 0 && (
                      <tr>
                        <td className="px-2 py-3 text-gray-500" colSpan={4}>Sem registros para os filtros atuais.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>{sortedErrors.length} registro(s)</span>
                <div className="flex items-center gap-2">
                  <label htmlFor="errorsPageSize">Linhas/página</label>
                  <select
                    id="errorsPageSize"
                    value={errorsPageSize}
                    onChange={(event) => setErrorsPageSize(Number(event.target.value))}
                    className="rounded border border-gray-300 px-2 py-1"
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setErrorsPage((current) => Math.max(current - 1, 1))}
                    disabled={errorsPage <= 1}
                    className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span>Página {errorsPage} de {errorsTotalPages}</span>
                  <button
                    onClick={() => setErrorsPage((current) => Math.min(current + 1, errorsTotalPages))}
                    disabled={errorsPage >= errorsTotalPages}
                    className="rounded border border-gray-300 px-2 py-1 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Alarmes recentes (tabela alarm_event)</h2>
              <div className="max-h-80 overflow-auto rounded-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">Usina</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">Código</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">Nível</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">Status</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">Mensagem</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">Mensagem (PT)</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">Duração</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">Última captura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alarms.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-2 text-gray-700">{item.stationName ?? '-'}</td>
                        <td className="px-2 py-2 text-gray-700">{item.alarmCode ?? '-'}</td>
                        <td className="px-2 py-2 text-gray-700">{item.alarmLevel ?? '-'}</td>
                        <td className="px-2 py-2 text-gray-700">{item.isActive ? 'Ativo' : 'Resolvido'}</td>
                        <td className="px-2 py-2 text-gray-700">{item.message ?? '-'}</td>
                        <td className="px-2 py-2 text-gray-700">{item.messagePt ?? '-'}</td>
                        <td className="px-2 py-2 text-gray-600">{formatDuration(getAlarmDurationMs(item))}</td>
                        <td className="px-2 py-2 text-gray-600">{formatDateTime(item.lastSeenAt)}</td>
                      </tr>
                    ))}
                    {alarms.length === 0 && (
                      <tr>
                        <td className="px-2 py-3 text-gray-500" colSpan={8}>Nenhum alarme sincronizado até o momento.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
