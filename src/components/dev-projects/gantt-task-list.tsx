
"use client";

import React from 'react';
import type { GanttTask } from './gantt-view';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';
import { Badge } from '../ui/badge';
import type { DevProjectStatus, DevProject } from '@/types';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const BASE_STATUS_OPTIONS: DevProjectStatus[] = ['Pendente', 'Em Andamento', 'Concluído'];
const OVERDUE_STATUS_OPTIONS: DevProjectStatus[] = ['Em atraso', 'Concluído'];

interface GanttTaskListProps {
    tasks: (GanttTask & { originalProject: DevProject })[];
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    syncScrollRef: React.RefObject<HTMLDivElement>;
    onProjectClick: (project: DevProject) => void;
    onStatusChange: (projectId: string, itemId: string, newStatus: DevProjectStatus) => void;
}

export function GanttTaskList({ tasks, onScroll, syncScrollRef, onProjectClick, onStatusChange }: GanttTaskListProps) {
    return (
        <Card className="rounded-r-none border-r-0 border-t-0 h-full flex flex-col">
            <CardContent
                className="p-0 flex-grow overflow-y-auto"
                ref={syncScrollRef}
                onScroll={onScroll}
            >
                <div className="divide-y divide-border">
                    {tasks.map(task => {
                        const isOverdue = task.deadline && isBefore(parseISO(task.deadline), startOfToday()) && task.status !== 'Concluído';
                        const currentStatus = isOverdue ? 'Em atraso' : task.status;
                        const statusOptions = isOverdue ? OVERDUE_STATUS_OPTIONS : BASE_STATUS_OPTIONS;

                        return (
                        <div key={task.id} className={cn("grid grid-cols-4 items-center h-10 px-2 text-sm", isOverdue && "bg-destructive/10")}>
                           {task.level === 0 ? (
                                <>
                                    <div className="col-span-4 flex items-center gap-1 truncate font-bold">
                                        {task.isParent ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 opacity-0"/>}
                                        <Button variant="link" className="p-0 h-auto text-current font-bold truncate" onClick={() => onProjectClick(task.originalProject)}>
                                            {task.name}
                                        </Button>
                                    </div>
                                </>
                           ) : (
                            <>
                                <div
                                    className={cn("col-span-1 flex items-center gap-1 truncate",
                                        task.level === 1 && "pl-4",
                                        task.level === 2 && "pl-8"
                                    )}
                                >
                                    {task.level === 1 && (task.isParent ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 opacity-0"/>)}
                                    {task.level === 2 && <CornerDownRight className="h-4 w-4 text-muted-foreground"/>}
                                    <span className={cn("truncate")}>{task.name}</span>
                                </div>
                                <div className="truncate text-muted-foreground text-center">{task.responsible}</div>
                                <div className="flex justify-center">
                                    <Select 
                                        value={currentStatus} 
                                        onValueChange={(newStatus: DevProjectStatus) => onStatusChange(task.originalProject.id, task.id, newStatus)}
                                    >
                                        <SelectTrigger className="h-7 text-xs px-2 w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="truncate text-muted-foreground text-center">
                                    {task.deadline ? format(parseISO(task.deadline), 'dd/MM/yy') : ''}
                                </div>
                             </>
                           )}
                        </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
