
"use client";

import React from 'react';
import type { GanttTask } from './gantt-view';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '../ui/badge';
import type { DevProjectStatus } from '@/types';

const StatusBadge = ({ status }: { status: DevProjectStatus }) => {
    const colorClasses: Record<DevProjectStatus, string> = {
        'Pendente': 'bg-gray-200 text-gray-800',
        'Em Andamento': 'bg-blue-200 text-blue-800',
        'Concluído': 'bg-green-200 text-green-800',
        'Em Espera': 'bg-yellow-200 text-yellow-800',
        'Cancelado': 'bg-red-200 text-red-800',
    };
    return <Badge variant="outline" className={cn('text-xs font-medium', colorClasses[status])}>{status}</Badge>;
}


interface GanttTaskListProps {
    tasks: GanttTask[];
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    syncScrollRef: React.RefObject<HTMLDivElement>;
}

export function GanttTaskList({ tasks, onScroll, syncScrollRef }: GanttTaskListProps) {
    return (
        <Card className="rounded-r-none border-r-0 border-t-0 h-full flex flex-col">
            <CardContent
                className="p-0 flex-grow overflow-y-scroll"
                ref={syncScrollRef}
                onScroll={onScroll}
            >
                <div className="divide-y divide-border">
                    {tasks.map(task => (
                        <div key={task.id} className="grid grid-cols-4 items-center h-10 px-2 text-sm">
                           {task.level === 0 ? (
                                <>
                                    <div className="col-span-1 flex items-center gap-1 truncate font-bold">
                                        {task.isParent ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 opacity-0"/>}
                                        <span className="truncate">{task.name}</span>
                                    </div>
                                    <div className="col-span-3"></div>
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
                                    <StatusBadge status={task.status as DevProjectStatus} />
                                </div>
                                <div className="truncate text-muted-foreground text-center">
                                    {task.deadline ? format(parseISO(task.deadline), 'dd/MM/yy') : ''}
                                </div>
                             </>
                           )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
