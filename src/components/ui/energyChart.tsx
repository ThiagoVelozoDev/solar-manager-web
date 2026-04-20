import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type EnergyUnit = 'kWh' | 'MWh' | 'GWh';

const UNIT_DIVISORS: Record<EnergyUnit, number> = {
  kWh: 1,
  MWh: 1000,
  GWh: 1000000,
};

interface EnergyChartProps {
  data: {
    daily: Array<{ time: string; generation: number | null; target: number }>;
    monthly: Array<{ month: string; generation: number; target: number }>;
  };
}

export function EnergyChart({ data }: EnergyChartProps) {
  const [unit, setUnit] = useState<EnergyUnit>('kWh');
  const divisor = UNIT_DIVISORS[unit];

  const monthlyConverted = data.monthly.map((point) => ({
    ...point,
    generation: Number((point.generation / divisor).toFixed(divisor === 1 ? 0 : 2)),
    target: Number((point.target / divisor).toFixed(divisor === 1 ? 0 : 2)),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg sm:text-2xl">Geração de Energia</CardTitle>
          <div className="flex items-center gap-1" role="group" aria-label="Selecionar unidade de medida">
            <span className="text-xs text-gray-500 mr-1">Unidade:</span>
            {(['kWh', 'MWh', 'GWh'] as EnergyUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`cursor-pointer rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  unit === u
                    ? 'bg-[#0055a3] text-white shadow-sm'
                    : 'border border-[#008ed3]/30 bg-[#e6f4fc] text-[#0055a3] hover:bg-[#008ed3]/10'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="rounded-b-lg bg-gradient-to-b from-[#e6f4fc]/25 to-white">
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full max-w-sm sm:max-w-md grid-cols-2 border border-[#008ed3]/20 bg-[#e6f4fc]/60 p-1">
            <TabsTrigger
              value="daily"
              className="cursor-pointer text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-[#0055a3] data-[state=active]:shadow-sm"
            >
              Hoje
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="cursor-pointer text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-[#0055a3] data-[state=active]:shadow-sm"
            >
              Mensal
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-4 sm:mt-6">
            <ResponsiveContainer width="100%" height={250} minHeight={250}>
              <AreaChart data={data.daily} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorGeneration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008ed3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#008ed3" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  tick={{ angle: -45, textAnchor: 'end', height: 80 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  width={40}
                  label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="generation"
                  stroke="#008ed3"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGeneration)"
                  name="Geração (kW)"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Meta (kW)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="monthly" className="mt-4 sm:mt-6">
            <ResponsiveContainer width="100%" height={250} minHeight={250}>
              <LineChart data={monthlyConverted} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  width={50}
                  label={{ value: unit, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  formatter={(value) => [`${value} ${unit}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="generation"
                  stroke="#008ed3"
                  strokeWidth={3}
                  dot={{ fill: '#008ed3', r: 4 }}
                  name={`Geração (${unit})`}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name={`Meta (${unit})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
