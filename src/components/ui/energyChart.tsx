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

interface EnergyChartProps {
  data: {
    daily: Array<{ time: string; generation: number; target: number }>;
    monthly: Array<{ month: string; generation: number; target: number }>;
  };
}

export function EnergyChart({ data }: EnergyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-2xl">Geração de Energia</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full max-w-sm sm:max-w-md grid-cols-2">
            <TabsTrigger value="daily" className="text-xs sm:text-sm">Hoje</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">Mensal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-4 sm:mt-6">
            <ResponsiveContainer width="100%" height={250} minHeight={250}>
              <AreaChart data={data.daily} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorGeneration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
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
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGeneration)"
                  name="Geração (kW)"
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
              <LineChart data={data.monthly} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  width={40}
                  label={{ value: 'MWh', angle: -90, position: 'insideLeft' }}
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
                <Line
                  type="monotone"
                  dataKey="generation"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Geração (MWh)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Meta (MWh)"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
