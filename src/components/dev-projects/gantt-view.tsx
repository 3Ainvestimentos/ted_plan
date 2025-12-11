
"use client";

import React, { useMemo } from 'react';
import type { DevProject, DevProjectStatus, DevProjectItem, DevProjectSubItem } from '@/types';
import { startOfDay, endOfDay, parseISO, eachDayOfInterval, isWithinInterval, getMonth, getYear, format, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { ChevronDown, CornerDownRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const OVERDUE_STATUS_OPTIONS: DevProjectStatus[] = ['Em atraso', 'Concluído'];
const BASE_STATUS_OPTIONS: DevProjectStatus[] = ['Pendente', 'Em Andamento', 'Concluído'];

const statusColors: Record<DevProjectStatus, string> = {
    'Pendente': 'bg-gray-300 dark:bg-gray-700',
    'Em Andamento': 'bg-blue-400 dark:bg-blue-600',
    'Concluído': 'bg-green-400 dark:bg-green-600',
    'Em atraso': 'bg-red-400 dark:bg-red-600',
};

interface GanttTask {
    id: string;
    name: string;
    level: number;
    responsible: string;
    status: DevProjectStatus;
    startDate: Date;
    endDate: Date;
    isParent: boolean;
    originalProject: DevProject;
    isOverdue: boolean;
}

interface GanttViewProps {
    projects: DevProject[];
    onProjectClick: (project: DevProject) => void;
    onStatusChange: (projectId: string, itemId: string, newStatus: DevProjectStatus) => void;
}

export function GanttView({ projects, onProjectClick, onStatusChange }: GanttViewProps) {
    const { tasks, dateHeaders, monthHeaders } = useMemo(() => {
        if (!projects || projects.length === 0) {
            return { tasks: [], dateHeaders: [], monthHeaders: [] };
        }

        const allItems: (DevProject | DevProjectItem | DevProjectSubItem)[] = [];
        projects.forEach(p => {
            allItems.push(p);
            p.items.forEach(i => {
                allItems.push(i);
                i.subItems.forEach(si => allItems.push(si));
            });
        });

        const validDates = allItems
            .map(item => 'startDate' in item ? [parseISO(item.startDate), parseISO(item.deadline)] : [])
            .flat()
            .filter(date => date instanceof Date && !isNaN(date.getTime()));

        if (validDates.length === 0) {
             return { tasks: [], dateHeaders: [], monthHeaders: [] };
        }

        const chartStartDate = startOfDay(validDates.reduce((min, d) => d < min ? d : min, validDates[0]));
        const chartEndDate = endOfDay(validDates.reduce((max, d) => d > max ? d : max, validDates[0]));

        const dateHeaders = eachDayOfInterval({ start: chartStartDate, end: chartEndDate });

        const ganttTasks: GanttTask[] = projects.map(p => {
             const itemsWithDates = p.items.filter(i => i.startDate && i.deadline);
             const projectStartDate = itemsWithDates.length > 0 ? itemsWithDates.reduce((min, i) => parseISO(i.startDate) < min ? parseISO(i.startDate) : min, parseISO(itemsWithDates[0].startDate)) : new Date();
             const projectEndDate = itemsWithDates.length > 0 ? itemsWithDates.reduce((max, i) => parseISO(i.deadline) > max ? parseISO(i.deadline) : max, parseISO(itemsWithDates[0].deadline)) : new Date();

            return [{
                id: p.id,
                name: p.name,
                level: 0,
                responsible: '',
                status: 'Pendente' as DevProjectStatus,
                startDate: projectStartDate,
                endDate: projectEndDate,
                isParent: true,
                originalProject: p,
                isOverdue: false,
            }, ...p.items.flatMap(i => [
                {
                    id: i.id, name: i.title, level: 1, responsible: i.responsible, status: i.status, startDate: parseISO(i.startDate), endDate: parseISO(i.deadline), isParent: i.subItems.length > 0, originalProject: p, isOverdue: isBefore(parseISO(i.deadline), startOfDay(new Date())) && i.status !== 'Concluído'
                },
                ...i.subItems.map(si => ({
                    id: si.id, name: si.title, level: 2, responsible: si.responsible, status: si.status, startDate: parseISO(si.startDate), endDate: parseISO(si.deadline), isParent: false, originalProject: p, isOverdue: isBefore(parseISO(si.deadline), startOfDay(new Date())) && si.status !== 'Concluído'
                }))
            ])]
        }).flat();
        
        const monthHeaders: { name: string; colSpan: number }[] = [];
        if (dateHeaders.length > 0) {
            let currentMonth = -1;
            dateHeaders.forEach(date => {
                const month = getMonth(date);
                const year = getYear(date);

                if (month !== currentMonth) {
                    currentMonth = month;
                    monthHeaders.push({ name: format(date, 'MMM yyyy', { locale: ptBR }), colSpan: 1 });
                } else {
                    monthHeaders[monthHeaders.length - 1].colSpan++;
                }
            });
        }
        
        return { tasks: ganttTasks, dateHeaders, monthHeaders };
    }, [projects]);


    if (projects.length === 0) {
        return (
            <Card className="flex items-center justify-center h-full">
                <CardContent>
                    <p className="text-muted-foreground">Nenhum projeto encontrado com os filtros aplicados.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="border-t border-b overflow-x-auto">
             <Table className="min-w-full table-fixed">
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-64 sticky left-0 bg-muted/50 z-10">Projeto / Item</TableHead>
                        <TableHead className="w-32">Responsável</TableHead>
                        <TableHead className="w-40">Status</TableHead>
                        <TableHead className="w-28">Prazo</TableHead>
                        {monthHeaders.map((month, index) => {
                            const dayWidth = 16; 
                            return (
                                <TableHead 
                                    key={index} 
                                    colSpan={month.colSpan} 
                                    className="text-center border-l text-[10px] font-semibold px-0.5 whitespace-nowrap"
                                    style={{ minWidth: `${month.colSpan * dayWidth}px` }}
                                >
                                    {month.name}
                                </TableHead>
                            )
                        })}
                    </TableRow>
                </TableHeader>
                 <TableBody>
                    {tasks.map(task => {
                        const statusToUse = task.isOverdue ? 'Em atraso' : task.status;
                        const statusOptions = task.isOverdue ? OVERDUE_STATUS_OPTIONS : BASE_STATUS_OPTIONS;
                        
                        return (
                             <TableRow key={task.id} className={cn("h-8", task.isOverdue && "bg-destructive/10")}>
                                <TableCell className="sticky left-0 bg-background z-10">
                                     <div className={cn("flex items-center gap-1 truncate",
                                        task.level === 0 && "font-bold",
                                        task.level === 1 && "pl-4",
                                        task.level === 2 && "pl-8"
                                    )}>
                                     {task.level === 0 ? <ChevronDown className="h-4 w-4" /> : task.level === 1 && task.isParent ? <ChevronDown className="h-4 w-4" /> : task.level === 2 ? <CornerDownRight className="h-4 w-4 text-muted-foreground"/> : <span className="w-4 h-4"></span>}

                                    {task.level === 0 ? (
                                        <Button variant="link" className="p-0 h-auto text-current font-bold truncate" onClick={() => onProjectClick(task.originalProject)}>
                                            {task.name}
                                        </Button>
                                    ) : (
                                        <span className="truncate">{task.name}</span>
                                    )}
                                    </div>
                                </TableCell>
                                <TableCell>{task.responsible}</TableCell>
                                <TableCell>
                                    {task.level > 0 && (
                                        <Select 
                                            value={statusToUse} 
                                            onValueChange={(newStatus: DevProjectStatus) => onStatusChange(task.originalProject.id, task.id, newStatus)}
                                        >
                                            <SelectTrigger className="h-8 text-xs px-2 w-[130px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </TableCell>
                                <TableCell>{task.level > 0 ? format(task.endDate, 'dd/MM/yy') : ''}</TableCell>
                                {dateHeaders.map((day, dayIndex) => {
                                    const isInRange = task.level > 0 && isWithinInterval(day, { start: task.startDate, end: task.endDate });
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    return (
                                        <TableCell key={dayIndex} className={cn("p-0 border-l w-4", isWeekend && "bg-muted/50")}>
                                            {isInRange && (
                                                <div className={cn("h-full w-full opacity-70", statusColors[statusToUse])} title={`${task.name}: ${format(task.startDate, 'dd/MM')} - ${format(task.endDate, 'dd/MM')}`}>&nbsp;</div>
                                            )}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

    