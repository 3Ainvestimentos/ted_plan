
"use client";

import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { DevProject, DevProjectStatus } from '@/types';
import { startOfDay, endOfDay, differenceInDays, parseISO, addDays, format, eachMonthOfInterval, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import { GanttTaskList } from './gantt-task-list';
import { GanttChartOnly } from './gantt-chart';
import { GanttTimeline } from './gantt-timeline';
import { Card, CardContent } from '../ui/card';

export interface GanttTask {
    id: string;
    name: string;
    level: number;
    responsible: string;
    status: string;
    range: [number, number];
    startDateObj: Date;
    endDateObj: Date;
    isParent: boolean;
    deadline: string;
}

interface GanttViewProps {
    projects: DevProject[];
    onProjectClick: (project: DevProject) => void;
    onStatusChange: (projectId: string, itemId: string, newStatus: DevProjectStatus) => void;
}

export function GanttView({ projects, onProjectClick, onStatusChange }: GanttViewProps) {
    const listScrollRef = useRef<HTMLDivElement>(null);
    const chartScrollRef = useRef<HTMLDivElement>(null);

    const { tasks, startDate, endDate, totalDays, months } = useMemo(() => {
        const allItems: { id: string, name: string, level: number, responsible: string, status: string, startDate: string, deadline: string, isParent: boolean, originalProject: DevProject }[] = [];
        projects.forEach(p => {
            allItems.push({ id: p.id, name: p.name, level: 0, responsible: '', status: 'Pendente', startDate: '', deadline: '', isParent: true, originalProject: p });
            p.items.forEach(i => {
                allItems.push({ id: i.id, name: i.title, level: 1, responsible: i.responsible, status: i.status, startDate: i.startDate, deadline: i.deadline, isParent: i.subItems.length > 0, originalProject: p });
                i.subItems.forEach(si => {
                    allItems.push({ id: si.id, name: si.title, level: 2, responsible: si.responsible, status: si.status, startDate: si.startDate, deadline: si.deadline, isParent: false, originalProject: p });
                });
            });
        });

        if (allItems.filter(item => item.level > 0).length === 0) {
            return { tasks: [], startDate: new Date(), endDate: new Date(), totalDays: 0, months: [] };
        }

        const validDates = allItems
            .filter(t => t.startDate && t.deadline)
            .flatMap(t => [parseISO(t.startDate), parseISO(t.deadline)]);

        if (validDates.length === 0) {
            return { tasks: [], startDate: new Date(), endDate: new Date(), totalDays: 0, months: [] };
        }
        
        const chartStartDate = startOfDay(validDates.reduce((min, d) => d < min ? d : min, validDates[0]));
        const chartEndDate = endOfDay(validDates.reduce((max, d) => d > max ? d : max, validDates[0]));
        const totalDuration = differenceInDays(chartEndDate, chartStartDate) + 1;
        
        const ganttTasks: (GanttTask & { originalProject: DevProject })[] = allItems.map(task => {
            if (!task.startDate || !task.deadline) {
                return { id: task.id, name: task.name, level: task.level, responsible: task.responsible, status: task.status, range: [0, 0], startDateObj: new Date(), endDateObj: new Date(), isParent: task.isParent, deadline: task.deadline, originalProject: task.originalProject };
            }

            const taskStartDateObj = parseISO(task.startDate);
            const taskEndDateObj = parseISO(task.deadline);
            
            const startDay = differenceInDays(taskStartDateObj, chartStartDate);
            const duration = differenceInDays(taskEndDateObj, taskStartDateObj) + 1;
            const endDay = startDay + duration;

            return {
                id: task.id,
                name: task.name,
                level: task.level,
                responsible: task.responsible,
                status: task.status,
                range: [startDay, endDay],
                startDateObj: taskStartDateObj,
                endDateObj: taskEndDateObj,
                isParent: task.isParent,
                deadline: task.deadline,
                originalProject: task.originalProject
            };
        });

        const monthIntervals = eachMonthOfInterval({ start: chartStartDate, end: chartEndDate });
        const monthDetails = monthIntervals.map(monthStart => {
            return {
                name: format(monthStart, 'MMM'),
                days: getDaysInMonth(monthStart),
            };
        });

        return { tasks: ganttTasks, startDate: chartStartDate, endDate: chartEndDate, totalDays: totalDuration, months: monthDetails };
    }, [projects]);
    
    const handleScroll = useCallback((source: 'list' | 'chart') => {
        if (source === 'list' && listScrollRef.current && chartScrollRef.current) {
            chartScrollRef.current.scrollTop = listScrollRef.current.scrollTop;
        }
        if (source === 'chart' && chartScrollRef.current && listScrollRef.current) {
            listScrollRef.current.scrollTop = chartScrollRef.current.scrollTop;
        }
    }, []);

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
        <div className="grid grid-cols-[minmax(450px,55%)_1fr] h-full overflow-hidden border rounded-lg">
            <div className="flex flex-col overflow-hidden">
                <div className="p-2 border-b font-semibold text-sm">
                    <div className="grid grid-cols-4 items-center">
                        <span className="col-span-1">Projeto / Item</span>
                        <span className="text-center">Responsável</span>
                        <span className="text-center">Status</span>
                        <span className="text-center">Prazo</span>
                    </div>
                </div>
                <GanttTaskList 
                    tasks={tasks} 
                    onScroll={(e) => handleScroll('list')} 
                    syncScrollRef={listScrollRef} 
                    onProjectClick={onProjectClick}
                    onStatusChange={onStatusChange}
                />
            </div>
            <div className="flex flex-col overflow-hidden">
                <GanttTimeline months={months} totalDays={totalDays} />
                <GanttChartOnly tasks={tasks} totalDays={totalDays} startDate={startDate} onScroll={(e) => handleScroll('chart')} syncScrollRef={chartScrollRef} />
            </div>
        </div>
    );
}
