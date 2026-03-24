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
import { Building2, Plus, Trash2 } from "lucide-react";

// Interface TypeScript para tipagem
interface Company {
  id: string;
  name: string;
  createdAt: string;
}

// Schema Zod para validação
const companyFormSchema = z.object({
  name: z.string()
    .min(1, "Nome da empresa é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome pode ter no máximo 100 caracteres"),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

// Mock data
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Solar Tech Brasil',
    createdAt: '15/01/2026',
  },
  {
    id: '2',
    name: 'Energia Renovável Ltda',
    createdAt: '20/01/2026',
  },
  {
    id: '3',
    name: 'Green Power Solutions',
    createdAt: '28/01/2026',
  },
  {
    id: '4',
    name: 'SunEnergy Group',
    createdAt: '22/02/2026',
  },
];

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
  });

  const onSubmit = (data: CompanyFormData) => {
    const newCompany: Company = {
      id: Date.now().toString(),
      name: data.name,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
    setCompanies([...companies, newCompany]);
    reset();
    setIsDialogOpen(false);
  };

  const handleDeleteCompany = (id: string) => {
    setCompanies(companies.filter(company => company.id !== id));
  };

  return (
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2">
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    placeholder="Ex: Solar Tech Brasil"
                    {...register('name')}
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Cadastrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
                        Nenhuma empresa cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow
                        key={company.id}
                        className="text-xs sm:text-sm hover:bg-gray-50"
                      >
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell className="text-gray-600">{company.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => handleDeleteCompany(company.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                            title="Deletar empresa"
                          >
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
              Total de {companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
