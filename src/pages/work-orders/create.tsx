import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { ChevronRight, AlertTriangle, Info, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

interface ServiceCode { codServId: number; descricao: string; active: boolean }
interface ServiceReason { motServId: number; descricao: string; active: boolean; codServId: number | null }
interface Team { teamId: number; teamNome: string; teamResponsavel: string | null; active: boolean }
interface Plant {
  plantId: number;
  plantName: string | null;
  addressLine: string | null;
  city: string | null;
  stateName: string | null;
  idExternoUsina: string | null;
  cliIdCliente: number | null;
  clientName: string | null;
}

export default function WorkOrderCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const alarmEventIdParam = searchParams.get("alarmEventId");
  const stationIdParam = searchParams.get("stationId");
  const plantIdParam = searchParams.get("plantId");

  const [serviceCodes, setServiceCodes] = useState<ServiceCode[]>([]);
  const [allServiceReasons, setAllServiceReasons] = useState<ServiceReason[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // form state
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");
  const [codServId, setCodServId] = useState<string>("");
  const [motServId, setMotServId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [faseId, setFaseId] = useState<string>("2"); // default = Aberto
  const [orderDataProgramacao, setOrderDataProgramacao] = useState<string>("");
  const [orderObservacoes, setOrderObservacoes] = useState("");
  const [orderPointReference, setOrderPointReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isFromAlarm = !!alarmEventIdParam;
  const isProgramado = faseId === "1";

  // reasons filtered by selected service code
  const filteredReasons = allServiceReasons.filter((r) => {
    if (!r.active) return false;
    if (!codServId) return true; // show all when no code selected
    return r.codServId === Number(codServId);
  });

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [scRes, srRes, tRes, pRes] = await Promise.allSettled([
          apiFetch<{ serviceCodes: ServiceCode[] }>("/service-codes"),
          apiFetch<{ serviceReasons: ServiceReason[] }>("/service-reasons"),
          apiFetch<{ teams: Team[] }>("/teams"),
          apiFetch<{ plants: Plant[] }>("/plants"),
        ]);

        if (scRes.status === "fulfilled") setServiceCodes(scRes.value.serviceCodes ?? []);
        if (srRes.status === "fulfilled") setAllServiceReasons(srRes.value.serviceReasons ?? []);
        if (tRes.status === "fulfilled") setTeams(tRes.value.teams ?? []);

        const fetchedPlants: Plant[] = pRes.status === "fulfilled"
          ? (pRes.value.plants ?? []).map((p: any) => ({
              plantId: p.plantId ?? Number(p.id),
              plantName: p.plantName,
              addressLine: p.addressLine,
              city: p.city,
              stateName: p.stateName,
              idExternoUsina: p.idExternoUsina,
              cliIdCliente: p.cliIdCliente,
              clientName: p.clientName,
            }))
          : [];
        setPlants(fetchedPlants);

        if (stationIdParam) {
          const matched = fetchedPlants.find((p) => p.idExternoUsina === stationIdParam);
          if (matched) setSelectedPlantId(String(matched.plantId));
        } else if (plantIdParam) {
          setSelectedPlantId(plantIdParam);
        }
      } catch {
        toast.error("Erro ao carregar opções do formulário");
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  // when service code changes, clear reason if it no longer matches
  function handleCodeChange(newCode: string) {
    setCodServId(newCode);
    if (newCode && motServId) {
      const reason = allServiceReasons.find((r) => r.motServId === Number(motServId));
      if (reason && reason.codServId !== Number(newCode)) setMotServId("");
    }
  }

  // when team changes: if team selected → force Programado; if cleared → revert to Aberto
  function handleTeamChange(newTeamId: string) {
    setTeamId(newTeamId);
    if (newTeamId) {
      setFaseId("1");
    } else {
      setFaseId("2");
      setOrderDataProgramacao("");
    }
  }

  const selectedPlant = plants.find((p) => String(p.plantId) === selectedPlantId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlantId) { toast.error("Selecione uma usina"); return; }
    if (isProgramado && !orderDataProgramacao) { toast.error("Informe a data de programação"); return; }

    setSubmitting(true);
    try {
      await apiFetch("/work-orders", {
        method: "POST",
        body: JSON.stringify({
          plantId: Number(selectedPlantId),
          clientId: selectedPlant?.cliIdCliente ?? undefined,
          codServId: codServId ? Number(codServId) : undefined,
          motServId: motServId ? Number(motServId) : undefined,
          teamId: teamId ? Number(teamId) : undefined,
          faseId: Number(faseId),
          orderDataProgramacao: orderDataProgramacao || undefined,
          orderObservacoes: orderObservacoes || undefined,
          orderPointReference: orderPointReference || undefined,
          alarmEventId: alarmEventIdParam ? Number(alarmEventIdParam) : undefined,
        }),
      });
      toast.success("Ordem de Serviço criada com sucesso");
      navigate("/maintenance");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar ordem de serviço";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <button type="button" className="hover:text-gray-800 font-semibold text-gray-900" onClick={() => navigate("/maintenance")}>
          Ordens de Serviço
        </button>
        <ChevronRight className="size-4 text-gray-400" />
        <span className="font-semibold text-gray-900">Nova OS</span>
      </nav>

      {isFromAlarm && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">OS sendo aberta a partir do alarme #{alarmEventIdParam}</p>
            {selectedPlant && (
              <p className="mt-0.5 text-xs">Usina e cliente preenchidos automaticamente</p>
            )}
          </div>
        </div>
      )}

      <Card className="max-w-4xl mx-auto bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold" style={{ color: "#0e457f" }}>
            {isFromAlarm ? "Abertura de OS — Alarme" : "Nova Ordem de Serviço"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOptions ? (
            <div className="py-10 text-center text-gray-500 text-sm">Carregando opções...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Usina */}
              <div className="space-y-2">
                <Label htmlFor="plantId">
                  Usina <span className="text-red-500">*</span>
                </Label>
                {isFromAlarm && selectedPlant ? (
                  <div className="rounded-lg border border-[#008ed3]/30 bg-[#e6f4fc] px-4 py-3 text-sm space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-[#0055a3]">
                      <Info className="size-4" />
                      {selectedPlant.plantName ?? `Usina #${selectedPlant.plantId}`}
                    </div>
                    {selectedPlant.addressLine && (
                      <div className="flex items-start gap-2 text-[#0055a3]">
                        <MapPin className="size-3.5 mt-0.5 shrink-0" />
                        <span>{[selectedPlant.addressLine, selectedPlant.city, selectedPlant.stateName].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    {selectedPlant.clientName && (
                      <div className="flex items-center gap-2 text-[#0055a3]">
                        <User className="size-3.5 shrink-0" />
                        <span>Cliente: <strong>{selectedPlant.clientName}</strong></span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <select
                      id="plantId"
                      value={selectedPlantId}
                      onChange={(e) => setSelectedPlantId(e.target.value)}
                      className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
                      required
                    >
                      <option value="">Selecione uma usina</option>
                      {plants.map((p) => (
                        <option key={p.plantId} value={String(p.plantId)}>
                          {p.plantName ?? `Usina #${p.plantId}`}
                        </option>
                      ))}
                    </select>
                    {selectedPlant && (
                      <div className="rounded-lg bg-[#e6f4fc] px-4 py-2 text-xs text-[#0055a3] space-y-0.5">
                        {selectedPlant.addressLine && (
                          <p><MapPin className="inline size-3 mr-1" />{[selectedPlant.addressLine, selectedPlant.city, selectedPlant.stateName].filter(Boolean).join(", ")}</p>
                        )}
                        {selectedPlant.clientName && (
                          <p><User className="inline size-3 mr-1" />Cliente: <strong>{selectedPlant.clientName}</strong></p>
                        )}
                      </div>
                    )}
                  </>
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
                    {serviceCodes.filter((s) => s.active).map((sc) => (
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
                    disabled={filteredReasons.length === 0 && !codServId}
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
                    {teams.filter((t) => t.active).map((t) => (
                      <option key={t.teamId} value={String(t.teamId)}>{t.teamNome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fase — locked to Programado when team selected */}
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
                        onClick={() => setFaseId(opt.id)}
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

              {/* Data de Programação — required when Programado */}
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

              {/* Observações + Ponto de Referência */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <textarea
                    id="observacoes"
                    rows={4}
                    value={orderObservacoes}
                    onChange={(e) => setOrderObservacoes(e.target.value)}
                    placeholder="Descreva o problema ou observações da OS"
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
                    placeholder="Ex: Portão lateral, bloco 3, inversor 2..."
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
                  className="text-white min-w-[120px]"
                  style={{ background: submitting ? "#94a3b8" : "linear-gradient(135deg, #008ed3, #0055a3)" }}
                >
                  {submitting ? "Criando..." : "Criar OS"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
