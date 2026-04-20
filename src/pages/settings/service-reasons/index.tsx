import { useEffect, useMemo, useState } from "react";
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
  FileText,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { apiFetch } from "../../../lib/api";

interface ServiceCode { codServId: number; descricao: string; active: boolean }

interface ServiceReason {
  motServId: number;
  descricao: string;
  active: boolean;
  codServId: number | null;
  createdAt: string;
  updatedAt: string;
  serviceCode?: { codServId: number; descricao: string } | null;
}

const ITEMS_PER_PAGE = 8;

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("pt-BR");
};

export default function ServiceReasonsPage() {
  const [serviceReasons, setServiceReasons] = useState<ServiceReason[]>([]);
  const [serviceCodes, setServiceCodes] = useState<ServiceCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ServiceReason | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ServiceReason | null>(null);

  // form state (shared create/edit)
  const [formDescricao, setFormDescricao] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formCodServId, setFormCodServId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [srRes, scRes] = await Promise.allSettled([
        apiFetch<{ serviceReasons: ServiceReason[] }>("/service-reasons"),
        apiFetch<{ serviceCodes: ServiceCode[] }>("/service-codes"),
      ]);
      if (srRes.status === "fulfilled") setServiceReasons(srRes.value.serviceReasons ?? []);
      if (scRes.status === "fulfilled") setServiceCodes(scRes.value.serviceCodes ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function openCreate() {
    setFormDescricao("");
    setFormActive(true);
    setFormCodServId("");
    setIsCreateDialogOpen(true);
  }

  async function handleCreate() {
    if (!formDescricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    setSaving(true);
    try {
      await apiFetch("/service-reasons", {
        method: "POST",
        body: JSON.stringify({
          descricao: formDescricao.trim(),
          active: formActive,
          codServId: formCodServId ? Number(formCodServId) : null,
        }),
      });
      toast.success("Motivo de serviço cadastrado com sucesso!");
      setIsCreateDialogOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(item: ServiceReason) {
    setItemToEdit(item);
    setFormDescricao(item.descricao);
    setFormActive(item.active);
    setFormCodServId(item.codServId ? String(item.codServId) : "");
    setIsEditDialogOpen(true);
  }

  async function handleEdit() {
    if (!itemToEdit) return;
    if (!formDescricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    setSaving(true);
    try {
      await apiFetch(`/service-reasons/${itemToEdit.motServId}`, {
        method: "PUT",
        body: JSON.stringify({
          descricao: formDescricao.trim(),
          active: formActive,
          codServId: formCodServId ? Number(formCodServId) : null,
        }),
      });
      toast.success("Motivo de serviço atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setItemToEdit(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/service-reasons/${itemToDelete.motServId}`, { method: "DELETE" });
      toast.success("Motivo de serviço excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return serviceReasons;
    return serviceReasons.filter((item) =>
      item.descricao.toLowerCase().includes(q) ||
      String(item.motServId).includes(q) ||
      (item.serviceCode?.descricao ?? "").toLowerCase().includes(q)
    );
  }, [serviceReasons, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return sortOrder === "asc" ? a.descricao.localeCompare(b.descricao) : b.descricao.localeCompare(a.descricao);
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [filtered, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));

  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  useEffect(() => { setCurrentPage(1); }, [search, sortOrder]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const FormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-descricao">Descrição</Label>
        <Input
          id="form-descricao"
          placeholder="Ex: Falha de Comunicação"
          value={formDescricao}
          onChange={(e) => setFormDescricao(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-code">Código de Serviço vinculado</Label>
        <select
          id="form-code"
          value={formCodServId}
          onChange={(e) => setFormCodServId(e.target.value)}
          className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008ed3]/40"
        >
          <option value="">Sem vínculo</option>
          {serviceCodes.filter((sc) => sc.active).map((sc) => (
            <option key={sc.codServId} value={String(sc.codServId)}>{sc.descricao}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="form-active" checked={formActive} onCheckedChange={(c) => setFormActive(c === true)} />
        <Label htmlFor="form-active" className="cursor-pointer">Ativo</Label>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#383F46] p-2 sm:p-3 rounded-lg">
                <FileText className="size-5 sm:size-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold text-black">Motivos de Serviço</h1>
                <p className="text-sm text-gray-500">Gerencie todos os motivos de serviço cadastrados</p>
              </div>
            </div>

            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white gap-2"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              Novo Motivo
            </Button>
          </div>

          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por código, descrição ou serviço"
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

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg sm:text-2xl">Motivos de Serviço Cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Código</TableHead>
                      <TableHead className="text-xs sm:text-sm">Descrição</TableHead>
                      <TableHead className="text-xs sm:text-sm">Serviço Vinculado</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Criado em</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : sorted.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                          {search ? "Nenhum motivo encontrado" : "Nenhum motivo de serviço cadastrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((item) => (
                        <TableRow key={item.motServId} className="text-xs sm:text-sm hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-700">#{item.motServId}</TableCell>
                          <TableCell className="font-medium">{item.descricao}</TableCell>
                          <TableCell>
                            {item.serviceCode ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#e6f4fc] text-[#0055a3]">
                                {item.serviceCode.descricao}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.active ? "bg-[#e6f4fc] text-[#0055a3]" : "bg-gray-100 text-gray-500"}`}>
                              {item.active ? "Ativo" : "Inativo"}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600">{formatDate(item.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-[#e6f4fc] rounded-lg transition-colors inline-flex" title="Editar">
                                <Edit className="size-4 text-[#008ed3] hover:text-[#0055a3]" />
                              </button>
                              <button onClick={() => { setItemToDelete(item); setIsDeleteDialogOpen(true); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex" title="Excluir">
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
                Total de {sorted.length} motivo{sorted.length !== 1 ? "s" : ""} exibido{sorted.length !== 1 ? "s" : ""}
              </div>
              {sorted.length > 0 && (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-gray-500">Página {currentPage} de {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="bg-white">
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="bg-white">
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(o) => setIsCreateDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Motivo de Serviço</DialogTitle>
            <DialogDescription>Informe os dados para criar um novo motivo de serviço.</DialogDescription>
          </DialogHeader>
          <FormFields />
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white">
              {saving ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { setIsEditDialogOpen(o); if (!o) setItemToEdit(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Motivo de Serviço</DialogTitle>
            <DialogDescription>Atualize os dados do motivo de serviço selecionado.</DialogDescription>
          </DialogHeader>
          <FormFields />
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving} className="bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Excluir motivo de serviço</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir o motivo <span className="font-semibold text-gray-900">{itemToDelete?.descricao}</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50" disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
