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
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Plant {
  id: string;
  plantId: number;
  providerId: string;
  plantName: string | null;
  capacityKwp: number | null;
  idExternalClient: string | null;
  latitude: number | null;
  longitude: number | null;
  addressLine: string | null;
  city: string | null;
  stateName: string | null;
  country: string | null;
  compIdCompany: number | null;
  companyName: string | null;
  idExternoUsina: string | null;
  cliIdCliente: number | null;
  clientName: string | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface ClientOption {
  id: string;
  cliNameClient: string | null;
  idExternalClient: string;
}

type SortDirection = "asc" | "desc";
type PlantSortKey = "plantId" | "providerId" | "plantName" | "clientName" | "companyName" | "capacityKwp";

const plantSchema = z.object({
  plantName: z.string().min(3, "Nome da usina é obrigatório"),
  capacityKwp: z.string().min(1, "Capacidade é obrigatória"),
  idExternalClient: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  stateName: z.string().optional(),
  country: z.string().optional(),
  compIdCompany: z.string().optional(),
  idExternoUsina: z.string().min(1, "ID externo da usina é obrigatório"),
  cliIdCliente: z.string().optional(),
});

type PlantFormData = z.infer<typeof plantSchema>;

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

export default function PlantPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [capacityMin, setCapacityMin] = useState("");
  const [capacityMax, setCapacityMax] = useState("");
  const [sortKey, setSortKey] = useState<PlantSortKey>("plantId");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlantFormData>({
    resolver: zodResolver(plantSchema),
    mode: "onTouched",
    defaultValues: {
      plantName: "",
      capacityKwp: "",
      idExternalClient: "",
      latitude: "",
      longitude: "",
      addressLine: "",
      city: "",
      stateName: "",
      country: "",
      compIdCompany: "",
      idExternoUsina: "",
      cliIdCliente: "",
    },
  });

  const selectedClientId = watch("cliIdCliente");

  useEffect(() => {
    const selectedClient = clients.find((item) => item.id === selectedClientId);
    if (selectedClient?.idExternalClient) {
      setValue("idExternalClient", selectedClient.idExternalClient);
    }
  }, [clients, selectedClientId, setValue]);

  const providers = useMemo(
    () => Array.from(new Set(plants.map((item) => item.providerId).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [plants],
  );

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [plantsResponse, companiesResponse, clientsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/plants`),
        fetch(`${API_BASE_URL}/companies`),
        fetch(`${API_BASE_URL}/clients`),
      ]);

      const [plantsData, companiesData, clientsData] = await Promise.all([
        plantsResponse.json().catch(() => null),
        companiesResponse.json().catch(() => null),
        clientsResponse.json().catch(() => null),
      ]);

      if (!plantsResponse.ok) throw new Error(plantsData?.error || "Erro ao listar usinas");
      if (!companiesResponse.ok) throw new Error(companiesData?.error || "Erro ao listar empresas");
      if (!clientsResponse.ok) throw new Error(clientsData?.error || "Erro ao listar clientes");

      setPlants(plantsData?.plants ?? []);
      setCompanies(companiesData?.companies ?? []);
      setClients(clientsData?.clients ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar usinas";
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
  }, [search, providerFilter, clientFilter, companyFilter, capacityMin, capacityMax, sortKey, sortDirection, itemsPerPage]);

  const onSubmit = async (data: PlantFormData) => {
    const payload = {
      plantName: data.plantName,
      capacityKwp: data.capacityKwp,
      idExternalClient: data.idExternalClient || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      addressLine: data.addressLine || null,
      city: data.city || null,
      stateName: data.stateName || null,
      country: data.country || null,
      compIdCompany: data.compIdCompany || null,
      idExternoUsina: data.idExternoUsina,
      cliIdCliente: data.cliIdCliente || null,
    };

    try {
      const response = await fetch(editingPlantId ? `${API_BASE_URL}/plants/${editingPlantId}` : `${API_BASE_URL}/plants`, {
        method: editingPlantId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseData?.error || "Erro ao salvar usina");

      toast.success(editingPlantId ? "Usina atualizada com sucesso" : "Usina cadastrada com sucesso");
      setIsDialogOpen(false);
      setEditingPlantId(null);
      reset();
      await loadPageData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar usina";
      toast.error(message);
    }
  };

  const onEdit = (plant: Plant) => {
    setEditingPlantId(plant.id);
    setValue("plantName", plant.plantName ?? "");
    setValue("capacityKwp", plant.capacityKwp !== null ? String(plant.capacityKwp) : "");
    setValue("idExternalClient", plant.idExternalClient ?? "");
    setValue("latitude", plant.latitude !== null ? String(plant.latitude) : "");
    setValue("longitude", plant.longitude !== null ? String(plant.longitude) : "");
    setValue("addressLine", plant.addressLine ?? "");
    setValue("city", plant.city ?? "");
    setValue("stateName", plant.stateName ?? "");
    setValue("country", plant.country ?? "");
    setValue("compIdCompany", plant.compIdCompany !== null ? String(plant.compIdCompany) : "");
    setValue("idExternoUsina", plant.idExternoUsina ?? "");
    setValue("cliIdCliente", plant.cliIdCliente !== null ? String(plant.cliIdCliente) : "");
    setIsDialogOpen(true);
  };

  const onDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/plants/${id}`, { method: "DELETE" });
      const responseData = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseData?.error || "Erro ao excluir usina");

      toast.success("Usina excluída com sucesso");
      await loadPageData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir usina";
      toast.error(message);
    }
  };

  const toggleSort = (key: PlantSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "plantId" ? "desc" : "asc");
  };

  const filteredPlants = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    const minCapacity = capacityMin ? Number(capacityMin) : null;
    const maxCapacityValue = capacityMax ? Number(capacityMax) : null;

    return plants.filter((plant) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(String(plant.plantId)).includes(normalizedSearch) ||
        normalizeText(plant.providerId).includes(normalizedSearch) ||
        normalizeText(plant.plantName).includes(normalizedSearch) ||
        normalizeText(plant.idExternoUsina).includes(normalizedSearch) ||
        normalizeText(plant.clientName).includes(normalizedSearch) ||
        normalizeText(plant.companyName).includes(normalizedSearch);

      const matchesProvider = providerFilter === "all" || plant.providerId === providerFilter;
      const matchesClient = clientFilter === "all" || String(plant.cliIdCliente ?? "") === clientFilter;
      const matchesCompany = companyFilter === "all" || String(plant.compIdCompany ?? "") === companyFilter;
      const capacity = plant.capacityKwp ?? null;
      const matchesMin = minCapacity === null || (capacity !== null && capacity >= minCapacity);
      const matchesMax = maxCapacityValue === null || (capacity !== null && capacity <= maxCapacityValue);

      return matchesSearch && matchesProvider && matchesClient && matchesCompany && matchesMin && matchesMax;
    });
  }, [plants, search, providerFilter, clientFilter, companyFilter, capacityMin, capacityMax]);

  const sortedPlants = useMemo(() => {
    return [...filteredPlants].sort((left, right) => {
      switch (sortKey) {
        case "plantId":
          return compareValues(left.plantId, right.plantId, sortDirection);
        case "providerId":
          return compareValues(left.providerId, right.providerId, sortDirection);
        case "plantName":
          return compareValues(left.plantName ?? "", right.plantName ?? "", sortDirection);
        case "clientName":
          return compareValues(left.clientName ?? "", right.clientName ?? "", sortDirection);
        case "companyName":
          return compareValues(left.companyName ?? "", right.companyName ?? "", sortDirection);
        case "capacityKwp":
          return compareValues(left.capacityKwp ?? 0, right.capacityKwp ?? 0, sortDirection);
      }
    });
  }, [filteredPlants, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedPlants.length / itemsPerPage));
  const paginatedPlants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPlants.slice(start, start + itemsPerPage);
  }, [sortedPlants, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearch("");
    setProviderFilter("all");
    setClientFilter("all");
    setCompanyFilter("all");
    setCapacityMin("");
    setCapacityMax("");
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
              <p className="text-sm text-gray-500">Cadastre, filtre e ordene usinas</p>
            </div>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingPlantId(null);
                reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white gap-2">
                <Plus className="size-4" />
                {editingPlantId ? "Editar Usina" : "Nova Usina"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPlantId ? "Editar Usina" : "Cadastrar Usina"}</DialogTitle>
                <DialogDescription>Preencha os dados da usina e salve.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plantName">Nome da Usina</Label>
                  <Input id="plantName" placeholder="Usina Solar" {...register("plantName")} />
                  {errors.plantName && <p className="text-sm text-red-500">{errors.plantName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacityKwp">Capacidade (kWp)</Label>
                  <Input id="capacityKwp" placeholder="100" {...register("capacityKwp")} />
                  {errors.capacityKwp && <p className="text-sm text-red-500">{errors.capacityKwp.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliIdCliente">Cliente</Label>
                  <select id="cliIdCliente" className="w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("cliIdCliente")}>
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.cliNameClient || client.idExternalClient}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idExternalClient">ID Externo do Cliente</Label>
                  <Input id="idExternalClient" placeholder="EXT-CLI-01" {...register("idExternalClient")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compIdCompany">Empresa</Label>
                  <select id="compIdCompany" className="w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("compIdCompany")}>
                    <option value="">Selecione uma empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idExternoUsina">ID Externo da Usina</Label>
                  <Input id="idExternoUsina" placeholder="EXT-PLT-01" {...register("idExternoUsina")} />
                  {errors.idExternoUsina && <p className="text-sm text-red-500">{errors.idExternoUsina.message}</p>}
                </div>
                <div className="space-y-2"><Label htmlFor="latitude">Latitude</Label><Input id="latitude" placeholder="-23.550520" {...register("latitude")} /></div>
                <div className="space-y-2"><Label htmlFor="longitude">Longitude</Label><Input id="longitude" placeholder="-46.633308" {...register("longitude")} /></div>
                <div className="space-y-2 md:col-span-2"><Label htmlFor="addressLine">Endereço</Label><Input id="addressLine" placeholder="Rua, número, bairro" {...register("addressLine")} /></div>
                <div className="space-y-2"><Label htmlFor="city">Cidade</Label><Input id="city" placeholder="São Paulo" {...register("city")} /></div>
                <div className="space-y-2"><Label htmlFor="stateName">Estado</Label><Input id="stateName" placeholder="SP" {...register("stateName")} /></div>
                <div className="space-y-2 md:col-span-2"><Label htmlFor="country">País</Label><Input id="country" placeholder="Brasil" {...register("country")} /></div>

                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingPlantId(null); reset(); }}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white">{isSubmitting ? "Salvando..." : "Salvar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
              <div className="relative xl:col-span-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por ID, provedor, nome, cliente, empresa ou ID externo" className="pl-9" />
              </div>
              <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
                <option value="all">Todos os provedores</option>
                {providers.map((provider) => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                <option value="all">Todos os clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.cliNameClient || client.idExternalClient}</option>
                ))}
              </select>
              <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
                <option value="all">Todas as empresas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
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
          <CardHeader><CardTitle className="text-lg sm:text-2xl">Usinas Cadastradas</CardTitle></CardHeader>
          <CardContent className="bg-white">
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="ID" active={sortKey === "plantId"} direction={sortDirection} onClick={() => toggleSort("plantId")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Provedor" active={sortKey === "providerId"} direction={sortDirection} onClick={() => toggleSort("providerId")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Nome" active={sortKey === "plantName"} direction={sortDirection} onClick={() => toggleSort("plantName")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Cliente" active={sortKey === "clientName"} direction={sortDirection} onClick={() => toggleSort("clientName")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Empresa" active={sortKey === "companyName"} direction={sortDirection} onClick={() => toggleSort("companyName")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Capacidade (kWp)" active={sortKey === "capacityKwp"} direction={sortDirection} onClick={() => toggleSort("capacityKwp")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500 text-xs sm:text-sm">Carregando usinas...</TableCell></TableRow>
                  ) : paginatedPlants.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500 text-xs sm:text-sm">Nenhuma usina encontrada</TableCell></TableRow>
                  ) : (
                    paginatedPlants.map((plant) => (
                      <TableRow key={plant.id} className="text-xs sm:text-sm hover:bg-gray-50">
                        <TableCell>{plant.plantId}</TableCell>
                        <TableCell>{plant.providerId}</TableCell>
                        <TableCell>{plant.plantName || "-"}</TableCell>
                        <TableCell>{plant.clientName || "-"}</TableCell>
                        <TableCell>{plant.companyName || "-"}</TableCell>
                        <TableCell>{plant.capacityKwp ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <button title="Editar" onClick={() => onEdit(plant)} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><Edit2 className="size-4 text-blue-500" /></button>
                            <button title="Excluir" onClick={() => onDelete(plant.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 className="size-4 text-red-500" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm text-gray-500">
              <span>Total de {sortedPlants.length} usina{sortedPlants.length !== 1 ? "s" : ""} filtrada{sortedPlants.length !== 1 ? "s" : ""}</span>
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
