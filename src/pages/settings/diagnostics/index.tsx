import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "../../../components/ui/dialog";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../components/ui/table";
import { Plus, Edit, Trash2, Search, Stethoscope } from "lucide-react";
import { apiFetch } from "../../../lib/api";

interface DiagnosticItem {
  diagId: number;
  descricao: string;
  active: boolean;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

const formatDate = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("pt-BR");
};

export default function DiagnosticsPage() {
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editItem, setEditItem] = useState<DiagnosticItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<DiagnosticItem | null>(null);

  const [formDescricao, setFormDescricao] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchItems() {
    setLoading(true);
    try {
      const data = await apiFetch<{ diagnostics: DiagnosticItem[] }>("/diagnostics");
      setItems(data.diagnostics ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar diagnósticos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchItems(); }, []);

  async function handleCreate() {
    if (!formDescricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    setSaving(true);
    try {
      await apiFetch("/diagnostics", {
        method: "POST",
        body: JSON.stringify({ descricao: formDescricao.trim(), active: formActive }),
      });
      toast.success("Diagnóstico criado com sucesso");
      setCreateOpen(false);
      setFormDescricao("");
      setFormActive(true);
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar diagnóstico");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(item: DiagnosticItem) {
    setEditItem(item);
    setFormDescricao(item.descricao);
    setFormActive(item.active);
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editItem) return;
    if (!formDescricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    setSaving(true);
    try {
      await apiFetch(`/diagnostics/${editItem.diagId}`, {
        method: "PUT",
        body: JSON.stringify({ descricao: formDescricao.trim(), active: formActive }),
      });
      toast.success("Diagnóstico atualizado");
      setEditOpen(false);
      setEditItem(null);
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar diagnóstico");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await apiFetch(`/diagnostics/${deleteItem.diagId}`, { method: "DELETE" });
      toast.success("Diagnóstico excluído");
      setDeleteOpen(false);
      setDeleteItem(null);
      await fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir diagnóstico");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.descricao.toLowerCase().includes(q) || String(i.diagId).includes(q));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const FormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="diag-descricao">Descrição</Label>
        <Input
          id="diag-descricao"
          placeholder="Ex: Falha de Comunicação, Módulo Danificado..."
          value={formDescricao}
          onChange={(e) => setFormDescricao(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="diag-active"
          checked={formActive}
          onCheckedChange={(c) => setFormActive(c === true)}
        />
        <Label htmlFor="diag-active" className="cursor-pointer">Ativo</Label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-0 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-lg" style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}>
              <Stethoscope className="size-5 sm:size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Diagnósticos</h1>
              <p className="text-sm text-gray-500">Gerencie os diagnósticos para conclusão de OS</p>
            </div>
          </div>

          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setFormDescricao(""); setFormActive(true); } }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto text-white gap-2" style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}>
                <Plus className="size-4" />
                Novo Diagnóstico
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Diagnóstico</DialogTitle>
                <DialogDescription>Informe a descrição do diagnóstico.</DialogDescription>
              </DialogHeader>
              <FormFields />
              <div className="flex gap-3 justify-end mt-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={saving} className="text-white" style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}>
                  {saving ? "Salvando..." : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Pesquisar diagnóstico..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-white"
          />
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">Diagnósticos Cadastrados ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm">Carregando...</TableCell>
                    </TableRow>
                  ) : paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                        {search ? "Nenhum diagnóstico encontrado" : "Nenhum diagnóstico cadastrado"}
                      </TableCell>
                    </TableRow>
                  ) : paged.map((item) => (
                    <TableRow key={item.diagId} className="text-xs sm:text-sm hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-700">#{item.diagId}</TableCell>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.active ? "bg-[#e6f4fc] text-[#0055a3]" : "bg-gray-100 text-gray-500"}`}>
                          {item.active ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-[#e6f4fc] rounded-lg transition-colors" title="Editar">
                            <Edit className="size-4 text-[#008ed3]" />
                          </button>
                          <button onClick={() => { setDeleteItem(item); setDeleteOpen(true); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                            <Trash2 className="size-4 text-red-500" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Página {currentPage} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                  <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Diagnóstico</DialogTitle>
            <DialogDescription>Atualize os dados do diagnóstico.</DialogDescription>
          </DialogHeader>
          <FormFields />
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving} className="text-white" style={{ background: "linear-gradient(135deg, #008ed3, #0055a3)" }}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Diagnóstico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold">{deleteItem?.descricao}</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
