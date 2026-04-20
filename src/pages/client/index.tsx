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
  Edit2,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  providerId: string;
  idExternalClient: string;
  cliNameClient: string | null;
  userIdUser: number | null;
  userName: string | null;
  compIdCompany: number | null;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
}

type SortDirection = "asc" | "desc";
type ClientSortKey = "id" | "cliNameClient" | "userName" | "companyName" | "idExternalClient";

const clientSchema = z.object({
  providerId: z.string().min(1, "Provedor é obrigatório"),
  cliNameClient: z.string().min(3, "Nome do cliente é obrigatório"),
  userIdUser: z.string().optional(),
  compIdCompany: z.string().optional(),
  idExternalClient: z.string().min(1, "ID externo do cliente é obrigatório"),
});

type ClientFormData = z.infer<typeof clientSchema>;

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

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
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

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [sortKey, setSortKey] = useState<ClientSortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: "onTouched",
    defaultValues: {
      providerId: "solis",
      cliNameClient: "",
      userIdUser: "",
      compIdCompany: "",
      idExternalClient: "",
    },
  });

  const providers = useMemo(
    () => Array.from(new Set(clients.map((item) => item.providerId).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [clients],
  );

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [clientsResponse, companiesResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/companies`),
        fetch(`${API_BASE_URL}/users`),
      ]);

      const [clientsData, companiesData, usersData] = await Promise.all([
        clientsResponse.json().catch(() => null),
        companiesResponse.json().catch(() => null),
        usersResponse.json().catch(() => null),
      ]);

      if (!clientsResponse.ok) throw new Error(clientsData?.error || "Erro ao listar clientes");
      if (!companiesResponse.ok) throw new Error(companiesData?.error || "Erro ao listar empresas");
      if (!usersResponse.ok) throw new Error(usersData?.error || "Erro ao listar usuários");

      setClients(clientsData?.clients ?? []);
      setCompanies(companiesData?.companies ?? []);
      setUsers(usersData?.users ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar clientes";
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
  }, [search, providerFilter, companyFilter, userFilter, sortKey, sortDirection, itemsPerPage]);

  const onSubmit = async (data: ClientFormData) => {
    const payload = {
      providerId: data.providerId,
      cliNameClient: data.cliNameClient,
      userIdUser: data.userIdUser || null,
      compIdCompany: data.compIdCompany || null,
      idExternalClient: data.idExternalClient,
    };

    try {
      const response = await fetch(
        editingClientId ? `${API_BASE_URL}/clients/${editingClientId}` : `${API_BASE_URL}/clients`,
        {
          method: editingClientId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const responseData = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseData?.error || "Erro ao salvar cliente");

      toast.success(editingClientId ? "Cliente atualizado com sucesso" : "Cliente cadastrado com sucesso");
      setIsDialogOpen(false);
      setEditingClientId(null);
      reset();
      await loadPageData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar cliente";
      toast.error(message);
    }
  };

  const onEdit = (client: Client) => {
    setEditingClientId(client.id);
    setValue("providerId", client.providerId || "solis");
    setValue("cliNameClient", client.cliNameClient ?? "");
    setValue("userIdUser", client.userIdUser ? String(client.userIdUser) : "");
    setValue("compIdCompany", client.compIdCompany ? String(client.compIdCompany) : "");
    setValue("idExternalClient", client.idExternalClient);
    setIsDialogOpen(true);
  };

  const onDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, { method: "DELETE" });
      const responseData = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseData?.error || "Erro ao excluir cliente");

      toast.success("Cliente excluído com sucesso");
      await loadPageData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir cliente";
      toast.error(message);
    }
  };

  const toggleSort = (key: ClientSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "id" ? "desc" : "asc");
  };

  const filteredClients = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(client.id).includes(normalizedSearch) ||
        normalizeText(client.cliNameClient).includes(normalizedSearch) ||
        normalizeText(client.idExternalClient).includes(normalizedSearch) ||
        normalizeText(client.userName).includes(normalizedSearch) ||
        normalizeText(client.companyName).includes(normalizedSearch);

      const matchesProvider = providerFilter === "all" || client.providerId === providerFilter;
      const matchesCompany = companyFilter === "all" || String(client.compIdCompany ?? "") === companyFilter;
      const matchesUser = userFilter === "all" || String(client.userIdUser ?? "") === userFilter;

      return matchesSearch && matchesProvider && matchesCompany && matchesUser;
    });
  }, [clients, search, providerFilter, companyFilter, userFilter]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((left, right) => {
      switch (sortKey) {
        case "id":
          return compareValues(Number(left.id), Number(right.id), sortDirection);
        case "cliNameClient":
          return compareValues(left.cliNameClient ?? "", right.cliNameClient ?? "", sortDirection);
        case "userName":
          return compareValues(left.userName ?? "", right.userName ?? "", sortDirection);
        case "companyName":
          return compareValues(left.companyName ?? "", right.companyName ?? "", sortDirection);
        case "idExternalClient":
          return compareValues(left.idExternalClient, right.idExternalClient, sortDirection);
      }
    });
  }, [filteredClients, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedClients.length / itemsPerPage));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedClients.slice(start, start + itemsPerPage);
  }, [sortedClients, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearch("");
    setProviderFilter("all");
    setCompanyFilter("all");
    setUserFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#383F46] p-2 sm:p-3 rounded-lg">
              <User className="size-5 sm:size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Gestão de Clientes</h1>
              <p className="text-sm text-gray-500">Cadastre, filtre e ordene clientes</p>
            </div>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingClientId(null);
                reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white gap-2">
                <Plus className="size-4" />
                {editingClientId ? "Editar Cliente" : "Novo Cliente"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClientId ? "Editar Cliente" : "Cadastrar Cliente"}</DialogTitle>
                <DialogDescription>Preencha os dados do cliente e salve.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="providerId">Provedor</Label>
                  <Input id="providerId" placeholder="solis" {...register("providerId")} />
                  {errors.providerId && <p className="text-sm text-red-500">{errors.providerId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliNameClient">Nome do Cliente</Label>
                  <Input id="cliNameClient" placeholder="Cliente Solar" {...register("cliNameClient")} />
                  {errors.cliNameClient && <p className="text-sm text-red-500">{errors.cliNameClient.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userIdUser">Usuário</Label>
                  <select id="userIdUser" className="w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("userIdUser")}>
                    <option value="">Selecione um usuário</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compIdCompany">Empresa</Label>
                  <select id="compIdCompany" className="w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("compIdCompany")}>
                    <option value="">Selecione uma empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="idExternalClient">ID Externo do Cliente</Label>
                  <Input id="idExternalClient" placeholder="EXT-CLI-01" {...register("idExternalClient")} />
                  {errors.idExternalClient && <p className="text-sm text-red-500">{errors.idExternalClient.message}</p>}
                </div>

                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingClientId(null); reset(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white">
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
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
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por ID, nome, usuário, empresa ou ID externo" className="pl-9" />
              </div>

              <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
                <option value="all">Todos os provedores</option>
                {providers.map((provider) => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>

              <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
                <option value="all">Todos os usuários</option>
                {users.map((user) => (
                  <option key={user.id} value={String(user.id)}>{user.name}</option>
                ))}
              </select>

              <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
                <option value="all">Todas as empresas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
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
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">Clientes Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="ID" active={sortKey === "id"} direction={sortDirection} onClick={() => toggleSort("id")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Nome" active={sortKey === "cliNameClient"} direction={sortDirection} onClick={() => toggleSort("cliNameClient")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Usuário" active={sortKey === "userName"} direction={sortDirection} onClick={() => toggleSort("userName")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="Empresa" active={sortKey === "companyName"} direction={sortDirection} onClick={() => toggleSort("companyName")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm"><SortableHeader label="ID Externo" active={sortKey === "idExternalClient"} direction={sortDirection} onClick={() => toggleSort("idExternalClient")} /></TableHead>
                    <TableHead className="text-xs sm:text-sm text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-xs sm:text-sm">Carregando clientes...</TableCell>
                    </TableRow>
                  ) : paginatedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-xs sm:text-sm">Nenhum cliente encontrado</TableCell>
                    </TableRow>
                  ) : (
                    paginatedClients.map((client) => (
                      <TableRow key={client.id} className="text-xs sm:text-sm hover:bg-gray-50">
                        <TableCell>{client.id}</TableCell>
                        <TableCell>{client.cliNameClient || "-"}</TableCell>
                        <TableCell>{client.userName || "-"}</TableCell>
                        <TableCell>{client.companyName || "-"}</TableCell>
                        <TableCell>{client.idExternalClient}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <button type="button" title="Editar" onClick={() => onEdit(client)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                              <Edit2 className="size-4 text-blue-500" />
                            </button>
                            <button type="button" title="Excluir" onClick={() => onDelete(client.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition">
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

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm text-gray-500">
              <span>Total de {sortedClients.length} cliente{sortedClients.length !== 1 ? "s" : ""} filtrado{sortedClients.length !== 1 ? "s" : ""}</span>
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span>Página {currentPage} de {totalPages}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="bg-white">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="bg-white">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
