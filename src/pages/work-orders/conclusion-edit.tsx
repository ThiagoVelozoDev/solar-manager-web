import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  ChevronRight, CheckCircle2, Search, X, Upload, CalendarClock,
  User, MapPin, Wrench, Users2, ChevronLeft, ChevronDown, ImageOff, ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

interface Photo { name: string; url: string }
interface DiagnosticItem { diagId: number; descricao: string; active: boolean }
interface SavedDiag { diagId: number; descricao: string }

interface WorkOrder {
  orderId: number;
  faseId: number | null;
  solutionDescription: string | null;
  diagsJson: unknown;
  photosJson: unknown;
  orderObservacoes: string | null;
  orderPointReference: string | null;
  orderDataProgramacao: string | null;
  createdAt: string;
  updatedAt: string;
  plant: { plantName: string | null; addressLine: string | null; city: string | null; stateName: string | null } | null;
  serviceCode: { descricao: string } | null;
  serviceReason: { descricao: string } | null;
  team: { teamNome: string; teamResponsavel: string | null; teamContato: string | null } | null;
  client: { cliNameClient: string | null } | null;
  alarmEventId: number | null;
}

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch { return iso ?? "—"; }
}

export default function WorkOrderConclusionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [allDiagnostics, setAllDiagnostics] = useState<DiagnosticItem[]>([]);
  const [loading, setLoading] = useState(true);

  // editable fields
  const [solutionDescription, setSolutionDescription] = useState("");
  const [selectedDiagIds, setSelectedDiagIds] = useState<Set<number>>(new Set());
  const [photos, setPhotos] = useState<Photo[]>([]);

  // diag search + pagination
  const [diagSearch, setDiagSearch] = useState("");
  const [diagPage, setDiagPage] = useState(1);
  const [diagPerPage, setDiagPerPage] = useState(10);

  // photo lightbox
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

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
          if (Array.isArray(wo.diagsJson)) {
            setSelectedDiagIds(new Set((wo.diagsJson as SavedDiag[]).map((d) => d.diagId)));
          }
        } else {
          toast.error("Ordem de serviço não encontrada");
          navigate("/maintenance");
          return;
        }

        if (diagRes.status === "fulfilled") {
          setAllDiagnostics((diagRes.value.diagnostics ?? []).filter((d) => d.active));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  // diagnostics that were selected at conclusion time but may no longer be in active list
  const savedDiags: SavedDiag[] = useMemo(() => {
    if (!workOrder || !Array.isArray(workOrder.diagsJson)) return [];
    return workOrder.diagsJson as SavedDiag[];
  }, [workOrder]);

  // merge: active diags + any saved diags not in active list
  const mergedDiags: DiagnosticItem[] = useMemo(() => {
    const active = new Set(allDiagnostics.map((d) => d.diagId));
    const extras = savedDiags
      .filter((sd) => !active.has(sd.diagId))
      .map((sd) => ({ diagId: sd.diagId, descricao: sd.descricao, active: false }));
    return [...allDiagnostics, ...extras];
  }, [allDiagnostics, savedDiags]);

  const filteredDiags = useMemo(() => {
    const q = diagSearch.trim().toLowerCase();
    if (!q) return mergedDiags;
    return mergedDiags.filter((d) => d.descricao.toLowerCase().includes(q));
  }, [mergedDiags, diagSearch]);

  const diagTotalPages = Math.max(1, Math.ceil(filteredDiags.length / diagPerPage));
  const diagCurrentPage = Math.min(diagPage, diagTotalPages);
  const pagedDiags = useMemo(
    () => filteredDiags.slice((diagCurrentPage - 1) * diagPerPage, diagCurrentPage * diagPerPage),
    [filteredDiags, diagCurrentPage, diagPerPage]
  );

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

  async function handleSave() {
    if (!solutionDescription.trim()) { toast.error("Preencha a solução"); return; }
    setSaving(true);
    try {
      const selectedDiagnostics = mergedDiags.filter((d) => selectedDiagIds.has(d.diagId));
      await apiFetch(`/work-orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          solutionDescription: solutionDescription.trim(),
          diagsJson: selectedDiagnostics.length > 0
            ? selectedDiagnostics.map((d) => ({ diagId: d.diagId, descricao: d.descricao }))
            : null,
          photosJson: photos.length > 0 ? photos : null,
        }),
      });
      toast.success("Conclusão atualizada com sucesso");
      navigate("/maintenance");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Carregando...</div>;
  if (!workOrder) return null;

  const selectedList = mergedDiags.filter((d) => selectedDiagIds.has(d.diagId));

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <button type="button" className="font-semibold text-gray-900 hover:text-gray-700" onClick={() => navigate("/maintenance")}>
          Ordens de Serviço
        </button>
        <ChevronRight className="size-4" />
        <span className="font-semibold text-gray-900">Conclusão OS #{workOrder.orderId}</span>
      </nav>

      {/* Status banner */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <CheckCircle2 className="size-5 shrink-0" />
        <div>
          <p className="font-semibold">OS Concluída</p>
          <p className="text-xs text-green-700">Concluída em {formatDateTime(workOrder.updatedAt)}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* OS info card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ color: "#0e457f" }}>Informações da OS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {workOrder.plant && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><MapPin className="size-3" /> Usina</p>
                  <p className="font-semibold text-gray-800">{workOrder.plant.plantName ?? "—"}</p>
                  {(workOrder.plant.addressLine || workOrder.plant.city) && (
                    <p className="text-xs text-gray-500">{[workOrder.plant.addressLine, workOrder.plant.city, workOrder.plant.stateName].filter(Boolean).join(", ")}</p>
                  )}
                </div>
              )}
              {workOrder.serviceCode && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Wrench className="size-3" /> Serviço</p>
                  <p className="font-semibold text-gray-800">{workOrder.serviceCode.descricao}</p>
                  {workOrder.serviceReason && <p className="text-xs text-gray-500">{workOrder.serviceReason.descricao}</p>}
                </div>
              )}
              {workOrder.team && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Users2 className="size-3" /> Equipe</p>
                  <p className="font-semibold text-gray-800">{workOrder.team.teamNome}</p>
                  {workOrder.team.teamResponsavel && <p className="text-xs text-gray-500">{workOrder.team.teamResponsavel}</p>}
                </div>
              )}
              {workOrder.client && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><User className="size-3" /> Cliente</p>
                  <p className="font-semibold text-gray-800">{workOrder.client.cliNameClient ?? "—"}</p>
                </div>
              )}
              {workOrder.orderDataProgramacao && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><CalendarClock className="size-3" /> Programação</p>
                  <p className="font-semibold text-gray-800">{formatDateTime(workOrder.orderDataProgramacao)}</p>
                </div>
              )}
              {workOrder.orderObservacoes && (
                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <p className="text-xs font-medium text-gray-500">Observações de Abertura</p>
                  <p className="text-gray-700 text-sm">{workOrder.orderObservacoes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Solução */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ color: "#0e457f" }}>Solução Aplicada</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="solution" className="sr-only">Solução</Label>
            <textarea
              id="solution"
              rows={5}
              value={solutionDescription}
              onChange={(e) => setSolutionDescription(e.target.value)}
              placeholder="Descreva detalhadamente a solução aplicada..."
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40 resize-none"
            />
          </CardContent>
        </Card>

        {/* Diagnósticos */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base font-semibold" style={{ color: "#0e457f" }}>
                Diagnósticos
                {selectedDiagIds.size > 0 && (
                  <Badge className="ml-2 bg-[#e6f4fc] text-[#0055a3] hover:bg-[#e6f4fc]">
                    {selectedDiagIds.size} selecionado{selectedDiagIds.size !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Selected summary */}
            {selectedList.length > 0 && (
              <div className="flex flex-wrap gap-1 p-3 rounded-lg bg-[#e6f4fc] border border-[#008ed3]/20">
                {selectedList.map((d) => (
                  <span key={d.diagId} className="inline-flex items-center gap-1 bg-[#0055a3] text-white text-xs px-2 py-0.5 rounded-full">
                    {d.descricao}
                    <button type="button" onClick={() => toggleDiag(d.diagId)} className="hover:opacity-70">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {mergedDiags.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum diagnóstico cadastrado.</p>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <Input
                    placeholder="Buscar diagnóstico..."
                    value={diagSearch}
                    onChange={(e) => setDiagSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                  {diagSearch && (
                    <button type="button" onClick={() => setDiagSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

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
                        {!d.active && <span className="ml-auto text-[10px] text-gray-400 italic">inativo</span>}
                      </label>
                    ))}
                  </div>
                )}

                {diagTotalPages > 1 && (
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {filteredDiags.length} resultado{filteredDiags.length !== 1 ? "s" : ""}
                      {diagSearch ? ` para "${diagSearch}"` : ""} — página {diagCurrentPage} de {diagTotalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={diagCurrentPage === 1} onClick={() => setDiagPage((p) => p - 1)}
                        className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                        <ChevronLeft className="size-3.5" />
                      </button>
                      {Array.from({ length: Math.min(diagTotalPages, 5) }, (_, i) => {
                        let start = Math.max(1, diagCurrentPage - 2);
                        const end = Math.min(diagTotalPages, start + 4);
                        start = Math.max(1, end - 4);
                        return start + i;
                      }).filter((p) => p <= diagTotalPages).map((p) => (
                        <button key={p} type="button" onClick={() => setDiagPage(p)}
                          className={`size-6 rounded text-xs ${p === diagCurrentPage ? "bg-[#008ed3] text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-600"}`}>
                          {p}
                        </button>
                      ))}
                      <button type="button" disabled={diagCurrentPage === diagTotalPages} onClick={() => setDiagPage((p) => p + 1)}
                        className="p-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                        <ChevronDown className="size-3.5 -rotate-90" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ color: "#0e457f" }}>
              Fotos Anexadas ({photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#008ed3]/40 rounded-lg p-4 text-center hover:bg-[#e6f4fc]/50 transition flex items-center justify-center gap-3"
            >
              <Upload className="size-5 text-[#008ed3]" />
              <span className="text-sm font-medium text-[#0055a3]">Adicionar mais fotos</span>
            </button>

            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <ImageOff className="size-10 mb-2 opacity-40" />
                <p className="text-sm">Nenhuma foto anexada nesta OS</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {photos.map((photo, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    {/* hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLightbox(photo)}
                        className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-800 rounded-full p-1.5 transition shadow"
                        title="Ampliar"
                      >
                        <ZoomIn className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1.5 transition shadow"
                        title="Remover"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate px-2 py-1 bg-white border-t border-gray-100">{photo.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => navigate("/maintenance")} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="text-white min-w-[160px]"
            style={{ background: saving ? "#94a3b8" : "linear-gradient(135deg, #00a971, #007a52)" }}
          >
            <CheckCircle2 className="size-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
            onClick={() => setLightbox(null)}
          >
            <X className="size-6" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/70 text-xs">{lightbox.name}</p>
        </div>
      )}
    </div>
  );
}
