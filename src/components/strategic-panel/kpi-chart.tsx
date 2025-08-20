
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

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
  data: { name: string; value: number; label: string }[];
}

export function KpiChart({ data }: KpiChartProps) {
  const chartData = data.map(item => ({
    name: item.name,
    value: item.value,
    fill: `var(--color-${item.name})`,
    label: item.label
  }));

  return (
    <div className="h-48 w-full">
       <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    accessibilityLayer
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 0, right: 10, top: 0, bottom: -10 }}
                >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        className="text-xs font-body"
                    />
                    <XAxis dataKey="value" type="number" hide />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--accent))' }}
                        content={
                           <ChartTooltipContent
                                formatter={(value, name) => {
                                    const item = chartData.find(d => d.name === name);
                                    return (
                                        <div className="flex items-center">
                                            <div className="w-2.5 h-2.5 rounded-full mr-2" style={{backgroundColor: `hsl(var(--chart-${chartData.indexOf(item!)+1}))`}}></div>
                                            <span className="capitalize mr-2 text-muted-foreground">{name}:</span>
                                            <span className="font-bold">{item?.label}</span>
                                        </div>
                                    )
                                }}
                                hideLabel
                            />
                        }
                    />
                    <Bar dataKey="value" layout="vertical" radius={5} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    </div>
  );
}
