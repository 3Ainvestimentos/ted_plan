
"use client";

import React from 'react';
import { useDrop } from 'react-dnd';
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { MnaKanbanCard } from "./mna-kanban-card";
import type { MnaDeal, InitiativeStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ColumnProps {
  column: {
    id: InitiativeStatus;
    title: string;
    tasks: MnaDeal[];
  };
  onDropTask: (taskId: string, newStatus: InitiativeStatus) => void;
  onDealClick: (deal: MnaDeal) => void;
}

export function MnaKanbanColumn({ column, onDropTask, onDealClick }: ColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'task',
    drop: (item: { id: string }) => {
      onDropTask(item.id, column.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={cn(
        "w-80 md:w-96 flex-shrink-0 bg-secondary/30 rounded-lg p-1.5 flex flex-col transition-colors duration-200",
        isOver && canDrop ? "bg-primary/10" : "",
        isOver && !canDrop ? "bg-destructive/10" : ""
      )}
    >
      <div className="flex justify-between items-center p-2 mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">{column.title}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{column.tasks.length}</span>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto flex-grow px-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent min-h-[calc(100vh-250px)]">
        {column.tasks.map((task) => (
          <MnaKanbanCard key={task.id} task={task} onClick={() => onDealClick(task)} />
        ))}
      </div>
      <Button variant="ghost" className="mt-2 w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50">
        <Plus className="mr-1 h-3.5 w-3.5" /> Novo
      </Button>
    </div>
  );
}
