import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { ChevronRight, Upload, X, CheckCircle2, Search, ChevronLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

interface Photo { name: string; url: string }
interface Material { descricao: string; quantidade: string; unidade: string }
interface DiagnosticItem { diagId: number; descricao: string; active: boolean }

interface WorkOrder {
  orderId: number;
  faseId: number | null;
  orderObservacoes: string | null;
  solutionDescription: string | null;
  photosJson: unknown;
  diagsJson: unknown;
  materialsJson: unknown;
  plant: { plantName: string | null } | null;
  serviceCode: { descricao: string } | null;
  serviceReason: { descricao: string } | null;
  team: { teamNome: string } | null;
}

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function WorkOrderConclusionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const [solutionDescription, setSolutionDescription] = useState("");
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [selectedDiagIds, setSelectedDiagIds] = useState<Set<number>>(new Set());

  // diagnostic search + pagination
  const [diagSearch, setDiagSearch] = useState("");
  const [diagPage, setDiagPage] = useState(1);
  const [diagPerPage, setDiagPerPage] = useState(10);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [matDesc, setMatDesc] = useState("");
  const [matQtd, setMatQtd] = useState("");
  const [matUnit, setMatUnit] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [woRes, diagRes] = await Promise.allSettled([
          apiFetch<{ workOrder: WorkOrder }>(`/work-orders/${id}`),
          apiFetch<{ diagnostics: DiagnosticItem[] }>("/diagnostics"),
        ]);

        if (woRes.status === "fulfilled") {
          const wo = woRes.value.workOrder;
          setWorkOrder(wo);
          setSolutionDescription(wo.solutionDescription ?? "");
          if (Array.isArray(wo.photosJson)) setPhotos(wo.photosJson as Photo[]);
          if (Array.isArray(wo.materialsJson)) setMaterials(wo.materialsJson as Material[]);
          if (Array.isArray(wo.diagsJson)) {
            setSelectedDiagIds(new Set((wo.diagsJson as { diagId: number }[]).map((d) => d.diagId)));
          }
        } else {
          toast.error("Erro ao carregar ordem de serviço");
          navigate("/maintenance");
          return;
        }

        if (diagRes.status === "fulfilled") {
          setDiagnostics((diagRes.value.diagnostics ?? []).filter((d) => d.active));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  // filtered + paginated diagnostics
  const filteredDiags = useMemo(() => {
    const q = diagSearch.trim().toLowerCase();
    if (!q) return diagnostics;
    return diagnostics.filter((d) => d.descricao.toLowerCase().includes(q));
  }, [diagnostics, diagSearch]);

  const diagTotalPages = Math.max(1, Math.ceil(filteredDiags.length / diagPerPage));
  const diagCurrentPage = Math.min(diagPage, diagTotalPages);
  const pagedDiags = useMemo(
    () => filteredDiags.slice((diagCurrentPage - 1) * diagPerPage, diagCurrentPage * diagPerPage),
    [filteredDiags, diagCurrentPage, diagPerPage]
  );

  // reset to page 1 when search or perPage changes
  useEffect(() => { setDiagPage(1); }, [diagSearch, diagPerPage]);

  function toggleDiag(diagId: number) {
    setSelectedDiagIds((prev) => {
      const next = new Set(prev);
      if (next.has(diagId)) next.delete(diagId); else next.add(diagId);
      return next;
    });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos((prev) => [...prev, { name: file.name, url: ev.target?.result as string }]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const selectedDiagnostics = diagnostics.filter((d) => selectedDiagIds.has(d.diagId));

  const handleConclude = async () => {
    if (!solutionDescription.trim()) { toast.error("Descreva a solução aplicada antes de concluir"); return; }
    setSubmitting(true);
    try {
      await apiFetch(`/work-orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          faseId: 3,
          solutionDescription: solutionDescription.trim(),
          diagsJson: selectedDiagnostics.length > 0
            ? selectedDiagnostics.map((d) => ({ diagId: d.diagId, descricao: d.descricao }))
            : undefined,
          photosJson: photos.length > 0 ? photos : undefined,
          materialsJson: materials.length > 0 ? materials : undefined,
        }),
      });
      toast.success("Ordem de Serviço concluída com sucesso");
      navigate("/maintenance");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao concluir OS");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Carregando...</div>;
  if (!workOrder) return null;

  const STEPS = ["Solução & Diagnóstico", "Materiais", "Fotos", "Confirmar"];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <button type="button" className="font-semibold text-gray-900 hover:text-gray-700" onClick={() => navigate("/maintenance")}>
          Ordens de Serviço
        </button>
        <ChevronRight className="size-4" />
        <span className="font-semibold text-gray-900">Concluir OS #{workOrder.orderId}</span>
      </nav>

      {/* OS summary */}
      <div className="mb-4 max-w-4xl mx-auto rounded-lg border border-gray-200 bg-white px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div><p className="text-gray-500">Usina</p><p className="font-semibold truncate">{workOrder.plant?.plantName ?? "—"}</p></div>
        <div><p className="text-gray-500">Serviço</p><p className="font-semibold truncate">{workOrder.serviceCode?.descricao ?? "—"}</p></div>
        <div><p className="text-gray-500">Motivo</p><p className="font-semibold truncate">{workOrder.serviceReason?.descricao ?? "—"}</p></div>
        <div><p className="text-gray-500">Equipe</p><p className="font-semibold truncate">{workOrder.team?.teamNome ?? "—"}</p></div>
      </div>

      {/* Step indicator */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const num = i + 1;
          const active = num === step;
          const done = num < step;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center size-7 rounded-full text-xs font-bold shrink-0 ${done ? "bg-green-500 text-white" : active ? "bg-[#0055a3] text-white" : "bg-gray-200 text-gray-500"}`}>
                {done ? <CheckCircle2 className="size-4" /> : num}
              </div>
              <span className={`text-xs ${active ? "font-semibold text-[#0055a3]" : "text-gray-500"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${done ? "bg-green-400" : "bg-gray-200"}`} />}
            </div>
          );
        })}
      </div>

      <Card className="max-w-4xl mx-auto bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: "#0e457f" }}>{STEPS[step - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ─── STEP 1: Solução + Diagnósticos ─── */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="solution">
                  Solução Aplicada <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="solution"
                  rows={5}
                  value={solutionDescription}
                  onChange={(e) => setSolutionDescription(e.target.value)}
                  placeholder="Descreva detalhadamente a solução aplicada no serviço..."
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40 resize-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-sm font-medium text-gray-700">
                    Diagnósticos
                    {selectedDiagIds.size > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#e6f4fc] text-[#0055a3]">
                        {selectedDiagIds.size} selecionado{selectedDiagIds.size !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Por página:</span>
                    <select
                      value={diagPerPage}
                      onChange={(e) => setDiagPerPage(Number(e.target.value))}
                      className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#008ed3]"
                    >
                      {PER_PAGE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {diagnostics.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhum diagnóstico cadastrado. Configure em Configurações → Diagnósticos.</p>
                ) : (
                  <>
                    {/* Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                      <Input
                        placeholder="Buscar diagnóstico..."
                        value={diagSearch}
                        onChange={(e) => setDiagSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                      {diagSearch && (
                        <button
                          type="button"
                          onClick={() => setDiagSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Grid */}
                    {pagedDiags.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-4">Nenhum diagnóstico encontrado para "{diagSearch}"</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3">
                        {pagedDiags.map((d) => (
                          <label
                            key={d.diagId}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors text-xs ${
                              selectedDiagIds.has(d.diagId)
                                ? "border-[#008ed3] bg-[#e6f4fc] text-[#0055a3]"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDiagIds.has(d.diagId)}
                              onChange={() => toggleDiag(d.diagId)}
                              className="accent-[#008ed3] shrink-0"
                            />
                            <span className="leading-snug">{d.descricao}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    {diagTotalPages > 1 && (
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {filteredDiags.length} resultado{filteredDiags.length !== 1 ? "s" : ""}
                          {diagSearch ? ` para "${diagSearch}"` : ""}
                          {" — "}página {diagCurrentPage} de {diagTotalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={diagCurrentPage === 1}
                            onClick={() => setDiagPage((p) => p - 1)}
                            className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                          >
                            <ChevronLeft className="size-3.5" />
                          </button>
                          {Array.from({ length: Math.min(diagTotalPages, 5) }, (_, i) => {
                            // show pages around current
                            let start = Math.max(1, diagCurrentPage - 2);
                            const end = Math.min(diagTotalPages, start + 4);
                            start = Math.max(1, end - 4);
                            return start + i;
                          }).filter((p) => p <= diagTotalPages).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setDiagPage(p)}
                              className={`size-6 rounded text-xs ${p === diagCurrentPage ? "bg-[#008ed3] text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={diagCurrentPage === diagTotalPages}
                            onClick={() => setDiagPage((p) => p + 1)}
                            className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                          >
                            <ChevronDown className="size-3.5 rotate-[-90deg]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* ─── STEP 2: Materiais Aplicados ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Informe os materiais e peças utilizados no serviço (opcional)</p>

              {/* Add material row */}
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-[180px] space-y-1">
                  <label className="text-xs font-medium text-gray-700">Descrição</label>
                  <Input
                    placeholder="Ex: Cabo 10mm², Disjuntor 32A..."
                    value={matDesc}
                    onChange={(e) => setMatDesc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && matDesc.trim()) {
                        setMaterials((prev) => [...prev, { descricao: matDesc.trim(), quantidade: matQtd.trim() || "1", unidade: matUnit.trim() || "un" }]);
                        setMatDesc(""); setMatQtd(""); setMatUnit("");
                      }
                    }}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-xs font-medium text-gray-700">Qtd.</label>
                  <Input placeholder="1" value={matQtd} onChange={(e) => setMatQtd(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-xs font-medium text-gray-700">Unidade</label>
                  <Input placeholder="un" value={matUnit} onChange={(e) => setMatUnit(e.target.value)} className="h-9 text-sm" />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (!matDesc.trim()) return;
                    setMaterials((prev) => [...prev, { descricao: matDesc.trim(), quantidade: matQtd.trim() || "1", unidade: matUnit.trim() || "un" }]);
                    setMatDesc(""); setMatQtd(""); setMatUnit("");
                  }}
                  className="h-9 text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}
                >
                  Adicionar
                </Button>
              </div>

              {/* Materials list */}
              {materials.length > 0 ? (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                        <th className="text-left px-4 py-2">Material / Peça</th>
                        <th className="text-center px-3 py-2 w-20">Qtd.</th>
                        <th className="text-center px-3 py-2 w-20">Un.</th>
                        <th className="w-10 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2 text-gray-800">{m.descricao}</td>
                          <td className="px-3 py-2 text-center text-gray-700">{m.quantidade}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{m.unidade}</td>
                          <td className="py-2 pr-2 text-center">
                            <button
                              type="button"
                              onClick={() => setMaterials((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-gray-400 hover:text-red-500 transition"
                            >
                              <X className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400 py-4">Nenhum material adicionado</p>
              )}
            </div>
          )}

          {/* ─── STEP 3: Fotos ─── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Adicione fotos da execução do serviço (opcional)</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#008ed3]/40 rounded-lg p-6 text-center hover:bg-[#e6f4fc]/50 transition"
              >
                <Upload className="size-8 mx-auto mb-2 text-[#008ed3]" />
                <p className="text-sm font-medium text-[#0055a3]">Clique para adicionar fotos</p>
                <p className="text-xs text-gray-500 mt-1">Pode selecionar múltiplas imagens</p>
              </button>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200">
                      <img src={photo.url} alt={photo.name} className="w-full h-28 object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                        <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 transition">
                          <X className="size-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 truncate px-1 py-0.5 bg-gray-50">{photo.name}</p>
                    </div>
                  ))}
                </div>
              )}
              {photos.length === 0 && <p className="text-center text-xs text-gray-400">Nenhuma foto adicionada</p>}
            </div>
          )}

          {/* ─── STEP 4: Confirmar ─── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="size-5" />
                  Confirmar Conclusão
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><span className="font-medium">OS:</span> #{workOrder.orderId}</p>
                  <p><span className="font-medium">Usina:</span> {workOrder.plant?.plantName ?? "—"}</p>
                  <p><span className="font-medium">Solução:</span> {solutionDescription || "—"}</p>
                  {selectedDiagnostics.length > 0 && (
                    <p><span className="font-medium">Diagnósticos:</span> {selectedDiagnostics.map((d) => d.descricao).join(" / ")}</p>
                  )}
                  {materials.length > 0 && (
                    <p><span className="font-medium">Materiais:</span> {materials.map((m) => `${m.descricao} (${m.quantidade} ${m.unidade})`).join(", ")}</p>
                  )}
                  <p><span className="font-medium">Fotos:</span> {photos.length} foto(s)</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Ao confirmar, a OS será marcada como <strong>Concluída</strong> e não poderá ser reaberta.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/maintenance")} disabled={submitting}>
              Cancelar
            </Button>
            <div className="flex gap-3">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={submitting}>
                  Voltar
                </Button>
              )}
              {step < 4 && (
                <Button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !solutionDescription.trim()) { toast.error("Preencha a solução antes de avançar"); return; }
                    setStep(step + 1);
                  }}
                  className="text-white"
                  style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}
                >
                  Próximo
                </Button>
              )}
              {step === 4 && (
                <Button
                  type="button"
                  onClick={handleConclude}
                  disabled={submitting}
                  className="text-white min-w-[130px]"
                  style={{ background: submitting ? "#94a3b8" : "linear-gradient(135deg, #00a971, #007a52)" }}
                >
                  {submitting ? "Concluindo..." : "Concluir OS"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
