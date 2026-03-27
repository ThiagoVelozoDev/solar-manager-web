import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Upload, X, ChevronRight } from "lucide-react";
import { loadWorkOrders, saveWorkOrders, diagnosticCodes, phases } from "./types";
import type { WorkOrder, WorkOrderPhoto, DiagnosticCode } from "./types";

export default function WorkOrderConclusionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [concludeStep, setConcludeStep] = useState(1);
  const [selectedConcludePhase, setSelectedConcludePhase] = useState<string>("55");
  const [conclusionSolution, setConclusionSolution] = useState<string>("");
  const [photos, setPhotos] = useState<{
    plant: WorkOrderPhoto | null;
    inverter: WorkOrderPhoto | null;
    team: WorkOrderPhoto | null;
    vehicle: WorkOrderPhoto | null;
  }>({
    plant: null,
    inverter: null,
    team: null,
    vehicle: null,
  });
  const [additionalPhotos, setAdditionalPhotos] = useState<WorkOrderPhoto[]>([]);
  const [selectedDiagnostics, setSelectedDiagnostics] = useState<DiagnosticCode[]>([]);

  const plantPhotoRef = useRef<HTMLInputElement>(null);
  const inverterPhotoRef = useRef<HTMLInputElement>(null);
  const teamPhotoRef = useRef<HTMLInputElement>(null);
  const vehiclePhotoRef = useRef<HTMLInputElement>(null);
  const additionalPhotosRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const orders = loadWorkOrders();
    const found = orders.find((wo) => wo.id === id);
    if (!found) {
      navigate("/maintenance");
      return;
    }
    setWorkOrder(found);
    setPhotos(found.photos);
    setAdditionalPhotos(found.additionalPhotos);
    setSelectedDiagnostics(found.diagnostics);
    setConclusionSolution(found.conclusion_solution || "");
    setSelectedConcludePhase(found.phase === "04" ? "55" : found.phase);
  }, [id, navigate]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, photoType: 'plant' | 'inverter' | 'team' | 'vehicle') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => ({
          ...prev,
          [photoType]: {
            url: event.target?.result as string,
            name: file.name,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalPhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAdditionalPhotos((prev) => [
          ...prev,
          {
            url: event.target?.result as string,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (photoType: 'plant' | 'inverter' | 'team' | 'vehicle') => {
    setPhotos((prev) => ({
      ...prev,
      [photoType]: null,
    }));
  };

  const removeAdditionalPhoto = (index: number) => {
    setAdditionalPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDiagnostic = (diagnostic: DiagnosticCode) => {
    setSelectedDiagnostics((prev) => {
      const isSelected = prev.find((d) => d.id === diagnostic.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== diagnostic.id);
      } else if (prev.length < 10) {
        return [...prev, diagnostic];
      }
      return prev;
    });
  };

  const getDiagnosticsByGroup = (group: string) => {
    return diagnosticCodes.filter((d) => d.group === group);
  };

  const uniqueGroups = Array.from(new Set(diagnosticCodes.map((d) => d.group)));

  const onConclude = () => {
    if (!photos.plant || !photos.inverter || !photos.team || !photos.vehicle) {
      alert("Por favor, carregue as 4 fotos obrigatórias (Usina, Inversor, Equipe, Carro)");
      return;
    }

    if (!workOrder) return;

    const now = new Date().toISOString().slice(0, 10);
    const orders = loadWorkOrders();
    const updated = orders.map((wo) =>
      wo.id === workOrder.id
        ? {
            ...wo,
            phase: selectedConcludePhase,
            photos,
            additionalPhotos,
            diagnostics: selectedDiagnostics,
            conclusion_solution: conclusionSolution,
            concluded_date: now,
          }
        : wo
    );
    saveWorkOrders(updated);
    navigate("/maintenance");
  };

  if (!workOrder) return <div>Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
        <span className="text-gray-900 font-semibold">Ordens de Serviço</span>
        <ChevronRight className="size-4" />
        <span className="text-gray-900 font-semibold">Concluir</span>
      </div>

      <Card className="max-w-6xl mx-auto bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Concluir Ordem de Serviço - {workOrder.wo_id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados da OS - Read Only */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <p className="text-xs text-gray-600">OS ID</p>
              <p className="font-semibold">{workOrder.wo_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Usina</p>
              <p className="font-semibold">{workOrder.plant_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Tipo de Serviço</p>
              <p className="font-semibold">{workOrder.service_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Motivo</p>
              <p className="font-semibold">{workOrder.service_reason}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Equipe</p>
              <p className="font-semibold">{workOrder.team_name || "Não atribuída"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Data Programação</p>
              <p className="font-semibold">{workOrder.scheduled_date || "Não programada"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-gray-600">Observações</p>
              <p className="font-semibold text-sm">{workOrder.observations}</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step <= concludeStep ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Etapa 1: Fotos e Solução */}
          {concludeStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="conclusion-solution" className="font-semibold">Solução</Label>
                <textarea
                  id="conclusion-solution"
                  value={conclusionSolution}
                  onChange={(e) => setConclusionSolution(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Descreva a solução aplicada no serviço"
                />
              </div>

              {/* Fotos Obrigatórias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'plant' as const, label: 'Foto da Usina*', ref: plantPhotoRef },
                  { key: 'inverter' as const, label: 'Foto do Inversor*', ref: inverterPhotoRef },
                  { key: 'team' as const, label: 'Foto da Equipe*', ref: teamPhotoRef },
                  { key: 'vehicle' as const, label: 'Foto do Carro*', ref: vehiclePhotoRef },
                ].map(({ key, label, ref }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <input
                      ref={ref}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, key)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => ref.current?.click()}
                      className="w-full border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition"
                    >
                      <Upload className="size-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Clique para selecionar</p>
                      {photos[key] && <p className="text-xs text-green-600 mt-1">✓ {photos[key]!.name}</p>}
                    </button>
                    {photos[key] && (
                      <div className="space-y-2">
                        <img
                          src={photos[key]!.url}
                          alt={label}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(key)}
                          className="w-full p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <X className="size-4" />
                          Excluir foto
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Fotos Adicionais */}
              <div className="space-y-3 border-t pt-6">
                <Label>Fotos Adicionais</Label>
                <input
                  ref={additionalPhotosRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAdditionalPhotosUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => additionalPhotosRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition"
                >
                  <Upload className="size-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Clique para adicionar mais fotos</p>
                </button>

                {additionalPhotos.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {additionalPhotos.map((photo, idx) => (
                      <div key={idx} className="space-y-2">
                        <img
                          src={photo.url}
                          alt={`Foto adicional ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalPhoto(idx)}
                          className="w-full p-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition flex items-center justify-center gap-1"
                        >
                          <X className="size-3" />
                          Excluir
                        </button>
                        <p className="text-xs text-gray-600 truncate">{photo.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Etapa 2: Diagnósticos */}
          {concludeStep === 2 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Selecione até 10 códigos de diagnóstico ({selectedDiagnostics.length}/10 selecionados)
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto">
                {uniqueGroups.map((group) => (
                  <div key={group} className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">{group}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getDiagnosticsByGroup(group).map((diagnostic) => (
                        <div
                          key={diagnostic.id}
                          className="flex items-start gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleDiagnostic(diagnostic)}
                        >
                          <Checkbox
                            checked={selectedDiagnostics.some((d) => d.id === diagnostic.id)}
                            onChange={() => toggleDiagnostic(diagnostic)}
                            disabled={
                              selectedDiagnostics.length >= 10 &&
                              !selectedDiagnostics.some((d) => d.id === diagnostic.id)
                            }
                          />
                          <div>
                            <p className="font-semibold text-sm">{diagnostic.code}</p>
                            <p className="text-xs text-gray-600">{diagnostic.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Etapa 3: Finalização */}
          {concludeStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="conclude-phase" className="text-base font-semibold">Selecione o Status Final*</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["55", "12"].map((phaseId) => {
                    const phaseOption = phases.find(p => p.id === phaseId);
                    return (
                      <button
                        key={phaseId}
                        type="button"
                        onClick={() => setSelectedConcludePhase(phaseId)}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          selectedConcludePhase === phaseId
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-semibold text-sm">{phaseOption?.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {phaseId === "55" ? "Serviço concluído com sucesso" : "Serviço concluído, porém improcedente"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 mt-6 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/maintenance")}
            >
              Cancelar
            </Button>

            <div className="flex gap-3">
              {concludeStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConcludeStep(concludeStep - 1)}
                >
                  Voltar
                </Button>
              )}
              {concludeStep < 3 && (
                  <Button
                    type="button"
                    onClick={() => setConcludeStep(concludeStep + 1)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Próximo
                  </Button>
              )}
              {concludeStep === 3 && (
                <Button
                  onClick={onConclude}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  Concluir OS
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}