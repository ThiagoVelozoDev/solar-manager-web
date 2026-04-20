import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ArrowUpDown, Building2, ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const companyFormSchema = z.object({
  name: z.string()
    .min(1, "Nome da empresa é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome pode ter no máximo 100 caracteres"),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3000";
const ITEMS_PER_PAGE = 8;

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("pt-BR");
};

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
    reset: resetCreate,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors, isSubmitting: isEditing },
    reset: resetEdit,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
  });

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/companies`);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Erro ao listar empresas");
      }
      setCompanies(data?.companies ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao listar empresas";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const onCreate = async (data: CompanyFormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: data.name }),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error || "Não foi possível cadastrar a empresa");
      }

      toast.success("Empresa cadastrada com sucesso!");
      setIsCreateDialogOpen(false);
      resetCreate();
      await fetchCompanies();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível cadastrar a empresa";
      toast.error(message);
    }
  };

  const openEditDialog = (company: Company) => {
    setCompanyToEdit(company);
    resetEdit({ name: company.name });
    setIsEditDialogOpen(true);
  };

  const onEdit = async (data: CompanyFormData) => {
    if (!companyToEdit) return;

    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: data.name }),
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error || "Não foi possível atualizar a empresa");
      }

      toast.success("Empresa atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setCompanyToEdit(null);
      await fetchCompanies();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível atualizar a empresa";
      toast.error(message);
    }
  };

  const openDeleteDialog = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyToDelete.id}`, {
        method: "DELETE",
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error || "Não foi possível excluir a empresa");
      }

      toast.success("Empresa excluída com sucesso!");
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
      await fetchCompanies();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir a empresa";
      toast.error(message);
    }
  };

  const filteredCompanies = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return companies;
    return companies.filter((company) => company.name.toLowerCase().includes(normalized));
  }, [companies, search]);

  const sortedCompanies = useMemo(() => {
    return [...filteredCompanies].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [filteredCompanies, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedCompanies.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder]);

  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCompanies.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCompanies, currentPage]);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Cabeçalho com Título e Botão */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#383F46] p-2 sm:p-3 rounded-lg">
              <Building2 className="size-5 sm:size-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Gestão de Empresas</h1>
              <p className="text-sm text-gray-500">Gerencie todas as empresas cadastradas</p>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white gap-2">
                <Plus className="size-4" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                <DialogDescription>
                  Informe o nome da empresa para criar um novo cadastro.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitCreate(onCreate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    placeholder="Ex: Solar Tech Brasil"
                    {...registerCreate("name")}
                    autoFocus
                  />
                  {createErrors.name && (
                    <p className="text-sm text-red-500">{createErrors.name.message}</p>
                  )}
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white"
                  >
                    {isCreating ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar empresa por nome"
              className="pl-9 bg-white"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="bg-white gap-2"
          >
            <ArrowUpDown className="size-4" />
            {sortOrder === "desc" ? "Mais recentes" : "Mais antigas"}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Tabela de Empresas */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">
              Empresas Cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Nome</TableHead>
                    <TableHead className="text-xs sm:text-sm">Data de Criação</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                        Carregando empresas...
                      </TableCell>
                    </TableRow>
                  ) : sortedCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                        {search ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCompanies.map((company) => (
                      <TableRow
                        key={company.id}
                        className="text-xs sm:text-sm hover:bg-gray-50"
                      >
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell className="text-gray-600">{formatDate(company.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditDialog(company)}
                              className="p-1.5 hover:bg-[#e6f4fc] rounded-lg transition-colors inline-flex"
                              title="Editar empresa"
                            >
                              <Edit className="size-4 text-[#008ed3] hover:text-[#0055a3]" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(company)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                              title="Deletar empresa"
                            >
                              <Trash2 className="size-4 text-red-500 hover:text-red-600" />
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
              Total de {sortedCompanies.length} empresa{sortedCompanies.length !== 1 ? "s" : ""} exibida{sortedCompanies.length !== 1 ? "s" : ""}
            </div>

            {sortedCompanies.length > 0 && (
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="bg-white"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </main>
      </div>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setCompanyToEdit(null);
            resetEdit({ name: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize os dados da empresa selecionada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">Nome da Empresa</Label>
              <Input
                id="edit-company-name"
                placeholder="Ex: Solar Tech Brasil"
                {...registerEdit("name")}
                autoFocus
              />
              {editErrors.name && (
                <p className="text-sm text-red-500">{editErrors.name.message}</p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isEditing}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isEditing}
                className="bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white"
              >
                {isEditing ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Excluir empresa</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir a empresa{" "}
              <span className="font-semibold text-gray-900">{companyToDelete?.name}</span>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={handleDeleteCompany}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg font-medium transition-all text-sm"
            >
              Excluir
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
