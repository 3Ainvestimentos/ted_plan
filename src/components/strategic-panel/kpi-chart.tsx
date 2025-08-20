
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

const chartConfig = {
  Previsto: {
    label: "Previsto",
    color: "hsl(var(--chart-2))",
  },
  Realizado: {
    label: "Realizado",
    color: "hsl(var(--chart-1))",
  },
  Projetado: {
    label: "Projetado",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface KpiChartProps {
  data: { month: string; Previsto: number; Realizado: number; Projetado: number; }[];
  unit?: string;
}

const formatNumber = (value: number, unit?: string) => {
    const prefix = unit === 'R$' ? 'R$ ' : '';
    const suffix = unit && unit !== 'R$' ? ` ${unit}` : '';
    if (value >= 1000000) {
        return `${prefix}${(value / 1000000).toFixed(1)}M${suffix}`;
    }
    if (value >= 1000) {
        return `${prefix}${(value / 1000).toFixed(0)}k${suffix}`;
    }
    return `${prefix}${value.toLocaleString('pt-BR', { maximumFractionDigits: unit === '%' ? 1 : 0 })}${suffix}`;
};


export function KpiChart({ data, unit }: KpiChartProps) {
  return (
    <div className="h-56 w-full">
       <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 10,
                        left: -10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => formatNumber(value, unit)}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                        content={
                            <ChartTooltipContent 
                                 formatter={(value, name) => (
                                    <div className="flex items-center">
                                      <div
                                        className="w-2.5 h-2.5 rounded-full mr-2"
                                        style={{ backgroundColor: chartConfig[name as keyof typeof chartConfig].color }}
                                      />
                                      <span className="capitalize mr-2 text-muted-foreground">{name}:</span>
                                      <span className="font-bold">{formatNumber(value as number, unit)}</span>
                                    </div>
                                )}
                                hideLabel 
                            />
                        }
                    />
                     <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="Previsto" stroke="var(--color-Previsto)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Realizado" stroke="var(--color-Realizado)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Projetado" stroke="var(--color-Projetado)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    </div>
  );
}
