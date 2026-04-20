import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { ChevronRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

interface ServiceCode { codServId: number; descricao: string; active: boolean }
interface ServiceReason { motServId: number; descricao: string; active: boolean; codServId: number | null }
interface Team { teamId: number; teamNome: string; teamResponsavel: string | null; teamContato: string | null; active: boolean }
interface Plant { id?: number; plantId?: number; plantName: string | null; addressLine: string | null; city: string | null; stateName: string | null }

interface WorkflowEntry {
  oworkId: number;
  orderFase: number | null;
  orderDataProgramacao: string | null;
  orderDataAbertura: string | null;
  orderDataConclusao: string | null;
  observacao: string | null;
  createdAt: string;
}

interface WorkOrderDetail {
  orderId: number;
  codServId: number | null;
  motServId: number | null;
  teamId: number | null;
  faseId: number | null;
  orderObservacoes: string | null;
  orderPointReference: string | null;
  orderDataProgramacao: string | null;
  plantId: number | null;
  alarmEventId: number | null;
  plant: { plantId: number; plantName: string | null; addressLine: string | null; city: string | null; stateName: string | null } | null;
  team: { teamId: number; teamNome: string } | null;
  workflows: WorkflowEntry[];
}

function resolvePlantId(p: Plant): number {
  return (p.id ?? p.plantId) as number;
}

function faseLabel(faseId: number | null): string {
  if (faseId === 1) return "Programado";
  if (faseId === 2) return "Aberto";
  if (faseId === 3) return "Concluído";
  return "—";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso; }
}

