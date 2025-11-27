
"use client";

import { useState } from 'react';
import { PageHeader } from "@/components/layout/page-header";
import { TodoList } from "@/components/tasks/todo-list";
import { TasksKanban } from '@/components/tasks/tasks-kanban';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, PlusCircle } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTasks } from '@/contexts/tasks-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AddTaskModal } from '@/components/tasks/add-task-modal';

type ViewMode = "list" | "kanban";

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const { isLoading } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DndProvider backend={HTML5Backend}>
      <AddTaskModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader
            title="Tarefas"
            description="Gerencie sua lista de tarefas diárias."
          />
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
              <div className="p-1 bg-muted rounded-lg flex items-center">
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Lista</span>
                </Button>
                <Button 
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('kanban')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Kanban</span>
                </Button>
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tarefa
              </Button>
            </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-48 w-full" />
          </div>
        ) : viewMode === 'list' ? (
          <TodoList />
        ) : (
          <TasksKanban />
        )}
      </div>
    </DndProvider>
  );
}
