
"use client";

import { useState } from 'react';
import { useTasks } from '@/contexts/tasks-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from '../ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface AddTaskModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddTaskModal({ isOpen, onOpenChange }: AddTaskModalProps) {
    const { addTask } = useTasks();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) {
            toast({
                variant: 'destructive',
                title: "Título inválido",
                description: "O título da tarefa não pode estar em branco.",
            });
            return;
        }

        setIsLoading(true);
        try {
            await addTask(title);
            toast({
                title: "Tarefa adicionada!",
                description: `A tarefa "${title}" foi criada.`,
            });
            setTitle('');
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao adicionar tarefa",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
                    <DialogDescription>
                        Insira o título para a sua nova tarefa.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="task-title">Título da Tarefa</Label>
                    <Input 
                        id="task-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Preparar relatório semanal"
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                        Salvar Tarefa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