export default function WorkOrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const [serviceCodes, setServiceCodes] = useState<ServiceCode[]>([]);
  const [allServiceReasons, setAllServiceReasons] = useState<ServiceReason[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);

  // Form fields
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");
  const [codServId, setCodServId] = useState<string>("");
  const [motServId, setMotServId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [faseId, setFaseId] = useState<string>("2");
  const [orderDataProgramacao, setOrderDataProgramacao] = useState<string>("");
  const [orderObservacoes, setOrderObservacoes] = useState("");
  const [orderPointReference, setOrderPointReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isProgramado = faseId === "1";

  // reasons filtered by selected service code
  const filteredReasons = allServiceReasons.filter((r) => {
    if (!r.active) return false;
    if (!codServId) return true;
    return r.codServId === Number(codServId);
  });

  useEffect(() => {
    async function fetchAll() {
      try {
        const [woRes, scRes, srRes, tRes, pRes] = await Promise.allSettled([
          apiFetch<{ workOrder: WorkOrderDetail }>(`/work-orders/${id}`),
          apiFetch<{ serviceCodes: ServiceCode[] }>("/service-codes"),
          apiFetch<{ serviceReasons: ServiceReason[] }>("/service-reasons"),
          apiFetch<{ teams: Team[] }>("/teams"),
          apiFetch<{ plants: Plant[] }>("/plants"),
        ]);

        if (scRes.status === "fulfilled") setServiceCodes(scRes.value.serviceCodes ?? []);
        if (srRes.status === "fulfilled") setAllServiceReasons(srRes.value.serviceReasons ?? []);
        if (tRes.status === "fulfilled") setTeams(tRes.value.teams ?? []);
        if (pRes.status === "fulfilled") setPlants(pRes.value.plants ?? []);

        if (woRes.status === "fulfilled") {
          const wo = woRes.value.workOrder;
          setWorkOrder(wo);
          setSelectedPlantId(wo.plantId !== null ? String(wo.plantId) : "");
          setCodServId(wo.codServId !== null ? String(wo.codServId) : "");
          setMotServId(wo.motServId !== null ? String(wo.motServId) : "");
          setTeamId(wo.teamId !== null ? String(wo.teamId) : "");
          setFaseId(wo.faseId !== null ? String(wo.faseId) : "2");
          setOrderObservacoes(wo.orderObservacoes ?? "");
          setOrderPointReference(wo.orderPointReference ?? "");
          if (wo.orderDataProgramacao) {
            // Format as YYYY-MM-DDTHH:MM for datetime-local input
            const d = new Date(wo.orderDataProgramacao);
            const pad = (n: number) => String(n).padStart(2, "0");
            setOrderDataProgramacao(
              `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
            );
          }
        } else {
          toast.error("Erro ao carregar ordem de serviço");
          navigate("/maintenance");
        }
      } catch {
        toast.error("Erro ao carregar dados");
        navigate("/maintenance");
      } finally {
        setLoadingOrder(false);
      }
    }
    fetchAll();
  }, [id, navigate]);

  function handleCodeChange(newCode: string) {
    setCodServId(newCode);
    if (newCode && motServId) {
      const reason = allServiceReasons.find((r) => r.motServId === Number(motServId));
      if (reason && reason.codServId !== Number(newCode)) setMotServId("");
    }
  }

  function handleTeamChange(newTeamId: string) {
    setTeamId(newTeamId);
    if (newTeamId) {
      setFaseId("1");
    } else if (faseId === "1") {
      setFaseId("2");
      setOrderDataProgramacao("");
    }
  }

  const selectedPlant = plants.find((p) => String(resolvePlantId(p)) === selectedPlantId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workOrder) return;
    if (isProgramado && !orderDataProgramacao) { toast.error("Informe a data de programação"); return; }

    setSubmitting(true);
    try {
      await apiFetch(`/work-orders/${workOrder.orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          plantId: selectedPlantId ? Number(selectedPlantId) : undefined,
          codServId: codServId ? Number(codServId) : undefined,
          motServId: motServId ? Number(motServId) : undefined,
          teamId: teamId ? Number(teamId) : undefined,
          faseId: faseId ? Number(faseId) : undefined,
          orderDataProgramacao: orderDataProgramacao || undefined,
          orderObservacoes: orderObservacoes || undefined,
          orderPointReference: orderPointReference || undefined,
        }),
      });
      toast.success("Ordem de Serviço atualizada com sucesso");
      navigate("/maintenance");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar ordem de serviço";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!workOrder) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <button
          type="button"
          className="hover:text-gray-800 font-semibold text-gray-900 transition-colors"
          onClick={() => navigate("/maintenance")}
        >
          Ordens de Serviço
        </button>
        <ChevronRight className="size-4 text-gray-400" />
        <span className="text-gray-900 font-semibold">Editar OS #{workOrder.orderId}</span>
      </nav>

      <Card className="max-w-4xl mx-auto bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold" style={{ color: "#0e457f" }}>
            Editar Ordem de Serviço — #{workOrder.orderId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Usina */}
            <div className="space-y-2">
              <Label htmlFor="plantId">
                Usina <span className="text-red-500">*</span>
              </Label>
              <select
                id="plantId"
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
                required
              >
                <option value="">Selecione uma usina</option>
                {plants.map((p) => (
                  <option key={resolvePlantId(p)} value={String(resolvePlantId(p))}>
                    {p.plantName ?? `Usina #${resolvePlantId(p)}`}
                  </option>
                ))}
              </select>
              {selectedPlant && (
                <div className="mt-2 rounded-lg px-4 py-2 text-xs space-y-0.5" style={{ background: "#e6f4fc", color: "#0055a3" }}>
                  {selectedPlant.addressLine && <p>{selectedPlant.addressLine}{selectedPlant.city ? ` — ${selectedPlant.city}` : ""}{selectedPlant.stateName ? `, ${selectedPlant.stateName}` : ""}</p>}
                </div>
              )}
            </div>

            {/* Código de Serviço + Motivo + Equipe */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codServId">Código de Serviço</Label>
                <select
                  id="codServId"
                  value={codServId}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
                >
                  <option value="">Selecione</option>
                  {serviceCodes.map((sc) => (
                    <option key={sc.codServId} value={String(sc.codServId)}>{sc.descricao}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motServId">Motivo de Serviço</Label>
                <select
                  id="motServId"
                  value={motServId}
                  onChange={(e) => setMotServId(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
                >
                  <option value="">Selecione</option>
                  {filteredReasons.map((sr) => (
                    <option key={sr.motServId} value={String(sr.motServId)}>{sr.descricao}</option>
                  ))}
                </select>
                {codServId && filteredReasons.length === 0 && (
                  <p className="text-xs text-amber-600">Nenhum motivo vinculado a este serviço</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamId">Equipe</Label>
                <select
                  id="teamId"
                  value={teamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
                >
                  <option value="">Sem atribuição</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={String(t.teamId)}>{t.teamNome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fase — only Programado/Aberto available in edit */}
            <div className="space-y-2">
              <Label>Fase</Label>
              {teamId ? (
                <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800 flex items-center gap-2">
                  <span className="font-semibold">Programado</span>
                  <span className="text-xs opacity-75">— definido automaticamente por ter uma equipe atribuída</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  {[
                    { id: "1", label: "Programado", desc: "Agendar para execução futura", color: "border-yellow-400 bg-yellow-50 text-yellow-800" },
                    { id: "2", label: "Aberto", desc: "Iniciar execução imediata", color: "border-[#008ed3] bg-[#e6f4fc] text-[#0055a3]" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setFaseId(opt.id); if (opt.id === "2") setOrderDataProgramacao(""); }}
                      className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${
                        faseId === opt.id ? opt.color : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs mt-0.5 opacity-80">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Data de Programação — shown when Programado */}
            {isProgramado && (
              <div className="space-y-2">
                <Label htmlFor="dataProgramacao">
                  Data de Programação <span className="text-red-500">*</span>
                </Label>
                <input
                  id="dataProgramacao"
                  type="datetime-local"
                  value={orderDataProgramacao}
                  onChange={(e) => setOrderDataProgramacao(e.target.value)}
                  required
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40 max-w-xs"
                />
              </div>
            )}

            {/* Observações + Ponto de referência */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  rows={4}
                  value={orderObservacoes}
                  onChange={(e) => setOrderObservacoes(e.target.value)}
                  placeholder="Descreva as observações da ordem de serviço"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointReference">Ponto de Referência</Label>
                <textarea
                  id="pointReference"
                  rows={4}
                  value={orderPointReference}
                  onChange={(e) => setOrderPointReference(e.target.value)}
                  placeholder="Ex: Portão lateral, bloco 3..."
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => navigate("/maintenance")} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="text-white"
                style={{ background: submitting ? "#94a3b8" : "linear-gradient(135deg, #008ed3, #0055a3)" }}
              >
                {submitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Workflow timeline — always ordered: Abertura(2) → Programado(1) → Concluído(3) */}
      {workOrder.workflows && workOrder.workflows.length > 0 && (
        <Card className="max-w-4xl mx-auto mt-6 bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ color: "#0e457f" }}>
              <Clock className="size-4" />
              Histórico de Fases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l-2 border-[#e6f4fc] ml-3 space-y-6">
              {[...workOrder.workflows]
                .sort((a, b) => {
                  const order = [2, 1, 3];
                  return order.indexOf(a.orderFase ?? 0) - order.indexOf(b.orderFase ?? 0);
                })
                .map((wf) => (
                <li key={wf.oworkId} className="ml-6">
                  <span className="absolute -left-[9px] flex size-4 items-center justify-center rounded-full ring-2 ring-white" style={{ background: "#008ed3" }} />
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm font-semibold" style={{ color: "#0055a3" }}>{faseLabel(wf.orderFase)}</span>
                      <span className="text-xs text-gray-500">Registrado em {formatDate(wf.createdAt)}</span>
                    </div>
                    {wf.orderDataProgramacao && <p className="text-xs text-gray-600">Programação: {formatDate(wf.orderDataProgramacao)}</p>}
                    {wf.orderDataAbertura && <p className="text-xs text-gray-600">Abertura: {formatDate(wf.orderDataAbertura)}</p>}
                    {wf.orderDataConclusao && <p className="text-xs text-gray-600">Conclusão: {formatDate(wf.orderDataConclusao)}</p>}
                    {wf.observacao && <p className="text-xs text-gray-700 mt-1 border-t pt-1">{wf.observacao}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
