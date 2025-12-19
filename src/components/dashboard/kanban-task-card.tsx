
"use client";

import type { Initiative } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Clock } from "lucide-react"; // Default and status icons
import { cn } from "@/lib/utils";
import { useDrag } from 'react-dnd';

interface KanbanTaskCardProps {
  task: Initiative;
}

function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return '??';
  }
  const parts = name.trim().split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function KanbanTaskCard({ task }: KanbanTaskCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const TaskIcon = task.icon || FileText;
  
  let priorityColorClass = "bg-gray-200 text-gray-700";
  if (task.priority === "P0" || task.priority === "P1") priorityColorClass = "bg-red-100 text-red-700";
  else if (task.priority === "P2") priorityColorClass = "bg-yellow-100 text-yellow-700";
  else if (task.priority === "P3") priorityColorClass = "bg-blue-100 text-blue-700";

  let statusIndicator = null;
  if (task.status === 'Em Risco') {
    statusIndicator = <AlertTriangle className="h-4 w-4 text-orange-500 ml-auto" title="Em Risco" />;
  } else if (task.status === 'Atrasado') {
    statusIndicator = <Clock className="h-4 w-4 text-red-500 ml-auto" title="Atrasado" />;
  }

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
        <Card className={cn(
        "shadow-sm hover:shadow-md transition-shadow duration-200 bg-card border-border cursor-grab",
        task.status === 'Em Risco' ? 'border-l-4 border-l-orange-500' : '',
        task.status === 'Atrasado' ? 'border-l-4 border-l-red-500' : ''
        )}>
        <CardContent className="p-3 space-y-2">
            <div className="flex items-center space-x-2">
            {TaskIcon && <TaskIcon className="h-4 w-4 text-muted-foreground" />}
            <h4 className="text-sm font-medium text-card-foreground flex-grow truncate" title={task.title}>
                {task.title}
            </h4>
            {statusIndicator}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", priorityColorClass)}>
                {task.priority}
            </Badge>
            <span>{new Date(task.lastUpdate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            </div>

            <div className="flex items-center justify-end">
            <Avatar className="h-6 w-6">
                <AvatarImage src={`https://placehold.co/24x24.png?text=${getInitials(task.owner || null)}`} alt={task.owner || 'Sem responsável'} data-ai-hint="assignee avatar" />
                <AvatarFallback className="text-xs">{getInitials(task.owner || null)}</AvatarFallback>
            </Avatar>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
