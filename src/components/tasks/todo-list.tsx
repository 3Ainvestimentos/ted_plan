
"use client";

import { useState, useMemo } from 'react';
import { useTasks } from '@/contexts/tasks-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Archive, Trash2, Edit, Save, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AnimatePresence, motion } from 'framer-motion';

export function TodoList() {
  const { tasks, updateTask, toggleTaskCompletion, toggleTaskPriority, archiveTask, deleteTask, isLoading } = useTasks();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  const activeTasks = useMemo(() => tasks.filter(t => !t.archived).sort((a, b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1)), [tasks]);
  const archivedTasks = useMemo(() => tasks.filter(t => t.archived), [tasks]);

  const handleEditStart = (id: string, title: string) => {
    setEditingTaskId(id);
    setEditingTaskTitle(title);
  };

  const handleEditCancel = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleEditSave = () => {
    if (editingTaskId && editingTaskTitle.trim()) {
      updateTask(editingTaskId, editingTaskTitle.trim());
    }
    handleEditCancel();
  };
  
  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  const renderTaskItem = (task: typeof tasks[0]) => (
    <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4 p-3 rounded-lg bg-card border hover:bg-muted/50"
    >
        <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => toggleTaskCompletion(task.id)}
            className="h-5 w-5"
        />
        {editingTaskId === task.id ? (
            <Input
                value={editingTaskTitle}
                onChange={(e) => setEditingTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                className="flex-grow text-sm"
                autoFocus
            />
        ) : (
            <label
                htmlFor={`task-${task.id}`}
                className={cn("flex-grow cursor-pointer text-sm", task.completed && "line-through text-muted-foreground")}
            >
                {task.title}
            </label>
        )}
        <div className="flex items-center gap-1 ml-auto">
            <Button size="icon" variant="ghost" onClick={() => toggleTaskPriority(task.id)} className="h-8 w-8">
              <Star className={cn("h-4 w-4", task.priority ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} />
            </Button>
            {editingTaskId === task.id ? (
                <>
                    <Button size="icon" variant="ghost" onClick={handleEditSave} className="text-green-600 hover:text-green-700 h-8 w-8"><Save /></Button>
                    <Button size="icon" variant="ghost" onClick={handleEditCancel} className="text-red-600 hover:text-red-700 h-8 w-8"><X /></Button>
                </>
            ) : (
                <>
                    <Button size="icon" variant="ghost" onClick={() => handleEditStart(task.id, task.title)} className="h-8 w-8"><Edit /></Button>
                     <Button size="icon" variant="ghost" onClick={() => archiveTask(task.id)} className="h-8 w-8"><Archive /></Button>
                </>
            )}
        </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Tarefas Ativas</h3>
        <AnimatePresence>
            {activeTasks.length > 0 ? (
                activeTasks.map(renderTaskItem)
            ) : (
                 <p className="text-muted-foreground text-center py-4">Nenhuma tarefa ativa.</p>
            )}
        </AnimatePresence>
      </div>
      
      {archivedTasks.length > 0 && (
         <div className="space-y-3">
            <h3 className="text-lg font-semibold">Arquivadas</h3>
             {archivedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-dashed">
                     <span className="flex-grow text-muted-foreground line-through">{task.title}</span>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive h-8 w-8"><Trash2 /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle></AlertDialogHeader>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTask(task.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
