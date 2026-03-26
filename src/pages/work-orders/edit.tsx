import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { ChevronRight } from "lucide-react";
import { loadWorkOrders, saveWorkOrders, mockPlants, mockTeams, serviceTypes, serviceReasons, workOrderSchema } from "./types";
import type { WorkOrder, WorkOrderFormData } from "./types";

export default function WorkOrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    const orders = loadWorkOrders();
    const found = orders.find((wo) => wo.id === id);
    if (!found) {
      navigate("/maintenance");
      return;
    }
    setWorkOrder(found);
    setValue("plant_id", found.plant_id);
    setValue("service_type", found.service_type);
    setValue("service_reason", found.service_reason);
    setValue("observations", found.observations);
    setValue("team_id", found.team_id || "");
    setValue("scheduled_date", found.scheduled_date || "");
  }, [id, navigate, setValue]);

  const onSubmit = (data: WorkOrderFormData) => {
    if (!workOrder) return;

    const orders = loadWorkOrders();
    const updated = orders.map((wo) =>
      wo.id === workOrder.id
        ? {
            ...wo,
            plant_id: data.plant_id,
            plant_name: mockPlants.find((p) => p.id === data.plant_id)?.name || "",
            service_type: data.service_type,
            service_reason: data.service_reason,
            observations: data.observations,
            team_id: data.team_id || null,
            team_name: data.team_id ? mockTeams.find((t) => t.id === data.team_id)?.name || null : null,
            scheduled_date: data.scheduled_date || null,
            phase: wo.phase === "01" && (data.team_id || data.scheduled_date) ? "04" : wo.phase,
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
        <button onClick={() => navigate("/maintenance")} className="hover:text-gray-900">Manutenção</button>
        <ChevronRight className="size-4" />
        <button onClick={() => navigate("/maintenance")} className="hover:text-gray-900">Ordens de Serviço</button>
        <ChevronRight className="size-4" />
        <span className="text-gray-900 font-semibold">Editar {workOrder.wo_id}</span>
      </div>

      <Card className="max-w-4xl mx-auto bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Editar Ordem de Serviço - {workOrder.wo_id}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="plant_id">Usina*</Label>
                <select id="plant_id" className="w-full rounded-md border px-3 py-2" {...register("plant_id")}> 
                  <option value="">Selecione uma usina</option>
                  {mockPlants.map((plant) => <option key={plant.id} value={plant.id}>{plant.name}</option>)}
                </select>
                {errors.plant_id && <p className="text-red-500 text-sm">{errors.plant_id.message}</p>}
              </div>
              <div>
                <Label htmlFor="service_type">Tipo de Serviço*</Label>
                <select id="service_type" className="w-full rounded-md border px-3 py-2" {...register("service_type")}> 
                  <option value="">Selecione o tipo de serviço</option>
                  {serviceTypes.map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}
                </select>
                {errors.service_type && <p className="text-red-500 text-sm">{errors.service_type.message}</p>}
              </div>
              <div>
                <Label htmlFor="service_reason">Motivo do Serviço*</Label>
                <select id="service_reason" className="w-full rounded-md border px-3 py-2" {...register("service_reason")}> 
                  <option value="">Selecione o motivo</option>
                  {serviceReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                </select>
                {errors.service_reason && <p className="text-red-500 text-sm">{errors.service_reason.message}</p>}
              </div>
              <div>
                <Label htmlFor="team_id">Equipe (Opcional)</Label>
                <select id="team_id" className="w-full rounded-md border px-3 py-2" {...register("team_id")}> 
                  <option value="">Sem atribuição</option>
                  {mockTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_date">Data de Programação (Opcional)</Label>
                <input id="scheduled_date" type="date" className="w-full rounded-md border px-3 py-2" {...register("scheduled_date")} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <Label htmlFor="scheduled_time">Hora de Programação (Opcional)</Label>
                <input id="scheduled_time" type="time" className="w-full rounded-md border px-3 py-2" {...register("scheduled_time")} />
              </div>
              <div className="col-span-full">
                <Label htmlFor="observations">Observações*</Label>
                <textarea id="observations" rows={4} className="w-full rounded-md border px-3 py-2" {...register("observations")} />
                {errors.observations && <p className="text-red-500 text-sm">{errors.observations.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/maintenance")}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">Atualizar OS</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}