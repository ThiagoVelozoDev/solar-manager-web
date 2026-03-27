import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { ChevronRight } from "lucide-react";
import { loadWorkOrders, saveWorkOrders, mockPlants, mockTeams, serviceTypes, serviceReasons, workOrderSchema } from "./types";
import type { WorkOrder, WorkOrderFormData } from "./types";

export default function WorkOrderCreatePage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    mode: "onTouched",
  });

  const onSubmit = (data: WorkOrderFormData) => {
    const now = new Date().toISOString().slice(0, 10);
    const current = loadWorkOrders();

    const newOrder: WorkOrder = {
      id: Date.now().toString(),
      wo_id: `WO-${Math.floor(100 + Math.random() * 900)}`,
      plant_id: data.plant_id,
      plant_name: mockPlants.find((p) => p.id === data.plant_id)?.name || "",
      service_type: data.service_type,
      service_reason: data.service_reason,
      phase: "01",
      observations: data.observations,
      team_id: data.team_id || null,
      team_name: data.team_id ? mockTeams.find((t) => t.id === data.team_id)?.name || null : null,
      photos: { plant: null, inverter: null, team: null, vehicle: null },
      additionalPhotos: [],
      diagnostics: [],
      conclusion_solution: null,
      created_at: now,
      scheduled_date: data.scheduled_date || null,
      concluded_date: null,
    };

    saveWorkOrders([...current, newOrder]);
    navigate("/maintenance");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
         <span className="text-gray-900 font-semibold">Ordens de Serviço</span>
        <ChevronRight className="size-4" />
        <span className="text-gray-900 font-semibold">Criar Ordem de Serviço</span>
      </div>

      <Card className="max-w-4xl mx-auto bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Criar Ordem de Serviço</CardTitle>
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
              <Button type="submit" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">Criar OS</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}