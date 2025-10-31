
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { InitiativeForm, type InitiativeFormData } from "./initiative-form";
import { useInitiatives } from "@/contexts/initiatives-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Initiative } from "@/types";
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog"

interface EditInitiativeModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initiative: Initiative;
}

export function EditInitiativeModal({ isOpen, onOpenChange, initiative }: EditInitiativeModalProps) {
    const { updateInitiative, deleteInitiative } = useInitiatives();
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFormSubmit = async (data: InitiativeFormData) => {
        setIsSaving(true);
        await updateInitiative(initiative.id, data);
        setIsSaving(false);

        toast({
            title: "Iniciativa Atualizada!",
            description: `A iniciativa "${data.title}" foi atualizada com sucesso.`,
        });
        
        onOpenChange(false);
    };
    
    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteInitiative(initiative.id);
        setIsDeleting(false);

        toast({
            title: "Iniciativa Removida!",
            description: `A iniciativa "${initiative.title}" foi removida.`,
        });
        
        onOpenChange(false);
        // Do not redirect, just close the modal.
    }

    const getDeadlineDate = () => {
        if (!initiative.deadline) return null;
        // Firestore timestamps can be tricky. Ensure it's handled correctly.
        // If deadline is stored as 'YYYY-MM-DD', we need to account for timezone.
        const [year, month, day] = initiative.deadline.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }

    const initialData = {
        ...initiative,
        deadline: getDeadlineDate(),
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Iniciativa</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes da iniciativa. Clique em salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>
                <InitiativeForm 
                    onSubmit={handleFormSubmit} 
                    onCancel={() => onOpenChange(false)} 
                    initialData={initialData}
                    isLoading={isSaving}
                />
                <DialogFooter className="border-t pt-4 mt-4">
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                            {isDeleting ? "Excluindo..." : "Excluir Iniciativa"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso irá excluir permanentemente a iniciativa e remover seus dados de nossos servidores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

    