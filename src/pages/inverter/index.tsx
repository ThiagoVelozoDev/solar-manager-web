import { useEffect, useMemo, useState } from "react";
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
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Edit2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Inverter {
  id: string;
  providerId: string;
  externalIdInverter: string;
  inversSerialNumber: string | null;
  idExternalPlant: string | null;
  inversBrand: string | null;
  inversModelInverter: string | null;
  inversCapacidadeKw: number | null;
  plantId: number | null;
  plantName: string | null;
  compIdCompany: number | null;
  companyName: string | null;
  updatedAt: string;
}

interface PlantOption {
  id: string;
  plantId: number;
  plantName: string | null;
  idExternoUsina: string | null;
}

type SortDirection = "asc" | "desc";
type InverterSortKey = "inversSerialNumber" | "plantName" | "brandModel" | "inversCapacidadeKw";

const inverterSchema = z.object({
  providerId: z.string().min(1, "Provedor é obrigatório"),
  externalIdInverter: z.string().min(1, "ID externo do inversor é obrigatório"),
  inversSerialNumber: z.string().min(1, "Serial number é obrigatório"),
  idExternalPlant: z.string().optional(),
  inversBrand: z.string().min(1, "Marca é obrigatória"),
  inversModelInverter: z.string().min(1, "Modelo é obrigatório"),
  inversCapacidadeKw: z.string().min(1, "Potência é obrigatória"),
  plantId: z.string().optional(),
  compIdCompany: z.string().optional(),
});

type InverterFormData = z.infer<typeof inverterSchema>;

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3000";

const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const compareValues = (left: string | number, right: string | number, direction: SortDirection) => {
  const result = typeof left === "number" && typeof right === "number"
    ? left - right
    : String(left).localeCompare(String(right), "pt-BR", { sensitivity: "base" });
  return direction === "asc" ? result : -result;
};

function SortableHeader({ label, active, direction, onClick }: { label: string; active: boolean; direction: SortDirection; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 font-medium text-left">
      <span>{label}</span>
      {active ? (
        direction === "asc" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />
      ) : (
        <ArrowUpDown className="size-4 text-gray-400" />
      )}
    </button>
  );
}

