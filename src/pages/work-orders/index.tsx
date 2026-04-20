import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Plus, Wrench, Trash2, ChevronLeft, ChevronRight, Search, ChevronDown, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

interface WorkOrderItem {
  orderId: number;
  faseId: number | null;
  teamId: number | null;
  orderObservacoes: string | null;
  createdAt: string;
  serviceCode: { codServId: number; descricao: string } | null;
  serviceReason: { motServId: number; descricao: string } | null;
  team: { teamId: number; teamNome: string } | null;
  plant: { plantId: number; plantName: string | null } | null;
}

interface TeamOption { teamId: number; teamNome: string; active: boolean }

const PAGE_SIZE = 8;

function faseBadge(faseId: number | null) {
  if (faseId === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Programado</Badge>;
  if (faseId === 2) return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Aberto</Badge>;
  if (faseId === 3) return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Concluído</Badge>;
  return <Badge variant="outline">—</Badge>;
}

function faseLabel(faseId: number | null): string {
  if (faseId === 1) return "Programado";
  if (faseId === 2) return "Aberto";
  if (faseId === 3) return "Concluído";
  return "";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso; }
}

// ─── Portal-based Actions Dropdown ───────────────────────────────────────────
interface ActionsDropdownProps {
  wo: WorkOrderItem;
  onDelete: (id: number) => void;
  onProgram: (wo: WorkOrderItem) => void;
}

