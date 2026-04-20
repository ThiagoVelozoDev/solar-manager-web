import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { apiFetch } from "../../../lib/api";

interface ServiceCode {
  codServId: number;
  descricao: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const serviceCodeFormSchema = z.object({
  descricao: z
    .string()
    .min(1, "Descrição é obrigatória")
    .min(2, "Descrição deve ter no mínimo 2 caracteres"),
  active: z.boolean(),
});

type ServiceCodeFormData = z.infer<typeof serviceCodeFormSchema>;

const ITEMS_PER_PAGE = 8;

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("pt-BR");
};

export default function ServiceCodesPage() {
  const [serviceCodes, setServiceCodes] = useState<ServiceCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ServiceCode | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ServiceCode | null>(null);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
    reset: resetCreate,
    setValue: setCreateValue,
    watch: watchCreate,
  } = useForm<ServiceCodeFormData>({
    resolver: zodResolver(serviceCodeFormSchema),
    defaultValues: { descricao: "", active: true },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors, isSubmitting: isEditing },
    reset: resetEdit,
    setValue: setEditValue,
    watch: watchEdit,
  } = useForm<ServiceCodeFormData>({
    resolver: zodResolver(serviceCodeFormSchema),
    defaultValues: { descricao: "", active: true },
  });

  const createActive = watchCreate("active");
  const editActive = watchEdit("active");

  const fetchServiceCodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ serviceCodes: ServiceCode[] }>("/service-codes");
      setServiceCodes(data?.serviceCodes ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao listar códigos de serviço";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceCodes();
  }, []);

  const onCreate = async (data: ServiceCodeFormData) => {
    try {
      await apiFetch("/service-codes", {
        method: "POST",
        body: JSON.stringify({ descricao: data.descricao, active: data.active }),
      });
      toast.success("Código de serviço cadastrado com sucesso!");
      setIsCreateDialogOpen(false);
      resetCreate({ descricao: "", active: true });
      await fetchServiceCodes();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível cadastrar o código de serviço";
      toast.error(message);
    }
  };

  const openEditDialog = (item: ServiceCode) => {
    setItemToEdit(item);
    resetEdit({ descricao: item.descricao, active: item.active });
    setIsEditDialogOpen(true);
  };

  const onEdit = async (data: ServiceCodeFormData) => {
    if (!itemToEdit) return;
    try {
      await apiFetch(`/service-codes/${itemToEdit.codServId}`, {
        method: "PUT",
        body: JSON.stringify({ descricao: data.descricao, active: data.active }),
      });
      toast.success("Código de serviço atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setItemToEdit(null);
      await fetchServiceCodes();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível atualizar o código de serviço";
      toast.error(message);
    }
  };

  const openDeleteDialog = (item: ServiceCode) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await apiFetch(`/service-codes/${itemToDelete.codServId}`, { method: "DELETE" });
      toast.success("Código de serviço excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      await fetchServiceCodes();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir o código de serviço";
      toast.error(message);
    }
  };

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return serviceCodes;
    return serviceCodes.filter((item) =>
      item.descricao.toLowerCase().includes(normalized) ||
      String(item.codServId).includes(normalized)
    );
  }, [serviceCodes, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return sortOrder === "asc"
          ? a.descricao.localeCompare(b.descricao)
          : b.descricao.localeCompare(a.descricao);
      }
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [filtered, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          {/* Cabeçalho com Título e Botão */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#383F46] p-2 sm:p-3 rounded-lg">
                <Wrench className="size-5 sm:size-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold text-black">Códigos de Serviço</h1>
                <p className="text-sm text-gray-500">Gerencie todos os códigos de serviço cadastrados</p>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white gap-2">
                  <Plus className="size-4" />
                  Novo Código
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Código de Serviço</DialogTitle>
                  <DialogDescription>
                    Informe os dados para criar um novo código de serviço.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitCreate(onCreate)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-descricao">Descrição</Label>
                    <Input
                      id="create-descricao"
                      placeholder="Ex: Manutenção Preventiva"
                      {...registerCreate("descricao")}
                      autoFocus
                    />
                    {createErrors.descricao && (
                      <p className="text-sm text-red-500">{createErrors.descricao.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="create-active"
                      checked={createActive}
                      onCheckedChange={(checked) => setCreateValue("active", checked === true)}
                    />
                    <Label htmlFor="create-active" className="cursor-pointer">Ativo</Label>
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
                placeholder="Pesquisar por código ou descrição"
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
              {sortOrder === "desc" ? "Mais recentes" : "Mais antigos"}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {/* Tabela de Códigos de Serviço */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg sm:text-2xl">Códigos de Serviço Cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Código</TableHead>
                      <TableHead className="text-xs sm:text-sm">Descrição</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Criado em</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                          Carregando códigos de serviço...
                        </TableCell>
                      </TableRow>
                    ) : sorted.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                          {search ? "Nenhum código encontrado" : "Nenhum código de serviço cadastrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((item) => (
                        <TableRow key={item.codServId} className="text-xs sm:text-sm hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-700">#{item.codServId}</TableCell>
                          <TableCell className="font-medium">{item.descricao}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.active
                                  ? "bg-[#e6f4fc] text-[#0055a3]"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {item.active ? "Ativo" : "Inativo"}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600">{formatDate(item.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => openEditDialog(item)}
                                className="p-1.5 hover:bg-[#e6f4fc] rounded-lg transition-colors inline-flex"
                                title="Editar código de serviço"
                              >
                                <Edit className="size-4 text-[#008ed3] hover:text-[#0055a3]" />
                              </button>
                              <button
                                onClick={() => openDeleteDialog(item)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                                title="Excluir código de serviço"
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
                Total de {sorted.length} código{sorted.length !== 1 ? "s" : ""} exibido{sorted.length !== 1 ? "s" : ""}
              </div>

              {sorted.length > 0 && (
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

      {/* Diálogo de Edição */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setItemToEdit(null);
            resetEdit({ descricao: "", active: true });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Código de Serviço</DialogTitle>
            <DialogDescription>
              Atualize os dados do código de serviço selecionado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Input
                id="edit-descricao"
                placeholder="Ex: Manutenção Preventiva"
                {...registerEdit("descricao")}
                autoFocus
              />
              {editErrors.descricao && (
                <p className="text-sm text-red-500">{editErrors.descricao.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-active"
                checked={editActive}
                onCheckedChange={(checked) => setEditValue("active", checked === true)}
              />
              <Label htmlFor="edit-active" className="cursor-pointer">Ativo</Label>
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

      {/* Diálogo de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Excluir código de serviço</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir o código de serviço{" "}
              <span className="font-semibold text-gray-900">{itemToDelete?.descricao}</span>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancelar
            </AlertDialogCancel>
            <button
              onClick={handleDelete}
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
