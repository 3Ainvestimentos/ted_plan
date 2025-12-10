
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import type { DevProject } from "@/types";
import { useDevProjects } from "@/contexts/dev-projects-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
});

type FormData = z.infer<typeof formSchema>;

interface UpsertProjectModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    project?: DevProject | null;
}

export function UpsertProjectModal({ isOpen, onOpenChange, project }: UpsertProjectModalProps) {
    const { addProject, updateProject, deleteProject } = useDevProjects();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const isEditing = !!project;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (project) {
            reset({ name: project.name });
        } else {
            reset({ name: '' });
        }
    }, [project, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            if (isEditing && project) {
                await updateProject(project.id, { name: data.name });
                toast({ title: "Projeto Atualizado!", description: `O projeto "${data.name}" foi atualizado.` });
            } else {
                await addProject({ name: data.name });
                toast({ title: "Projeto Adicionado!", description: `O projeto "${data.name}" foi criado.` });
            }
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar o projeto." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!project) return;
        setIsDeleting(true);
        try {
            await deleteProject(project.id);
            toast({ title: "Projeto Removido", description: `O projeto "${project.name}" foi removido.`});
            onOpenChange(false);
        } catch(e) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o projeto." });
        } finally {
            setIsDeleting(false);
        }
      }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Projeto' : 'Novo Projeto de Desenvolvimento'}</DialogTitle>
                    <DialogDescription>
                       {isEditing ? 'Atualize os dados do projeto.' : 'Preencha os dados do novo projeto.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Projeto</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between pt-4">
                        <div>
                            {isEditing && (
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={isDeleting}>
                                        {isDeleting ? "Excluindo..." : <><Trash2 className="mr-2 h-4 w-4" /> Excluir</>}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso irá excluir permanentemente o projeto e todos os seus itens.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                                {isEditing ? 'Salvar Alterações' : 'Adicionar Projeto'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
