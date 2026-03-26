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
import { Building2, Plus, Edit2, Trash2 } from "lucide-react";

interface Plant {
  id: string;
  plant_id: string;
  capacity_kwp: string;
  id_external_client: string;
  plant_name: string;
  latitude: string;
  longitude: string;
  comp_id_company: string;
  id_externo_usina: string;
  cli_id_cliente: string;
}

const plantSchema = z.object({
  plant_name: z.string().min(3, "Nome da usina é obrigatório"),
  capacity_kwp: z.string().min(1, "Capacidade é obrigatória"),
  id_external_client: z.string().min(1, "ID external client é obrigatório"),
  latitude: z.string().min(1, "Latitude é obrigatória"),
  longitude: z.string().min(1, "Longitude é obrigatória"),
  comp_id_company: z.string().min(1, "Company ID é obrigatório"),
  id_externo_usina: z.string().min(1, "ID externo usina é obrigatório"),
  cli_id_cliente: z.string().min(1, "ID cliente é obrigatório"),
});

type PlantFormData = z.infer<typeof plantSchema>;

const initialPlants: Plant[] = [
  {
    id: "1",
    plant_id: "PLT-100",
    capacity_kwp: "100",
    id_external_client: "CLIEXT-01",
    plant_name: "Usina Sol Nascente",
    latitude: "-23.550520",
    longitude: "-46.633308",
    comp_id_company: "COMP-01",
    id_externo_usina: "EXT-PLT-01",
    cli_id_cliente: "CLI-01",
  },
  {
    id: "2",
    plant_id: "PLT-200",
    capacity_kwp: "150",
    id_external_client: "CLIEXT-02",
    plant_name: "Usina Luar do Sertão",
    latitude: "-22.970722",
    longitude: "-43.182365",
    comp_id_company: "COMP-02",
    id_externo_usina: "EXT-PLT-02",
    cli_id_cliente: "CLI-02",
  },
];

export default function PlantPage() {
  const [plants, setPlants] = useState<Plant[]>(initialPlants);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PlantFormData>({ resolver: zodResolver(plantSchema), mode: "onTouched" });

  const onSubmit = (data: PlantFormData) => {
    if (editingPlantId) {
      setPlants((prev) =>
        prev.map((plant) =>
          plant.id === editingPlantId
            ? {
                ...plant,
                ...data,
              }
            : plant,
        ),
      );
    } else {
      setPlants((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          plant_id: `PLT-${Math.floor(Math.random() * 900 + 100)}`,
          ...data,
        },
      ]);
    }

    setIsDialogOpen(false);
    setEditingPlantId(null);
    reset();
  };

  const onEdit = (plant: Plant) => {
    setEditingPlantId(plant.id);
    setValue("plant_name", plant.plant_name);
    setValue("capacity_kwp", plant.capacity_kwp);
    setValue("id_external_client", plant.id_external_client);
    setValue("latitude", plant.latitude);
    setValue("longitude", plant.longitude);
    setValue("comp_id_company", plant.comp_id_company);
    setValue("id_externo_usina", plant.id_externo_usina);
    setValue("cli_id_cliente", plant.cli_id_cliente);
    setIsDialogOpen(true);
  };

  const onDelete = (id: string) => {
    setPlants((prev) => prev.filter((plant) => plant.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#383F46] p-2 sm:p-3 rounded-lg">
              <Building2 className="size-5 sm:size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Gestão de Usinas</h1>
              <p className="text-sm text-gray-500">Cadastre, edite e exclua usinas</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingPlantId(null);
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2">
                <Plus className="size-4" />
                {editingPlantId ? "Editar Usina" : "Nova Usina"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPlantId ? "Editar Usina" : "Cadastrar Usina"}</DialogTitle>
                <DialogDescription>Preencha os dados de usina e salve.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "plant_name", label: "Nome da Usina", placeholder: "Usina Solar" },
                  { name: "capacity_kwp", label: "Capacidade (kWp)", placeholder: "100" },
                  { name: "id_external_client", label: "ID Externo do Cliente", placeholder: "CLIEXT-01" },
                  { name: "latitude", label: "Latitude", placeholder: "-23.550520" },
                  { name: "longitude", label: "Longitude", placeholder: "-46.633308" },
                  { name: "comp_id_company", label: "ID da Empresa", placeholder: "COMP-01" },
                  { name: "id_externo_usina", label: "ID Externo da Usina", placeholder: "EXT-PLT-01" },
                  { name: "cli_id_cliente", label: "ID Cliente", placeholder: "CLI-01" },
                ].map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      placeholder={field.placeholder}
                      {...register(field.name as keyof PlantFormData)}
                    />
                    {errors[field.name as keyof PlantFormData] && (
                      <p className="text-sm text-red-500">{errors[field.name as keyof PlantFormData]?.message}</p>
                    )}
                  </div>
                ))}

                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingPlantId(null);
                      reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Salvar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">Usinas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">ID</TableHead>
                    <TableHead className="text-xs sm:text-sm">Nome</TableHead>
                    <TableHead className="text-xs sm:text-sm">Capacidade (kWp)</TableHead>
                    <TableHead className="text-xs sm:text-sm">Comp. ID</TableHead>
                    <TableHead className="text-xs sm:text-sm">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                        Nenhuma usina cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    plants.map((plant) => (
                      <TableRow key={plant.id} className="text-xs sm:text-sm hover:bg-gray-50">
                        <TableCell>{plant.plant_id}</TableCell>
                        <TableCell>{plant.plant_name}</TableCell>
                        <TableCell>{plant.capacity_kwp}</TableCell>
                        <TableCell>{plant.comp_id_company}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <button
                              title="Editar"
                              onClick={() => onEdit(plant)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                            >
                              <Edit2 className="size-4 text-blue-500" />
                            </button>
                            <button
                              title="Excluir"
                              onClick={() => onDelete(plant.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition"
                            >
                              <Trash2 className="size-4 text-red-500" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-xs sm:text-sm text-gray-500">
              Total de {plants.length} usina{plants.length !== 1 ? "s" : ""} cadastrada{plants.length !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
