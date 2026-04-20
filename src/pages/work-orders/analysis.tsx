import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { BarChart2, Search, ChevronLeft, ChevronRight, ChevronDown, X, Pencil, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

interface WorkOrderAnalysis {
  orderId: number;
  faseId: number | null;
  solutionDescription: string | null;
  diagsJson: unknown;
  orderObservacoes: string | null;
  orderDataProgramacao: string | null;
  createdAt: string;
  updatedAt: string;
  plant: { plantName: string | null } | null;
  serviceCode: { descricao: string } | null;
  serviceReason: { descricao: string } | null;
  team: { teamNome: string } | null;
  client: { cliNameClient: string | null } | null;
}

interface DiagnosticItem { diagId: number; descricao: string; active: boolean }

const PAGE_SIZE = 10;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso; }
}

function faseBadge(faseId: number | null) {
  if (faseId === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Programado</Badge>;
  if (faseId === 2) return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Aberto</Badge>;
  if (faseId === 3) return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Concluído</Badge>;
  return <Badge variant="outline">—</Badge>;
}

function getDiags(diagsJson: unknown): string {
  if (!Array.isArray(diagsJson) || diagsJson.length === 0) return "—";
  return (diagsJson as { descricao: string }[]).map((d) => d.descricao).join(", ");
}

export default function WorkOrderAnalysisPage() {
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState<WorkOrderAnalysis[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFase, setFilterFase] = useState<string>("3"); // default: Concluído
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [editOrder, setEditOrder] = useState<WorkOrderAnalysis | null>(null);
  const [editSolution, setEditSolution] = useState("");
  const [editSelectedDiags, setEditSelectedDiags] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [woRes, diagRes] = await Promise.allSettled([
          apiFetch<{ workOrders: WorkOrderAnalysis[] }>("/work-orders"),
          apiFetch<{ diagnostics: DiagnosticItem[] }>("/diagnostics"),
        ]);
        if (woRes.status === "fulfilled") setAllOrders(woRes.value.workOrders ?? []);
        if (diagRes.status === "fulfilled") setDiagnostics((diagRes.value.diagnostics ?? []).filter((d) => d.active));
      } catch {
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = allOrders.filter((wo) => {
    if (filterFase && String(wo.faseId) !== filterFase) return false;
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      if (new Date(wo.createdAt) < from) return false;
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setDate(to.getDate() + 1);
      if (new Date(wo.createdAt) >= to) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        String(wo.orderId).includes(q) ||
        (wo.plant?.plantName ?? "").toLowerCase().includes(q) ||
        (wo.team?.teamNome ?? "").toLowerCase().includes(q) ||
        (wo.solutionDescription ?? "").toLowerCase().includes(q) ||
        getDiags(wo.diagsJson).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function openEdit(wo: WorkOrderAnalysis) {
    setEditOrder(wo);
    setEditSolution(wo.solutionDescription ?? "");
    const ids = Array.isArray(wo.diagsJson)
      ? new Set((wo.diagsJson as { diagId: number }[]).map((d) => d.diagId))
      : new Set<number>();
    setEditSelectedDiags(ids);
  }

  function toggleEditDiag(id: number) {
    setEditSelectedDiags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSaveEdit() {
    if (!editOrder) return;
    if (!editSolution.trim()) { toast.error("Preencha a solução"); return; }
    setSaving(true);
    try {
      const selectedDiags = diagnostics.filter((d) => editSelectedDiags.has(d.diagId));
      await apiFetch(`/work-orders/${editOrder.orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          solutionDescription: editSolution.trim(),
          diagsJson: selectedDiags.length > 0
            ? selectedDiags.map((d) => ({ diagId: d.diagId, descricao: d.descricao }))
            : undefined,
        }),
      });
      toast.success("Conclusão atualizada");
      setAllOrders((prev) => prev.map((wo) =>
        wo.orderId === editOrder.orderId
          ? { ...wo, solutionDescription: editSolution.trim(), diagsJson: selectedDiags.length > 0 ? selectedDiags.map((d) => ({ diagId: d.diagId, descricao: d.descricao })) : wo.diagsJson }
          : wo
      ));
      setEditOrder(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <nav className="mb-6 text-sm text-gray-500">
          <span className="font-semibold text-gray-900">Análise de Conclusão</span>
        </nav>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 sm:p-3 rounded-lg" style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}>
            <BarChart2 className="size-5 sm:size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Análise de Conclusão</h1>
            <p className="text-sm text-gray-500">Filtre e analise conclusões das ordens de serviço</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Busca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="OS, usina, solução..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fase</Label>
                <select
                  value={filterFase}
                  onChange={(e) => { setFilterFase(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
                >
                  <option value="">Todas as fases</option>
                  <option value="1">Programado</option>
                  <option value="2">Aberto</option>
                  <option value="3">Concluído</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">De</Label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Até</Label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
                />
              </div>
            </div>
            {(search || filterFase || filterDateFrom || filterDateTo) && (
              <div className="mt-3">
                <button
                  className="text-xs text-[#008ed3] hover:text-[#0055a3] flex items-center gap-1"
                  onClick={() => { setSearch(""); setFilterFase("3"); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
                >
                  <X className="size-3" /> Limpar filtros
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">Ordens de Serviço ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-gray-500 text-sm">Carregando...</div>
            ) : (
              <>
                <div className="rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">OS #</TableHead>
                        <TableHead className="text-xs">Usina</TableHead>
                        <TableHead className="text-xs">Serviço</TableHead>
                        <TableHead className="text-xs">Equipe</TableHead>
                        <TableHead className="text-xs">Fase</TableHead>
                        <TableHead className="text-xs">Solução</TableHead>
                        <TableHead className="text-xs">Diagnósticos</TableHead>
                        <TableHead className="text-xs">Data</TableHead>
                        <TableHead className="text-xs text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-gray-500 text-sm">
                            Nenhuma ordem encontrada com os filtros aplicados.
                          </TableCell>
                        </TableRow>
                      ) : paged.map((wo) => (
                        <TableRow key={wo.orderId} className="text-xs hover:bg-gray-50">
                          <TableCell className="font-semibold text-[#008ed3]">#{wo.orderId}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{wo.plant?.plantName ?? "—"}</TableCell>
                          <TableCell className="max-w-[100px] truncate">{wo.serviceCode?.descricao ?? "—"}</TableCell>
                          <TableCell>{wo.team?.teamNome ?? "—"}</TableCell>
                          <TableCell>{faseBadge(wo.faseId)}</TableCell>
                          <TableCell className="max-w-[160px]">
                            <span className="line-clamp-2 text-gray-700">{wo.solutionDescription ?? "—"}</span>
                          </TableCell>
                          <TableCell className="max-w-[160px]">
                            <span className="line-clamp-2 text-gray-700">{getDiags(wo.diagsJson)}</span>
                          </TableCell>
                          <TableCell>{formatDate(wo.createdAt)}</TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => openEdit(wo)}
                              className="p-1.5 hover:bg-[#e6f4fc] rounded-lg transition-colors"
                              title="Editar conclusão"
                            >
                              <Pencil className="size-3.5 text-[#008ed3]" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Página {currentPage} de {totalPages} — {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit conclusion modal */}
      <Dialog open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Conclusão — OS #{editOrder?.orderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-solution">Solução Aplicada <span className="text-red-500">*</span></Label>
              <textarea
                id="edit-solution"
                rows={4}
                value={editSolution}
                onChange={(e) => setEditSolution(e.target.value)}
                placeholder="Descreva a solução..."
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40 resize-none"
              />
            </div>
            <div>
              <Label className="mb-2 block">Diagnósticos</Label>
              {diagnostics.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhum diagnóstico cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-3">
                  {diagnostics.map((d) => (
                    <label
                      key={d.diagId}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors text-xs ${
                        editSelectedDiags.has(d.diagId)
                          ? "border-[#008ed3] bg-[#e6f4fc] text-[#0055a3]"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editSelectedDiags.has(d.diagId)}
                        onChange={() => toggleEditDiag(d.diagId)}
                        className="accent-[#008ed3] shrink-0"
                      />
                      <span>{d.descricao}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditOrder(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="text-white" style={{ background: saving ? "#94a3b8" : "linear-gradient(135deg, #00a971, #007a52)" }}>
                <CheckCircle2 className="size-4 mr-1" />
                {saving ? "Salvando..." : "Salvar Conclusão"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
