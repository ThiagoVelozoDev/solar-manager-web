import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Search, ArrowUpDown } from "lucide-react";
import { type SolarPlant } from "../ui/plantCard";

interface PlantsTableProps {
  plants: SolarPlant[];
  onSelectPlant: (plant: SolarPlant) => void;
}

export function PlantsTable({ plants, onSelectPlant }: PlantsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof SolarPlant | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const statusColors = {
    online: 'bg-green-500',
    warning: 'bg-amber-500',
    offline: 'bg-red-500',
  };

  const statusLabels = {
    online: 'Online',
    warning: 'Atenção',
    offline: 'Offline',
  };

  const handleSort = (field: keyof SolarPlant) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredPlants = plants.filter((plant) =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPlants = [...filteredPlants].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === "asc" 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Clientes - Usinas Solares</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Buscar cliente ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Cliente
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Localização
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('currentGeneration')}
                    className="flex items-center gap-1 hover:text-foreground ml-auto"
                  >
                    Geração Atual
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('capacity')}
                    className="flex items-center gap-1 hover:text-foreground ml-auto"
                  >
                    Capacidade
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={() => handleSort('efficiency')}
                    className="flex items-center gap-1 hover:text-foreground ml-auto"
                  >
                    Eficiência
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead>Meta Mensal</TableHead>
                <TableHead>Última Atualização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedPlants.map((plant) => {
                  const generationPercentage = (plant.currentGeneration / plant.capacity) * 100;
                  const monthlyProgress = (plant.monthlyGeneration / plant.monthlyTarget) * 100;
                  
                  return (
                    <TableRow
                      key={plant.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onSelectPlant(plant)}
                    >
                      <TableCell className="font-medium">{plant.name}</TableCell>
                      <TableCell className="text-gray-600">{plant.location}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[plant.status]} text-white`}>
                          {statusLabels[plant.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">{plant.currentGeneration.toFixed(1)} kW</div>
                          <Progress value={generationPercentage} className="h-1 w-20 ml-auto mt-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {plant.capacity} kW
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${
                          plant.efficiency >= 95 ? 'text-green-600' : 
                          plant.efficiency >= 90 ? 'text-amber-600' : 
                          'text-red-600'
                        }`}>
                          {plant.efficiency}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <div className="text-sm mb-1">
                            {plant.monthlyGeneration.toFixed(0)} / {plant.monthlyTarget} MWh
                          </div>
                          <Progress value={monthlyProgress} className="h-1" />
                          <div className="text-xs text-gray-500 mt-1">
                            {monthlyProgress.toFixed(0)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {plant.lastUpdate}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Mostrando {sortedPlants.length} de {plants.length} clientes
        </div>
      </CardContent>
    </Card>
  );
}