export default function InverterPage() {
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [plants, setPlants] = useState<PlantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInverterId, setEditingInverterId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [plantFilter, setPlantFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("");
  const [capacityMin, setCapacityMin] = useState("");
  const [capacityMax, setCapacityMax] = useState("");
  const [sortKey, setSortKey] = useState<InverterSortKey>("inversSerialNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InverterFormData>({
    resolver: zodResolver(inverterSchema),
    defaultValues: {
      providerId: "solis",
      externalIdInverter: "",
      inversSerialNumber: "",
      idExternalPlant: "",
      inversBrand: "",
      inversModelInverter: "",
      inversCapacidadeKw: "",
      plantId: "",
      compIdCompany: "",
    },
  });

  const selectedPlantId = watch("plantId");

  useEffect(() => {
    const selectedPlant = plants.find((item) => String(item.plantId) === selectedPlantId);
    if (selectedPlant?.idExternoUsina) {
      setValue("idExternalPlant", selectedPlant.idExternoUsina);
    }
  }, [plants, selectedPlantId, setValue]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [invertersResponse, plantsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/inverters`),
        fetch(`${API_BASE_URL}/plants`),
      ]);

      const [invertersData, plantsData] = await Promise.all([
        invertersResponse.json().catch(() => null),
        plantsResponse.json().catch(() => null),
      ]);

      if (!invertersResponse.ok) throw new Error(invertersData?.error || "Erro ao listar inversores");
      if (!plantsResponse.ok) throw new Error(plantsData?.error || "Erro ao listar usinas");

      setInverters(invertersData?.inverters ?? []);
      setPlants(plantsData?.plants ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar inversores";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, plantFilter, brandFilter, capacityMin, capacityMax, sortKey, sortDirection, itemsPerPage]);

  const onSubmit = async (data: InverterFormData) => {
    const payload = {
      providerId: data.providerId,
      externalIdInverter: data.externalIdInverter,
      inversSerialNumber: data.inversSerialNumber,
      idExternalPlant: data.idExternalPlant || null,
      inversBrand: data.inversBrand,
      inversModelInverter: data.inversModelInverter,
      inversCapacidadeKw: data.inversCapacidadeKw,
      plantId: data.plantId || null,
      compIdCompany: data.compIdCompany || null,
    };

    try {
      const response = await fetch(editingInverterId ? `${API_BASE_URL}/inverters/${editingInverterId}` : `${API_BASE_URL}/inverters`, {
        method: editingInverterId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseData?.error || "Erro ao salvar inversor");

      toast.success(editingInverterId ? "Inversor atualizado com sucesso" : "Inversor cadastrado com sucesso");
      reset();
      setEditingInverterId(null);
      setIsDialogOpen(false);
      await loadPageData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar inversor";
      toast.error(message);
    }
  };

  const handleEdit = (inverter: Inverter) => {
    setEditingInverterId(inverter.id);
    setValue("providerId", inverter.providerId || "solis");
    setValue("externalIdInverter", inverter.externalIdInverter);
    setValue("inversSerialNumber", inverter.inversSerialNumber ?? "");
    setValue("idExternalPlant", inverter.idExternalPlant ?? "");
    setValue("inversBrand", inverter.inversBrand ?? "");
    setValue("inversModelInverter", inverter.inversModelInverter ?? "");
    setValue("inversCapacidadeKw", inverter.inversCapacidadeKw !== null ? String(inverter.inversCapacidadeKw) : "");
    setValue("plantId", inverter.plantId !== null ? String(inverter.plantId) : "");
    setValue("compIdCompany", inverter.compIdCompany !== null ? String(inverter.compIdCompany) : "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inverters/${id}`, { method: "DELETE" });
      const responseData = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseData?.error || "Erro ao excluir inversor");

      toast.success("Inversor excluído com sucesso");
      await loadPageData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir inversor";
      toast.error(message);
    }
  };

  const toggleSort = (key: InverterSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "inversCapacidadeKw" ? "desc" : "asc");
  };

  const filteredInverters = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    const normalizedBrand = normalizeText(brandFilter);
    const minCapacity = capacityMin ? Number(capacityMin) : null;
    const maxCapacityValue = capacityMax ? Number(capacityMax) : null;

    return inverters.filter((inverter) => {
      const brandModel = `${inverter.inversBrand ?? ""} ${inverter.inversModelInverter ?? ""}`;
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(inverter.inversSerialNumber).includes(normalizedSearch) ||
        normalizeText(inverter.externalIdInverter).includes(normalizedSearch) ||
        normalizeText(inverter.plantName).includes(normalizedSearch) ||
        normalizeText(brandModel).includes(normalizedSearch);
      const matchesPlant = plantFilter === "all" || String(inverter.plantId ?? "") === plantFilter;
      const matchesBrand = !normalizedBrand || normalizeText(brandModel).includes(normalizedBrand);
      const capacity = inverter.inversCapacidadeKw ?? null;
      const matchesMin = minCapacity === null || (capacity !== null && capacity >= minCapacity);
      const matchesMax = maxCapacityValue === null || (capacity !== null && capacity <= maxCapacityValue);

      return matchesSearch && matchesPlant && matchesBrand && matchesMin && matchesMax;
    });
  }, [inverters, search, plantFilter, brandFilter, capacityMin, capacityMax]);

  const sortedInverters = useMemo(() => {
    return [...filteredInverters].sort((left, right) => {
      switch (sortKey) {
        case "inversSerialNumber":
          return compareValues(left.inversSerialNumber ?? left.externalIdInverter, right.inversSerialNumber ?? right.externalIdInverter, sortDirection);
        case "plantName":
          return compareValues(left.plantName ?? "", right.plantName ?? "", sortDirection);
        case "brandModel":
          return compareValues(`${left.inversBrand ?? ""} ${left.inversModelInverter ?? ""}`, `${right.inversBrand ?? ""} ${right.inversModelInverter ?? ""}`, sortDirection);
        case "inversCapacidadeKw":
          return compareValues(left.inversCapacidadeKw ?? 0, right.inversCapacidadeKw ?? 0, sortDirection);
      }
    });
  }, [filteredInverters, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedInverters.length / itemsPerPage));
  const paginatedInverters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedInverters.slice(start, start + itemsPerPage);
  }, [sortedInverters, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearch("");
    setPlantFilter("all");
    setBrandFilter("");
    setCapacityMin("");
    setCapacityMax("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#383F46] p-2 sm:p-3 rounded-lg"><Cpu className="size-5 sm:size-6 text-white" /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Gestão de Inversores</h1>
              <p className="text-sm text-gray-500">Cadastre, filtre e ordene inversores</p>
            </div>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingInverterId(null);
                reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2">
                <Plus className="size-4" />
                {editingInverterId ? "Editar Inversor" : "Novo Inversor"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingInverterId ? "Editar Inversor" : "Adicionar Novo Inversor"}</DialogTitle>
                <DialogDescription>Preencha os dados do inversor para cadastrar.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="providerId">Provedor</Label><Input id="providerId" placeholder="solis" {...register("providerId")} />{errors.providerId && <p className="text-sm text-red-500">{errors.providerId.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="externalIdInverter">ID Externo do Inversor</Label><Input id="externalIdInverter" placeholder="EXT-INV-001" {...register("externalIdInverter")} />{errors.externalIdInverter && <p className="text-sm text-red-500">{errors.externalIdInverter.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="inversSerialNumber">Serial Number</Label><Input id="inversSerialNumber" placeholder="SN-202601" {...register("inversSerialNumber")} />{errors.inversSerialNumber && <p className="text-sm text-red-500">{errors.inversSerialNumber.message}</p>}</div>
                <div className="space-y-2">
                  <Label htmlFor="plantId">Usina</Label>
                  <select id="plantId" className="w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("plantId")}>
                    <option value="">Selecione a usina</option>
                    {plants.map((plant) => (
                      <option key={plant.id} value={plant.plantId}>{plant.plantName || plant.idExternoUsina || plant.plantId}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2"><Label htmlFor="idExternalPlant">ID Externo da Usina</Label><Input id="idExternalPlant" placeholder="EXT-PLT-01" {...register("idExternalPlant")} /></div>
                <div className="space-y-2"><Label htmlFor="inversBrand">Marca</Label><Input id="inversBrand" placeholder="SolarMax" {...register("inversBrand")} />{errors.inversBrand && <p className="text-sm text-red-500">{errors.inversBrand.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="inversModelInverter">Modelo</Label><Input id="inversModelInverter" placeholder="SM-5000" {...register("inversModelInverter")} />{errors.inversModelInverter && <p className="text-sm text-red-500">{errors.inversModelInverter.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="inversCapacidadeKw">Capacidade (kW)</Label><Input id="inversCapacidadeKw" placeholder="5.0" {...register("inversCapacidadeKw")} />{errors.inversCapacidadeKw && <p className="text-sm text-red-500">{errors.inversCapacidadeKw.message}</p>}</div>
                <div className="space-y-2 md:col-span-2"><Label htmlFor="compIdCompany">ID da Empresa</Label><Input id="compIdCompany" placeholder="1" {...register("compIdCompany")} /></div>

                <div className="md:col-span-2 flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">{isSubmitting ? "Salvando..." : "Salvar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              <div className="relative xl:col-span-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por serial, ID externo, usina ou marca/modelo" className="pl-9" />
              </div>
              <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={plantFilter} onChange={(event) => setPlantFilter(event.target.value)}>
                <option value="all">Todas as usinas</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={String(plant.plantId)}>{plant.plantName || plant.idExternoUsina || plant.plantId}</option>
                ))}
              </select>
              <Input value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} placeholder="Filtrar por marca/modelo" />
              <Input value={capacityMin} onChange={(event) => setCapacityMin(event.target.value)} placeholder="Capacidade mínima" />
              <Input value={capacityMax} onChange={(event) => setCapacityMax(event.target.value)} placeholder="Capacidade máxima" />
            </div>

            <div className="mt-3 flex flex-col sm:flex-row justify-between gap-3">
              <Button type="button" variant="outline" onClick={clearFilters} className="w-full sm:w-auto gap-2 bg-white">
                <X className="size-4" />
                Limpar filtros
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Linhas por página</span>
                <select className="rounded-md border bg-white px-3 py-2 text-sm" value={String(itemsPerPage)} onChange={(event) => setItemsPerPage(Number(event.target.value))}>
                  {[5, 10, 20, 30].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader><CardTitle className="text-lg sm:text-2xl">Inversores Cadastrados</CardTitle></CardHeader>
          <CardContent className="bg-white">
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Inversor" active={sortKey === "inversSerialNumber"} direction={sortDirection} onClick={() => toggleSort("inversSerialNumber")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Usina" active={sortKey === "plantName"} direction={sortDirection} onClick={() => toggleSort("plantName")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Marca / Modelo" active={sortKey === "brandModel"} direction={sortDirection} onClick={() => toggleSort("brandModel")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Capacidade (kW)" active={sortKey === "inversCapacidadeKw"} direction={sortDirection} onClick={() => toggleSort("inversCapacidadeKw")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500 text-xs sm:text-sm">Carregando inversores...</TableCell></TableRow>
                  ) : paginatedInverters.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500 text-xs sm:text-sm">Nenhum inversor encontrado</TableCell></TableRow>
                  ) : (
                    paginatedInverters.map((inv) => (
                      <TableRow key={inv.id} className="text-xs sm:text-sm hover:bg-gray-50">
                        <TableCell>{inv.inversSerialNumber || inv.externalIdInverter}</TableCell>
                        <TableCell>{inv.plantName || "-"}</TableCell>
                        <TableCell>{`${inv.inversBrand || "-"} / ${inv.inversModelInverter || "-"}`}</TableCell>
                        <TableCell>{inv.inversCapacidadeKw ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleEdit(inv)} className="p-1.5 hover:bg-gray-100 rounded-lg transition inline-flex" title="Editar inversor"><Edit2 className="size-4 text-blue-500" /></button>
                            <button onClick={() => handleDelete(inv.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition inline-flex" title="Deletar inversor"><Trash2 className="size-4 text-red-500 hover:text-red-600" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm text-gray-500">
              <span>Total de {sortedInverters.length} inversor{sortedInverters.length !== 1 ? "es" : ""} filtrad{sortedInverters.length !== 1 ? "os" : "o"}</span>
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span>Página {currentPage} de {totalPages}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="bg-white"><ChevronLeft className="size-4" /></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="bg-white"><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