function ActionsDropdown({ wo, onDelete, onProgram }: ActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const canConclude = wo.faseId !== 3 && wo.teamId !== null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 shadow-sm"
      >
        Ações <ChevronDown className="size-3" />
      </button>

      {open && createPortal(
        <div
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
          className="w-44 rounded-lg border border-gray-200 bg-white shadow-xl py-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
            onClick={() => {
              setOpen(false);
              if (wo.faseId === 3) {
                navigate(`/maintenance/conclusion-edit/${wo.orderId}`);
              } else {
                navigate(`/maintenance/edit/${wo.orderId}`);
              }
            }}
          >
            Editar
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
            onClick={() => { setOpen(false); navigate(`/maintenance/print/${wo.orderId}`); }}
          >
            Imprimir
          </button>
          {wo.faseId === 2 && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-yellow-50 text-yellow-700 font-medium"
              onClick={() => { setOpen(false); onProgram(wo); }}
            >
              <CalendarClock className="size-3" /> Programar
            </button>
          )}
          {wo.faseId === 1 && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-yellow-50 text-yellow-700 font-medium"
              onClick={() => { setOpen(false); onProgram(wo); }}
            >
              <CalendarClock className="size-3" /> Reprogramar
            </button>
          )}
          {canConclude && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-green-50 text-green-700 font-medium"
              onClick={() => { setOpen(false); navigate(`/maintenance/conclusion/${wo.orderId}`); }}
            >
              Conclusão
            </button>
          )}
          <div className="my-1 border-t border-gray-100" />
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600"
            onClick={() => { setOpen(false); onDelete(wo.orderId); }}
          >
            <Trash2 className="size-3" /> Excluir
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // delete dialog
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // program dialog
  const [programTarget, setProgramTarget] = useState<WorkOrderItem | null>(null);
  const [progTeamId, setProgTeamId] = useState("");
  const [progDateTime, setProgDateTime] = useState("");
  const [programming, setProgramming] = useState(false);

  useEffect(() => { loadOrders(); loadTeams(); }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await apiFetch<{ workOrders: WorkOrderItem[] }>("/work-orders");
      setWorkOrders(data.workOrders ?? []);
    } catch {
      toast.error("Erro ao carregar ordens de serviço");
    } finally {
      setLoading(false);
    }
  }

  async function loadTeams() {
    try {
      const data = await apiFetch<{ teams: TeamOption[] }>("/teams");
      setTeams((data.teams ?? []).filter((t) => t.active));
    } catch { /* non-critical */ }
  }

  function openProgram(wo: WorkOrderItem) {
    setProgramTarget(wo);
    setProgTeamId(wo.teamId ? String(wo.teamId) : "");
    // default to now + 1 day, format for datetime-local
    const dt = new Date();
    dt.setDate(dt.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    setProgDateTime(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`);
  }

  async function handleProgram() {
    if (!programTarget) return;
    if (!progTeamId) { toast.error("Selecione uma equipe"); return; }
    if (!progDateTime) { toast.error("Informe a data e hora de programação"); return; }
    setProgramming(true);
    try {
      await apiFetch(`/work-orders/${programTarget.orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          teamId: Number(progTeamId),
          orderDataProgramacao: progDateTime,
          faseId: 1,
        }),
      });
      toast.success("OS programada com sucesso");
      setProgramTarget(null);
      await loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao programar OS");
    } finally {
      setProgramming(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await apiFetch(`/work-orders/${deleteId}`, { method: "DELETE" });
      toast.success("Ordem de Serviço excluída");
      setWorkOrders((prev) => prev.filter((wo) => wo.orderId !== deleteId));
    } catch {
      toast.error("Erro ao excluir ordem de serviço");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const filtered = workOrders.filter((wo) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(wo.orderId).includes(q) ||
      (wo.plant?.plantName ?? "").toLowerCase().includes(q) ||
      (wo.team?.teamNome ?? "").toLowerCase().includes(q) ||
      faseLabel(wo.faseId).toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-gray-500">
          <span className="font-semibold text-gray-900">Ordens de Serviço</span>
        </nav>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-lg" style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}>
              <Wrench className="size-5 sm:size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Ordens de Serviço</h1>
              <p className="text-sm text-gray-500">Gerencie e acompanhe todas as ordens</p>
            </div>
          </div>
          <Button
            className="w-full sm:w-auto text-white gap-2"
            style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #0055a3, #0e457f)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #008ed3, #0055a3)"; }}
            onClick={() => navigate("/maintenance/create")}
          >
            <Plus className="size-4" /> Nova OS
          </Button>
        </div>

        <Card className="bg-white mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Buscar por OS #, usina, equipe, fase..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">Ordens de Serviço ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            {loading ? (
              <div className="py-12 text-center text-gray-500 text-sm">Carregando...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">OS #</TableHead>
                      <TableHead className="text-xs sm:text-sm">Usina</TableHead>
                      <TableHead className="text-xs sm:text-sm">Código de Serviço</TableHead>
                      <TableHead className="text-xs sm:text-sm">Motivo</TableHead>
                      <TableHead className="text-xs sm:text-sm">Fase</TableHead>
                      <TableHead className="text-xs sm:text-sm">Equipe</TableHead>
                      <TableHead className="text-xs sm:text-sm">Criado em</TableHead>
                      <TableHead className="text-xs sm:text-sm text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                          {search ? "Nenhuma ordem encontrada para a busca." : "Nenhuma ordem de serviço cadastrada."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paged.map((wo) => (
                        <TableRow key={wo.orderId} className="text-xs sm:text-sm hover:bg-gray-50">
                          <TableCell className="font-semibold text-[#008ed3]">#{wo.orderId}</TableCell>
                          <TableCell>{wo.plant?.plantName ?? "—"}</TableCell>
                          <TableCell>{wo.serviceCode?.descricao ?? "—"}</TableCell>
                          <TableCell>{wo.serviceReason?.descricao ?? "—"}</TableCell>
                          <TableCell>{faseBadge(wo.faseId)}</TableCell>
                          <TableCell>{wo.team?.teamNome ?? "—"}</TableCell>
                          <TableCell>{formatDate(wo.createdAt)}</TableCell>
                          <TableCell className="text-center">
                            <ActionsDropdown wo={wo} onDelete={setDeleteId} onProgram={openProgram} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Página {currentPage} de {totalPages} &mdash; {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="size-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === "..." ? <span key={`e-${idx}`} className="px-1">...</span> : (
                            <Button key={p} size="sm" variant={p === currentPage ? "default" : "outline"}
                              className={p === currentPage ? "bg-[#008ed3] text-white hover:bg-[#0055a3]" : ""}
                              onClick={() => setPage(p as number)}>
                              {p}
                            </Button>
                          )
                        )}
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

      {/* Delete dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a OS #{deleteId}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Program / Reprogram dialog */}
      <Dialog open={!!programTarget} onOpenChange={(o) => !o && setProgramTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="size-5 text-yellow-600" />
              {programTarget?.faseId === 1 ? "Reprogramar OS" : "Programar OS"} #{programTarget?.orderId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="prog-team">
                Equipe <span className="text-red-500">*</span>
              </Label>
              <select
                id="prog-team"
                value={progTeamId}
                onChange={(e) => setProgTeamId(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
              >
                <option value="">Selecione uma equipe</option>
                {teams.map((t) => (
                  <option key={t.teamId} value={String(t.teamId)}>{t.teamNome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prog-datetime">
                Data e Hora <span className="text-red-500">*</span>
              </Label>
              <input
                id="prog-datetime"
                type="datetime-local"
                value={progDateTime}
                onChange={(e) => setProgDateTime(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setProgramTarget(null)} disabled={programming}>
                Cancelar
              </Button>
              <Button
                onClick={handleProgram}
                disabled={programming}
                className="text-white"
                style={{ background: programming ? "#94a3b8" : "linear-gradient(135deg, #008ed3, #0055a3)" }}
              >
                {programming ? "Salvando..." : "Confirmar Programação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
