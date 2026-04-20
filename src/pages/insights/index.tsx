import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, BrainCircuit, ChevronDown, ChevronUp, Clock3, Lightbulb, MapPin, RefreshCw, Search, ShieldAlert, TrendingDown, Wrench, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

type InsightSeverity = 'info' | 'alerta' | 'critico';
type InsightCategory = 'performance' | 'operacional' | 'alarmes' | 'financeiro' | 'manutencao' | 'sla';

interface InsightsResponse {
  generatedAt: string;
  cache: {
    status: string;
    lastRunAt: string | null;
    nextRefreshInSec: number;
  };
  summary: {
    totalActive: number;
    critical: number;
    alert: number;
    info: number;
    estimatedLoss: number;
    affectedPlants: number;
  };
  filters: {
    companies: Array<{ id: number; name: string }>;
    plants: Array<{ id: number; name: string; companyId: number | null }>;
    inverters: Array<{ sn: string; label: string; plantId: number | null }>;
  };
  insights: Array<{
    id: number;
    fingerprint: string;
    title: string;
    description: string;
    recommendation: string;
    plainLanguage: string | null;
    severity: InsightSeverity;
    category: InsightCategory;
    scopeType: 'portfolio' | 'plant' | 'inverter';
    scopeKey: string;
    plantId: number | null;
    inverterSn: string | null;
    stationId: string | null;
    companyId: number | null;
    companyName: string | null;
    providerId: string | null;
    dataSource: 'api' | 'cadastro' | 'calculated';
    riskScore: number;
    estimatedLoss: number | null;
    availabilityPct: number | null;
    expectedValue: number | null;
    actualValue: number | null;
    metricValue: number | null;
    metricUnit: string | null;
    lastDetectedAt: string;
    details: Record<string, unknown> | null;
  }>;
  history: Array<{
    id: number;
    title: string;
    severity: InsightSeverity;
    category: InsightCategory;
    status: string;
    scopeType: 'portfolio' | 'plant' | 'inverter';
    scopeKey: string;
    plantId: number | null;
    inverterSn: string | null;
    recommendation: string;
    dataSource: 'api' | 'cadastro' | 'calculated';
    occurrenceCount: number;
    estimatedLoss: number | null;
    lastDetectedAt: string;
    resolvedAt: string | null;
  }>;
}

const categoryLabels: Record<InsightCategory, string> = {
  performance: 'Performance',
  operacional: 'Operacional',
  alarmes: 'Alarmes Inteligentes',
  financeiro: 'Financeiro',
  manutencao: 'Manutenção',
  sla: 'SLA',
};

const severityOrder: Record<InsightSeverity, number> = { critico: 3, alerta: 2, info: 1 };

const severityLabels: Record<InsightSeverity, string> = {
  info: 'Info',
  alerta: 'Alerta',
  critico: 'Crítico',
};

const severityClasses: Record<InsightSeverity, string> = {
  info: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  alerta: 'border-amber-200 bg-amber-50/80 text-amber-700',
  critico: 'border-red-200 bg-red-50/80 text-red-700',
};

const sourceLabels = {
  api: 'API',
  cadastro: 'Cadastro',
  calculated: 'Analisado',
};

const sourceClasses = {
  api: 'bg-blue-100 text-blue-700',
  cadastro: 'bg-slate-100 text-slate-700',
  calculated: 'bg-violet-100 text-violet-700',
};

const summaryCards = [
  { key: 'critical', label: 'Críticos', icon: ShieldAlert, color: 'bg-red-500' },
  { key: 'alert', label: 'Alertas', icon: AlertTriangle, color: 'bg-amber-500' },
  { key: 'info', label: 'Informativos', icon: Lightbulb, color: 'bg-emerald-500' },
  { key: 'affectedPlants', label: 'Usinas impactadas', icon: Wrench, color: 'bg-sky-500' },
  { key: 'estimatedLoss', label: 'Perda estimada', icon: TrendingDown, color: 'bg-rose-500' },
] as const;

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
}).format(value);

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
};

