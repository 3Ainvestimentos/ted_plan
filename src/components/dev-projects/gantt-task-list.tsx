
"use client";

import React from 'react';
import type { GanttTask } from './gantt-view';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, CornerDownRight, ChevronsRight } from 'lucide-react';

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
                        <div key={task.id} className="grid grid-cols-3 items-center h-10 px-2 text-sm">
                            <div
                                className={cn("col-span-2 flex items-center gap-1 truncate",
                                    task.level === 1 && "pl-4",
                                    task.level === 2 && "pl-8"
                                )}
                            >
                                {task.level === 0 && (task.isParent ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 opacity-0"/>)}
                                {task.level === 1 && (task.isParent ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 opacity-0"/>)}
                                {task.level === 2 && <CornerDownRight className="h-4 w-4 text-muted-foreground"/>}
                                <span className={cn("truncate", task.level === 0 && "font-bold")}>{task.name}</span>
                            </div>
                            <div className="truncate text-muted-foreground">{task.responsible}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
