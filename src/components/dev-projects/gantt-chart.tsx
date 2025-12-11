
"use client";

import React from 'react';
import type { GanttTask } from './gantt-view';
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from "recharts";
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface GanttChartOnlyProps {
    tasks: GanttTask[];
    totalDays: number;
    startDate: Date;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    syncScrollRef: React.RefObject<HTMLDivElement>;
}

const statusColors: Record<string, string> = {
    'Pendente': 'hsl(var(--muted-foreground) / 0.5)',
    'Em Andamento': 'hsl(var(--primary))',
    'Concluído': 'hsl(var(--chart-2))',
    'Em atraso': 'hsl(var(--destructive) / 0.7)',
};

const TASK_HEIGHT = 41; // Corresponds to h-10 + 1px border from gantt-task-list

export function GanttChartOnly({ tasks, totalDays, startDate, onScroll, syncScrollRef }: GanttChartOnlyProps) {
    return (
        <Card className="rounded-l-none border-l-0 h-full flex flex-col">
            <CardContent
                className="p-0 flex-grow relative overflow-y-auto"
                onScroll={onScroll}
                ref={syncScrollRef}
            >
                <div style={{ height: `${tasks.length * TASK_HEIGHT}px` }} className="relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={tasks}
                            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                            barCategoryGap={0}
                            barGap={0}
                            barSize={TASK_HEIGHT - 12} // Bar height
                        >
                            <XAxis type="number" domain={[0, totalDays]} hide />
                            <YAxis 
                               type="category" 
                               dataKey="id"
                               hide
                               width={0}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                                content={({ payload }) => {
                                    if (payload && payload.length > 0 && payload[0].payload) {
                                        const task = payload[0].payload as GanttTask;
                                        return (
                                            <div className="bg-background p-2 border rounded-lg shadow-lg text-sm">
                                                <p className="font-bold">{task.name}</p>
                                                <p>Responsável: {task.responsible}</p>
                                                <p>Status: {task.status}</p>
                                                <p>Início: {format(task.startDateObj, 'dd/MM/yyyy')}</p>
                                                <p>Fim: {format(task.endDateObj, 'dd/MM/yyyy')}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="range" radius={4}>
                                {tasks.map((task) => (
                                    <Cell key={`cell-${task.id}`} fill={statusColors[task.status] || '#ccc'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
