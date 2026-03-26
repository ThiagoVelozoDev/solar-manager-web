import { z } from "zod";

export type WorkOrderPhoto = {
  url: string;
  name: string;
};

export type DiagnosticCode = {
  id: string;
  code: string;
  description: string;
  group: "NORMAL" | "PROBLEMA";
};

export type WorkOrder = {
  id: string;
  wo_id: string;
  plant_id: string;
  plant_name: string;
  service_type: string;
  service_reason: string;
  phase: string;
  observations: string;
  team_id: string | null;
  team_name: string | null;
  photos: {
    plant: WorkOrderPhoto | null;
    inverter: WorkOrderPhoto | null;
    team: WorkOrderPhoto | null;
    vehicle: WorkOrderPhoto | null;
  };
  additionalPhotos: WorkOrderPhoto[];
  diagnostics: DiagnosticCode[];
  conclusion_solution: string | null;
  created_at: string;
  scheduled_date: string | null;
  concluded_date: string | null;
};

export const phases = [
  { id: "01", name: "Abertura" },
  { id: "04", name: "Programada" },
  { id: "55", name: "Concluído" },
  { id: "12", name: "Improcedente" },
];

export const serviceTypes = [
  { id: "1", name: "Manutenção Preventiva" },
  { id: "2", name: "Manutenção Corretiva" },
  { id: "3", name: "Inspeção" },
  { id: "4", name: "Reparo" },
];

export const serviceReasons = [
  "Manutenção periódica",
  "Falha elétrica",
  "Falha mecânica",
  "Relatório cliente",
];

export const mockPlants = [
  { id: "PLN-001", name: "Thiago Lima Velozo" },
  { id: "PLN-002", name: "Usina Solar Norte" },
  { id: "PLN-003", name: "Usina Solar Sul" },
];

export const mockTeams = [
  { id: "T-001", name: "Equipe A - João" },
  { id: "T-002", name: "Equipe B - Maria" },
  { id: "T-003", name: "Equipe C - Lucas" },
];

export const diagnosticCodes: DiagnosticCode[] = [
  { id: "D1", code: "D1", description: "Painel com sujeira", group: "NORMAL" },
  { id: "D2", code: "D2", description: "Inversor sem comunicação", group: "PROBLEMA" },
  { id: "D3", code: "D3", description: "Falta de aterramento", group: "PROBLEMA" },
  { id: "D4", code: "D4", description: "Itens dentro da normalidade", group: "NORMAL" },
];

export const initialWorkOrders: WorkOrder[] = [
  {
    id: "1",
    wo_id: "WO-001",
    plant_id: "PLN-001",
    plant_name: "Thiago Lima Velozo",
    service_type: "Manutenção Preventiva",
    service_reason: "Manutenção periódica",
    phase: "01",
    observations: "Limpeza dos painéis e verificação geral.",
    team_id: null,
    team_name: null,
    photos: { plant: null, inverter: null, team: null, vehicle: null },
    additionalPhotos: [],
    diagnostics: [],
    conclusion_solution: null,
    created_at: "2026-03-20",
    scheduled_date: null,
    concluded_date: null,
  },
];

export const workOrderSchema = z.object({
  plant_id: z.string().nonempty("Usina é obrigatória"),
  service_type: z.string().nonempty("Tipo de serviço é obrigatório"),
  service_reason: z.string().nonempty("Motivo do serviço é obrigatório"),
  team_id: z.string().optional(),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  observations: z.string().nonempty("Observações são obrigatórias"),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;

const STORAGE_KEY = "work_orders_data";

export const loadWorkOrders = (): WorkOrder[] => {
  if (typeof window === "undefined") return initialWorkOrders;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialWorkOrders;
  try { return JSON.parse(raw) as WorkOrder[]; } catch { return initialWorkOrders; }
};

export const saveWorkOrders = (orders: WorkOrder[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};
