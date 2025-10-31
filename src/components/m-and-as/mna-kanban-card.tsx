
"use client";

import type { MnaDeal } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Clock, CheckSquare, MapPin, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDrag } from 'react-dnd';
import { Progress } from "../ui/progress";

interface MnaKanbanCardProps {
  task: MnaDeal;
  onClick: () => void;
}

export function MnaKanbanCard({ task, onClick }: MnaKanbanCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const hasSubItems = task.subItems && task.subItems.length > 0;
  const TaskIcon = hasSubItems ? CheckSquare : (task.icon || FileText);
  
  const priorityColorMapping: Record<typeof task.priority, string> = {
    'Alta': 'bg-red-100 text-red-700',
    'Média': 'bg-yellow-100 text-yellow-700',
    'Baixa': 'bg-blue-100 text-blue-700'
  };
  const priorityColorClass = priorityColorMapping[task.priority] || "bg-gray-200 text-gray-700";

  let statusIndicator = null;
  if (task.status === 'Em Risco') {
    statusIndicator = <AlertTriangle className="h-4 w-4 text-orange-500 ml-auto" title="Em Risco" />;
  } else if (task.status === 'Atrasado') {
    statusIndicator = <Clock className="h-4 w-4 text-red-500 ml-auto" title="Atrasado" />;
  }

  const formatAuc = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} className="cursor-grab active:cursor-grabbing" onClick={onClick}>
        <Card className={cn(
            "shadow-sm hover:shadow-md transition-shadow duration-200 bg-card border-border",
            task.status === 'Em Risco' ? 'border-l-4 border-l-orange-500' : '',
            task.status === 'Atrasado' ? 'border-l-4 border-l-red-500' : ''
        )}>
        <CardContent className="p-3 space-y-3">
            <div className="flex items-start space-x-2">
                {TaskIcon && <TaskIcon className="h-4 w-4 text-muted-foreground mt-0.5" />}
                <h4 className="text-sm font-medium text-card-foreground flex-grow" title={task.title}>
                    {task.title}
                </h4>
                {statusIndicator}
            </div>

            {hasSubItems && (
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Progresso</span>
                        <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1" />
                </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", priorityColorClass)}>
                    {task.priority}
                </Badge>
                <div className="flex items-center gap-2 flex-wrap">
                     {task.cidade && (
                        <Badge variant="secondary" className="font-normal">
                            <MapPin className="mr-1 h-3 w-3" />
                            {task.cidade}
                        </Badge>
                     )}
                     {task.auc && (
                        <Badge variant="secondary" className="font-normal">
                           <DollarSign className="mr-1 h-3 w-3" />
                           {formatAuc(task.auc)}
                        </Badge>
                     )}
                </div>
            </div>

        </CardContent>
        </Card>
    </div>
  );
}
