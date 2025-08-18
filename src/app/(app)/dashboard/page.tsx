
"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { KanbanTaskCard } from "@/components/dashboard/kanban-task-card";
import { MOCK_INITIATIVES, KANBAN_COLUMN_DISPLAY_ORDER, KANBAN_COLUMN_NAMES, STATUS_TO_COLUMN_MAP } from "@/lib/constants";
import type { Initiative, InitiativeStatus } from "@/types";
import { Plus, MoreHorizontal, Search, Filter as FilterIcon, ChevronDown, GripVertical, List } from "lucide-react";
import { useAuth } from "@/contexts/auth-context"; // For user role if needed for "New" button

interface Column {
  id: InitiativeStatus;
  title: string;
  tasks: Initiative[];
}

export default function DashboardPage() {
  const { userRole } = useAuth(); // If needed for controlling "New" action

  const columns: Column[] = useMemo(() => {
    const groupedTasks: Record<InitiativeStatus, Initiative[]> = {
      'A Fazer': [],
      'Em Dia': [],
      'Em Risco': [], // Will be shown in 'Em Dia' column but card styled
      'Atrasado': [], // Will be shown in 'Em Dia' column but card styled
      'Concluído': [],
    };

    MOCK_INITIATIVES.forEach(task => {
      const targetColumnKey = STATUS_TO_COLUMN_MAP[task.status];
      if (groupedTasks[targetColumnKey]) {
        groupedTasks[targetColumnKey].push(task);
      } else {
        // Fallback or create new if map is incomplete, though it should be complete
        groupedTasks[targetColumnKey] = [task];
      }
    });
    
    // Filter KANBAN_COLUMN_DISPLAY_ORDER to only include keys present in KANBAN_COLUMN_NAMES
    const displayableStatuses = KANBAN_COLUMN_DISPLAY_ORDER.filter(status => KANBAN_COLUMN_NAMES[status]);

    return displayableStatuses.map(statusKey => ({
      id: statusKey,
      title: KANBAN_COLUMN_NAMES[statusKey],
      tasks: groupedTasks[statusKey] || [],
    }));

  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem)-2rem)]"> {/* Adjust 2rem for padding */}
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
            <GripVertical className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold text-foreground">Quadro de Status do Projeto</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Select defaultValue="status">
          <SelectTrigger className="w-auto h-8 text-xs px-2 py-1">
            <SelectValue placeholder="Visualizar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Por Status</SelectItem>
            <SelectItem value="owner">Por Responsável</SelectItem>
            <SelectItem value="priority">Por Prioridade</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-8 text-xs px-2 py-1 text-muted-foreground hover:text-foreground">Propriedades</Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs px-2 py-1 text-muted-foreground hover:text-foreground">Agrupar por: Status</Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs px-2 py-1 text-muted-foreground hover:text-foreground">
          <FilterIcon className="h-3 w-3 mr-1" /> Filtro
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs px-2 py-1 text-muted-foreground hover:text-foreground">Ordenar</Button>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar" className="pl-7 h-8 text-xs w-40" />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
        <div className="ml-auto flex gap-2">
          <Button variant="default" size="sm" className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
            Novo <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-grow overflow-x-auto pb-4">
        <div className="flex gap-4 h-full">
          {columns.map((column) => (
            <div key={column.id} className="w-72 md:w-80 flex-shrink-0 bg-secondary/30 rounded-lg p-1.5 flex flex-col">
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
              <div className="space-y-2 overflow-y-auto flex-grow px-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {column.tasks.map((task) => (
                  <KanbanTaskCard key={task.id} task={task} />
                ))}
              </div>
              <Button variant="ghost" className="mt-2 w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                <Plus className="mr-1 h-3.5 w-3.5" /> Novo
              </Button>
            </div>
          ))}
          {/* Hidden Columns & Add Group Placeholders */}
          <div className="w-auto flex-shrink-0 p-2 flex flex-col gap-2 text-sm">
             <Button variant="ghost" size="sm" className="h-8 text-xs px-2 py-1 text-muted-foreground hover:text-foreground">
                <List className="mr-1 h-3.5 w-3.5" /> Colunas Ocultas
             </Button>
             <Button variant="ghost" size="sm" className="h-8 text-xs px-2 py-1 text-muted-foreground hover:text-foreground">
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar um grupo
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
