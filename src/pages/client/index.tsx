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
import { User, Plus, Edit2, Trash2 } from "lucide-react";

interface Client {
  id: string;
  cli_id_client: string;
  user_id_user: string;
  created_at: string;
  updated_at: string;
  comp_id_company: string;
  id_external_client: string;
}

const clientSchema = z.object({
  user_id_user: z.string().min(1, "User ID é obrigatório"),
  comp_id_company: z.string().min(1, "Company ID é obrigatório"),
  id_external_client: z.string().min(1, "ID externo do cliente é obrigatório"),
});

type ClientFormData = z.infer<typeof clientSchema>;

const mockUsers = [
  { id: "USR-001", name: "João Silva" },
  { id: "USR-002", name: "Maria Oliveira" },
  { id: "USR-003", name: "Carlos Pereira" },
];

const mockCompanies = [
  { id: "COMP-01", name: "Solis Energy" },
  { id: "COMP-02", name: "Deye Energy" },
  { id: "COMP-03", name: "Green Power" },
];

const initialClients: Client[] = [
  {
    id: "1",
    cli_id_client: "CLI-001",
    user_id_user: "USR-001",
    created_at: "2026-01-01",
    updated_at: "2026-02-01",
    comp_id_company: "COMP-01",
    id_external_client: "EXT-CLI-01",
  },
  {
    id: "2",
    cli_id_client: "CLI-002",
    user_id_user: "USR-002",
    created_at: "2026-01-15",
    updated_at: "2026-02-10",
    comp_id_company: "COMP-02",
    id_external_client: "EXT-CLI-02",
  },
];

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({ resolver: zodResolver(clientSchema), mode: "onTouched" });

  const onSubmit = (data: ClientFormData) => {
    const now = new Date().toISOString().slice(0, 10);

    if (editingClientId) {
      setClients((prev) =>
        prev.map((item) =>
          item.id === editingClientId
            ? {
                ...item,
                user_id_user: data.user_id_user,
                comp_id_company: data.comp_id_company,
                id_external_client: data.id_external_client,
                updated_at: now,
              }
            : item,
        ),
      );
    } else {
      setClients((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          cli_id_client: `CLI-${Math.floor(100 + Math.random() * 900)}`,
          user_id_user: data.user_id_user,
          comp_id_company: data.comp_id_company,
          id_external_client: data.id_external_client,
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    setIsDialogOpen(false);
    setEditingClientId(null);
    reset();
  };

  const onEdit = (client: Client) => {
    setEditingClientId(client.id);
    setValue("user_id_user", client.user_id_user);
    setValue("comp_id_company", client.comp_id_company);
    setValue("id_external_client", client.id_external_client);
    setIsDialogOpen(true);
  };

  const getUserName = (id: string) => {
    const user = mockUsers.find((u) => u.id === id);
    return user ? `${user.name} (${user.id})` : id;
  };

  const getCompanyName = (id: string) => {
    const company = mockCompanies.find((c) => c.id === id);
    return company ? `${company.name} (${company.id})` : id;
  };

  const onDelete = (id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
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
              <p className="text-sm text-gray-500">Cadastre, edite e exclua clientes</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingClientId(null);
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2">
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
                  <Label htmlFor="user_id_user">User</Label>
                  <select
                    id="user_id_user"
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                    {...register("user_id_user")}
                  >
                    <option value="">Selecione um usuário</option>
                    {mockUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.id})
                      </option>
                    ))}
                  </select>
                  {errors.user_id_user && (
                    <p className="text-sm text-red-500">{errors.user_id_user.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comp_id_company">Company</Label>
                  <select
                    id="comp_id_company"
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                    {...register("comp_id_company")}
                  >
                    <option value="">Selecione uma empresa</option>
                    {mockCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.id})
                      </option>
                    ))}
                  </select>
                  {errors.comp_id_company && (
                    <p className="text-sm text-red-500">{errors.comp_id_company.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="id_external_client">External Client ID</Label>
                  <Input id="id_external_client" placeholder="EXT-CLI-01" {...register("id_external_client")} />
                  {errors.id_external_client && (
                    <p className="text-sm text-red-500">{errors.id_external_client.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingClientId(null);
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
            <CardTitle className="text-lg sm:text-2xl">Clientes Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Client ID</TableHead>
                    <TableHead className="text-xs sm:text-sm">Usuário</TableHead>
                    <TableHead className="text-xs sm:text-sm">Empresa</TableHead>
                    <TableHead className="text-xs sm:text-sm">External Client ID</TableHead>
                    <TableHead className="text-xs sm:text-sm">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                        Nenhum cliente cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id} className="text-xs sm:text-sm hover:bg-gray-50">
                        <TableCell>{client.cli_id_client}</TableCell>
                        <TableCell>{getUserName(client.user_id_user)}</TableCell>
                        <TableCell>{getCompanyName(client.comp_id_company)}</TableCell>
                        <TableCell>{client.id_external_client}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              title="Editar"
                              onClick={() => onEdit(client)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                            >
                              <Edit2 className="size-4 text-blue-500" />
                            </button>
                            <button
                              type="button"
                              title="Excluir"
                              onClick={() => onDelete(client.id)}
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
              Total de {clients.length} cliente{clients.length !== 1 ? "s" : ""} cadastrado{clients.length !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
