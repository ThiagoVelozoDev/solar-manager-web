import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Cpu, Plus, Trash2 } from "lucide-react";

interface Inverter {
  id: string;
  id_external_plant: string;
  invers_serial_number: string;
  invers_brand: string;
  invers_model_inverter: string;
  invers_capacidade_kw: string;
  external_id_inverter: string;
  plant_id: string;
}

const inverterSchema = z.object({
  id_external_plant: z.string().min(1, "ID externo da usina é obrigatório"),
  invers_serial_number: z.string().min(1, "Serial number é obrigatório"),
  invers_brand: z.string().min(1, "Marca é obrigatória"),
  invers_model_inverter: z.string().min(1, "Modelo é obrigatório"),
  invers_capacidade_kw: z.string().min(1, "Potência é obrigatória"),
  external_id_inverter: z.string().min(1, "ID externo do inversor é obrigatório"),
  plant_id: z.string().min(1, "Usina é obrigatória"),
});

type InverterFormData = z.infer<typeof inverterSchema>;

// Mock data para usinas cadastradas
const mockPlants = [
  { id: "PLT-01", name: "Usina Solar Central" },
  { id: "PLT-02", name: "Usina Solar Norte" },
  { id: "PLT-03", name: "Usina Solar Sul" },
  { id: "PLT-04", name: "Usina Solar Leste" },
];

const initialInverters: Inverter[] = [
  {
    id: "1",
    id_external_plant: "PLT-01",
    invers_serial_number: "SN-202601",
    invers_brand: "SolarMax",
    invers_model_inverter: "SM-5000",
    invers_capacidade_kw: "5.0",
    external_id_inverter: "EXT-INV-001",
    plant_id: "PLT-01",
  },
  {
    id: "2",
    id_external_plant: "PLT-02",
    invers_serial_number: "SN-202602",
    invers_brand: "SunPower",
    invers_model_inverter: "SP-6000",
    invers_capacidade_kw: "6.0",
    external_id_inverter: "EXT-INV-002",
    plant_id: "PLT-02",
  },
];

export default function InverterPage() {
  const [inverters, setInverters] = useState<Inverter[]>(initialInverters);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InverterFormData>({ resolver: zodResolver(inverterSchema) });

  const onSubmit = (data: InverterFormData) => {
    const newInverter: Inverter = {
      id: Date.now().toString(),
      ...data,
    };
    setInverters(prev => [...prev, newInverter]);
    reset();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setInverters(prev => prev.filter(inv => inv.id !== id));
  };

  const getPlantName = (plantId: string) => {
    const plant = mockPlants.find(p => p.id === plantId);
    return plant ? `${plant.name} (${plant.id})` : plantId;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#383F46] p-2 sm:p-3 rounded-lg">
              <Cpu className="size-5 sm:size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Gestão de Inversores</h1>
              <p className="text-sm text-gray-500">Cadastre e gerencie seus inversores</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2">
                <Plus className="size-4" />
                Novo Inversor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Inversor</DialogTitle>
                <DialogDescription>Preencha os dados do inversor para cadastrar.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                {[ 
                  { name: "id_external_plant", label: "ID Externo da Usina", placeholder: "PLT-01" },
                  { name: "invers_serial_number", label: "Serial Number", placeholder: "SN-202601" },
                  { name: "invers_brand", label: "Marca", placeholder: "SolarMax" },
                  { name: "invers_model_inverter", label: "Modelo", placeholder: "SM-5000" },
                  { name: "invers_capacidade_kw", label: "Capacidade (kW)", placeholder: "5.0" },
                  { name: "external_id_inverter", label: "ID Externo do Inversor", placeholder: "EXT-INV-001" },
                  { name: "plant_id", label: "Usina", placeholder: "Selecione a usina" },
                ].map(field => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.name === 'plant_id' ? (
                      <select
                        id={field.name}
                        className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                        {...register(field.name as keyof InverterFormData)}
                      >
                        <option value="">Selecione a usina</option>
                        {mockPlants.map(plant => (
                          <option key={plant.id} value={plant.id}>
                            {plant.name} ({plant.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input id={field.name} placeholder={field.placeholder} {...register(field.name as keyof InverterFormData)} />
                    )}
                    {errors[field.name as keyof InverterFormData] && (
                      <p className="text-sm text-red-500">{errors[field.name as keyof InverterFormData]?.message}</p>
                    )}
                  </div>
                ))}

                <div className="md:col-span-2 flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    Salvar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">Inversores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Inversor</TableHead>
                    <TableHead className="text-xs sm:text-sm">Usina</TableHead>
                    <TableHead className="text-xs sm:text-sm">Marca / Modelo</TableHead>
                    <TableHead className="text-xs sm:text-sm">Capacidade (kW)</TableHead>
                    <TableHead className="text-xs sm:text-sm">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inverters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                        Nenhum inversor cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    inverters.map(inv => (
                      <TableRow key={inv.id} className="text-xs sm:text-sm hover:bg-gray-50">
                        <TableCell>{inv.invers_serial_number}</TableCell>
                        <TableCell>{getPlantName(inv.plant_id)}</TableCell>
                        <TableCell>{inv.invers_brand} / {inv.invers_model_inverter}</TableCell>
                        <TableCell>{inv.invers_capacidade_kw}</TableCell>
                        <TableCell>
                          <button onClick={() => handleDelete(inv.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition inline-flex" title="Deletar inversor">
                            <Trash2 className="size-4 text-red-500 hover:text-red-600" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-xs sm:text-sm text-gray-500">
              Total de {inverters.length} inversor{inverters.length !== 1 ? 'es' : ''} cadastrad{inverters.length !== 1 ? 'os' : 'o'}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
