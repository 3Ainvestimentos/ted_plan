
"use client";

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import type { Collaborator } from '@/types';
import { useMemo } from 'react';

interface RemunerationChartProps {
    collaborators: Collaborator[];
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function RemunerationChart({ collaborators }: RemunerationChartProps) {
    
    const { chartData, chartConfig } = useMemo(() => {
        const config: ChartConfig = {};
        const allDates = new Set<string>();
        
        collaborators.forEach((collab, index) => {
            config[collab.name] = {
                label: collab.name,
                color: COLORS[index % COLORS.length],
            };
            collab.remunerationHistory?.forEach(h => allDates.add(h.date));
        });

        const sortedDates = Array.from(allDates).sort();
        
        const data = sortedDates.map(date => {
            const entry: any = { date };
            collaborators.forEach(collab => {
                const historyEntry = collab.remunerationHistory?.find(h => h.date === date);
                entry[collab.name] = historyEntry ? historyEntry.value : null;
            });
            return entry;
        });

        // Fill in null values with the previous known value
        for (let i = 1; i < data.length; i++) {
            for (const collab of collaborators) {
                if (data[i][collab.name] === null) {
                    data[i][collab.name] = data[i-1][collab.name];
                }
            }
        }

        return { chartData: data, chartConfig: config };
    }, [collaborators]);

    return (
         <div className="h-96 w-full">
            <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date" 
                             tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC'})}
                        />
                        <YAxis 
                            tickFormatter={(value) => `R$${(value/1000).toLocaleString('pt-BR')}k`}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {collaborators.map((collab, index) => (
                             <Line 
                                key={collab.id} 
                                type="monotone" 
                                dataKey={collab.name} 
                                stroke={COLORS[index % COLORS.length]} 
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