export default function InsightsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [plantFilter, setPlantFilter] = useState('all');
  const [inverterFilter, setInverterFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | InsightSeverity>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | InsightCategory>('all');
  const [expandedPlants, setExpandedPlants] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(60);
  const countdownRef = useRef(60);

  const togglePlant = (key: string) => {
    setExpandedPlants((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const resetCountdown = (nextValue?: number) => {
    const value = Math.max(1, nextValue ?? 60);
    countdownRef.current = value;
    setCountdown(value);
  };

  const fetchInsights = async (showSpinner = true, forceRefresh = false) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);

    try {
      const query = new URLSearchParams();
      if (forceRefresh) query.set('refresh', 'true');
      const response = await apiFetch<InsightsResponse>(`/insights${query.size ? `?${query.toString()}` : ''}`);
      setData(response);
      resetCountdown(response.cache.nextRefreshInSec || 60);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar os insights inteligentes';
      toast.error(message);
    } finally {
      setRefreshing(false);
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInsights();
  }, []);

  useEffect(() => {
    if (!data) return;

    const interval = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        resetCountdown(data.cache.nextRefreshInSec || 60);
        void fetchInsights(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.cache.lastRunAt]);

  const visibleInverters = useMemo(() => {
    if (!data) return [];
    if (plantFilter === 'all') return data.filters.inverters;
    return data.filters.inverters.filter((item) => String(item.plantId ?? '') === plantFilter);
  }, [data, plantFilter]);

  const visiblePlants = useMemo(() => {
    if (!data) return [];
    if (companyFilter === 'all') return data.filters.plants;
    return data.filters.plants.filter((p) => String(p.companyId ?? '') === companyFilter);
  }, [data, companyFilter]);

  useEffect(() => {
    if (plantFilter !== 'all' && !visiblePlants.some((p) => String(p.id) === plantFilter)) {
      setPlantFilter('all');
    }
  }, [plantFilter, visiblePlants]);

  useEffect(() => {
    if (inverterFilter !== 'all' && !visibleInverters.some((item) => item.sn === inverterFilter)) {
      setInverterFilter('all');
    }
  }, [inverterFilter, visibleInverters]);

  const filteredInsights = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();

    return data.insights.filter((insight) => {
      if (companyFilter !== 'all' && String(insight.companyId ?? '') !== companyFilter) return false;
      if (plantFilter !== 'all' && String(insight.plantId ?? '') !== plantFilter) return false;
      if (inverterFilter !== 'all' && insight.inverterSn !== inverterFilter) return false;
      if (severityFilter !== 'all' && insight.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && insight.category !== categoryFilter) return false;
      if (!term) return true;

      const haystack = [
        insight.title,
        insight.description,
        insight.recommendation,
        insight.plainLanguage,
        insight.scopeKey,
      ].join(' ').toLowerCase();

      return haystack.includes(term);
    });
  }, [data, search, companyFilter, plantFilter, inverterFilter, severityFilter, categoryFilter]);

  const insightsByPlant = useMemo(() => {
    type InsightItem = typeof filteredInsights[number];
    const groups = new Map<string, { plantId: number | null; plantName: string; providerId: string | null; insights: InsightItem[] }>();

    for (const insight of filteredInsights) {
      const key = insight.plantId !== null ? String(insight.plantId) : 'sem-usina';
      const plantEntry = data?.filters.plants.find((p) => p.id === insight.plantId);
      const plantName = plantEntry?.name ?? (insight.stationId ? `Estação ${insight.stationId}` : 'Portfólio / sem usina');
      const providerId = insight.providerId ?? null;
      if (!groups.has(key)) groups.set(key, { plantId: insight.plantId, plantName, providerId, insights: [] });
      groups.get(key)!.insights.push(insight);
    }

    return [...groups.values()].sort((a, b) => {
      const topSeverity = (items: InsightItem[]) =>
        items.reduce((max, i) => Math.max(max, severityOrder[i.severity]), 0);
      return topSeverity(b.insights) - topSeverity(a.insights) || a.plantName.localeCompare(b.plantName, 'pt-BR');
    });
  }, [filteredInsights, data]);

  const filteredHistory = useMemo(() => {
    if (!data) return [];
    return data.history.filter((item) => {
      if (companyFilter !== 'all') {
        const plant = data.filters.plants.find((p) => p.id === item.plantId);
        if (String(plant?.companyId ?? '') !== companyFilter) return false;
      }
      if (plantFilter !== 'all' && String(item.plantId ?? '') !== plantFilter) return false;
      if (inverterFilter !== 'all' && item.inverterSn !== inverterFilter) return false;
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      return true;
    });
  }, [data, companyFilter, plantFilter, inverterFilter, severityFilter, categoryFilter]);

  return (
    <div className="space-y-6 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_#fffef7,_#f8fafc)] p-1">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <BrainCircuit className="size-4" />
            Insights Inteligentes
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Analista automático das plantas solares</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Esta página transforma dados da API, histórico, alarmes e desempenho dos inversores em decisões acionáveis para operação, manutenção e receita.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm backdrop-blur">
            <Clock3 className="size-4" />
            <span>
              Atualiza em <span className={`font-semibold tabular-nums ${countdown <= 10 ? 'text-amber-600' : 'text-slate-800'}`}>{countdown}s</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void fetchInsights(false, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar insights
          </button>
        </div>
      </header>

      {loading && !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Gerando insights inteligentes...
        </div>
      ) : null}

      {data ? (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              const value = card.key === 'estimatedLoss'
                ? formatCurrency(data.summary.estimatedLoss)
                : String(data.summary[card.key]);

              return (
                <div key={card.key} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
                    </div>
                    <div className={`rounded-xl ${card.color} p-2 text-white shadow-sm`}>
                      <Icon className="size-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_repeat(5,minmax(0,1fr))]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar insight, causa ou ação recomendada..."
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#008ed3]"
                />
              </div>
              <select
                value={companyFilter}
                onChange={(event) => { setCompanyFilter(event.target.value); setPlantFilter('all'); setInverterFilter('all'); }}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="all">Todos os clientes</option>
                {(data.filters.companies ?? []).map((company) => (
                  <option key={company.id} value={String(company.id)}>{company.name}</option>
                ))}
              </select>
              <select
                value={plantFilter}
                onChange={(event) => setPlantFilter(event.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="all">Todas as plantas</option>
                {visiblePlants.map((plant) => (
                  <option key={plant.id} value={String(plant.id)}>{plant.name}</option>
                ))}
              </select>
              <select
                value={inverterFilter}
                onChange={(event) => setInverterFilter(event.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="all">Todos os inversores</option>
                {visibleInverters.map((inverter) => (
                  <option key={inverter.sn} value={inverter.sn}>{inverter.label}</option>
                ))}
              </select>
              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value as 'all' | InsightSeverity)}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="all">Todas as severidades</option>
                <option value="critico">Crítico</option>
                <option value="alerta">Alerta</option>
                <option value="info">Info</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as 'all' | InsightCategory)}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="all">Todas as categorias</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Última análise concluída em {formatDateTime(data.cache.lastRunAt)}.
            </div>
          </section>

          <section className="space-y-4">
            {insightsByPlant.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500">
                Nenhum insight encontrado com os filtros atuais.
              </div>
            ) : null}

            {insightsByPlant.map((group) => {
              const key = group.plantId !== null ? String(group.plantId) : 'sem-usina';
              const isExpanded = expandedPlants.has(key);
              const critical = group.insights.filter((i) => i.severity === 'critico').length;
              const alert = group.insights.filter((i) => i.severity === 'alerta').length;
              const info = group.insights.filter((i) => i.severity === 'info').length;
              const topSeverity: InsightSeverity = critical > 0 ? 'critico' : alert > 0 ? 'alerta' : 'info';

              return (
                <div key={key} className={`rounded-2xl border shadow-sm ${severityClasses[topSeverity]}`}>
                  {/* Plant header card */}
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-white/80 p-2 shadow-sm">
                        <MapPin className="size-5 text-slate-700" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">{group.plantName}</h2>
                          {group.providerId ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-sky-700 shadow-sm">
                              <Zap className="size-3" />
                              {group.providerId}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
                            {group.insights.length} {group.insights.length === 1 ? 'insight' : 'insights'}
                          </span>
                        </div>

                        {/* Severity badges */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {critical > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                              <ShieldAlert className="size-3" />
                              {critical} crítico{critical > 1 ? 's' : ''}
                            </span>
                          )}
                          {alert > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                              <AlertTriangle className="size-3" />
                              {alert} alerta{alert > 1 ? 's' : ''}
                            </span>
                          )}
                          {info > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              <Lightbulb className="size-3" />
                              {info} informativo{info > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* List of insight titles */}
                        <ul className="mt-3 space-y-1">
                          {group.insights.map((insight) => (
                            <li key={insight.fingerprint} className="flex items-center gap-2 text-sm text-slate-700">
                              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${
                                insight.severity === 'critico' ? 'bg-red-500' :
                                insight.severity === 'alerta' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              {insight.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePlant(key)}
                      className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-4" />
                          Ocultar detalhes
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-4" />
                          Ver detalhes
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded detailed cards */}
                  {isExpanded && (
                    <div className="border-t border-white/60 p-5 pt-4">
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                        {group.insights.map((insight) => (
                          <article key={insight.fingerprint} className={`rounded-2xl border p-5 shadow-sm ${severityClasses[insight.severity]}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    {severityLabels[insight.severity]}
                                  </span>
                                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium">
                                    {categoryLabels[insight.category]}
                                  </span>
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${sourceClasses[insight.dataSource]}`}>
                                    {sourceLabels[insight.dataSource]}
                                  </span>
                                </div>
                                <h3 className="mt-3 text-lg font-semibold text-slate-900">{insight.title}</h3>
                                <p className="mt-2 text-sm text-slate-700">{insight.description}</p>
                              </div>
                              <div className="rounded-xl bg-white/80 px-3 py-2 text-right text-xs text-slate-500 shadow-sm">
                                <div>Risco</div>
                                <div className="text-lg font-semibold text-slate-900">{insight.riskScore}</div>
                              </div>
                            </div>

                            {insight.plainLanguage ? (
                              <div className="mt-4 rounded-xl border border-white/70 bg-white/70 p-3 text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Leitura rápida:</span> {insight.plainLanguage}
                              </div>
                            ) : null}

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                              <div className="rounded-xl bg-white/70 p-3">
                                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Escopo</div>
                                <div className="mt-1 font-medium text-slate-900">{insight.scopeType === 'inverter' ? (insight.inverterSn ?? insight.scopeKey) : `Planta ${insight.plantId ?? insight.scopeKey}`}</div>
                              </div>
                              <div className="rounded-xl bg-white/70 p-3">
                                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Última detecção</div>
                                <div className="mt-1 font-medium text-slate-900">{formatDateTime(insight.lastDetectedAt)}</div>
                              </div>
                              {insight.metricValue !== null ? (
                                <div className="rounded-xl bg-white/70 p-3">
                                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Indicador</div>
                                  <div className="mt-1 font-medium text-slate-900">{insight.metricValue.toFixed(1)} {insight.metricUnit ?? ''}</div>
                                </div>
                              ) : null}
                              {insight.estimatedLoss !== null ? (
                                <div className="rounded-xl bg-white/70 p-3">
                                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Perda estimada</div>
                                  <div className="mt-1 font-medium text-slate-900">{formatCurrency(insight.estimatedLoss)}</div>
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 rounded-xl border border-dashed border-white/80 bg-white/70 p-4">
                              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Ação recomendada</div>
                              <p className="mt-2 text-sm font-medium text-slate-900">{insight.recommendation}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {insight.plantId ? (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/dashboard?plantId=${insight.plantId}`)}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Abrir usina no dashboard
                                  </button>
                                ) : null}
                                {insight.inverterSn ? (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/dashboard?inverterSn=${encodeURIComponent(insight.inverterSn!)}`)}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Abrir inversor no dashboard
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Histórico de insights</h2>
                <p className="text-sm text-slate-500">Registro persistido de achados ativos e resolvidos para auditoria, manutenção e aprendizado operacional.</p>
              </div>
              <div className="text-sm text-slate-500">{filteredHistory.length} registros</div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Insight</th>
                    <th className="px-3 py-3">Categoria</th>
                    <th className="px-3 py-3">Severidade</th>
                    <th className="px-3 py-3">Origem</th>
                    <th className="px-3 py-3">Recorrência</th>
                    <th className="px-3 py-3">Última detecção</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.recommendation}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{categoryLabels[item.category]}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityClasses[item.severity]}`}>
                          {severityLabels[item.severity]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sourceClasses[item.dataSource]}`}>
                          {sourceLabels[item.dataSource]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{item.occurrenceCount}x</td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatDateTime(item.lastDetectedAt)}
                        {item.resolvedAt ? <div className="mt-1 text-xs text-slate-400">Resolvido em {formatDateTime(item.resolvedAt)}</div> : null}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.status === 'active' ? 'Ativo' : 'Resolvido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}