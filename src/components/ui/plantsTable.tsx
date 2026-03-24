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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-lg sm:text-2xl">Clientes - Usinas Solares</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full text-sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-foreground whitespace-nowrap"
                  >
                    Cliente
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs sm:text-sm hidden sm:table-cell">
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center gap-1 hover:text-foreground whitespace-nowrap"
                  >
                    Localização
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs sm:text-sm">Status</TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  <button
                    onClick={() => handleSort('currentGeneration')}
                    className="flex items-center gap-1 hover:text-foreground ml-auto whitespace-nowrap"
                  >
                    Geração
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm hidden md:table-cell">
                  <button
                    onClick={() => handleSort('capacity')}
                    className="flex items-center gap-1 hover:text-foreground ml-auto whitespace-nowrap"
                  >
                    Capacidade
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">
                  <button
                    onClick={() => handleSort('efficiency')}
                    className="flex items-center gap-1 hover:text-foreground ml-auto whitespace-nowrap"
                  >
                    Eficiência
                    <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs sm:text-sm hidden md:table-cell">Meta Mensal</TableHead>
                <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Última Atualização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500 text-xs sm:text-sm">
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
                      className="cursor-pointer hover:bg-gray-50 text-xs sm:text-sm"
                      onClick={() => onSelectPlant(plant)}
                    >
                      <TableCell className="font-medium whitespace-nowrap">{plant.name}</TableCell>
                      <TableCell className="text-gray-600 hidden sm:table-cell whitespace-nowrap">{plant.location}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={`${statusColors[plant.status]} text-white text-xs`}>
                          {statusLabels[plant.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div>
                          <div className="font-medium text-xs sm:text-sm">{plant.currentGeneration.toFixed(1)} kW</div>
                          <Progress value={generationPercentage} className="h-1 w-16 sm:w-20 ml-auto mt-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium hidden md:table-cell whitespace-nowrap">
                        {plant.capacity} kW
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell whitespace-nowrap">
                        <span className={`font-medium text-xs sm:text-sm ${
                          plant.efficiency >= 95 ? 'text-green-600' : 
                          plant.efficiency >= 90 ? 'text-amber-600' : 
                          'text-red-600'
                        }`}>
                          {plant.efficiency}%
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="w-24 lg:w-32">
                          <div className="text-xs lg:text-sm mb-1">
                            {plant.monthlyGeneration.toFixed(0)} / {plant.monthlyTarget} MWh
                          </div>
                          <Progress value={monthlyProgress} className="h-1" />
                          <div className="text-xs text-gray-500 mt-1">
                            {monthlyProgress.toFixed(0)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-500 hidden lg:table-cell whitespace-nowrap">
                        {plant.lastUpdate}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-xs sm:text-sm text-gray-500">
          Mostrando {sortedPlants.length} de {plants.length} clientes
        </div>
      </CardContent>
    </Card>
  );
}
