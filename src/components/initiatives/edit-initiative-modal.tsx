
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { InitiativeForm, type InitiativeFormData } from "./initiative-form";
import { useInitiatives } from "@/contexts/initiatives-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Initiative } from "@/types";
import { Button } from '@/components/ui/button';
import { useAuth } from "@/contexts/auth-context";
import { canEditInitiativeResponsible, canEditInitiativeStatus, canDeleteInitiative, canEditDeadline } from "@/lib/permissions-config";
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
    const { user, getUserArea } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Verificar permissões
    const userType = user?.userType || 'head';
    const userArea = getUserArea();
    const canEditResponsible = canEditInitiativeResponsible(userType, userArea, initiative.areaId);
    const canEditStatus = canEditInitiativeStatus(userType, userArea, initiative.areaId);
    const canDelete = canDeleteInitiative(userType);
    const canEditDeadlineValue = canEditDeadline(userType);
    const isLimitedMode = userType === 'head' && canEditResponsible; // Head da própria área em modo limitado

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

    /**
     * Converte uma string de data (ISO format 'YYYY-MM-DD' ou timestamp) para um objeto Date.
     * 
     * Esta função é usada para converter datas que vêm do Firestore (como strings) para objetos Date
     * que o formulário espera. Usa horário local (não UTC) para evitar problemas de timezone.
     * 
     * @param dateString - String de data no formato ISO 'YYYY-MM-DD' ou timestamp, ou objeto Date
     * @returns Objeto Date ou undefined se a string for inválida/null
     * 
     * @example
     * getDeadlineDate('2026-01-22') // Retorna Date para 22/01/2026
     * getDeadlineDate(null) // Retorna undefined
     */
    const getDeadlineDate = (dateString?: string | null | Date): Date | undefined => {
        if (!dateString) return undefined;
        
        try {
            // Se já é um objeto Date, retornar como está
            if (dateString instanceof Date) {
                // Verificar se é válido
                if (isNaN(dateString.getTime())) {
                    return undefined;
                }
                return dateString;
            }
            
            // Se é string no formato ISO 'YYYY-MM-DD'
            if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                // Criar data local (não UTC) para evitar problemas de timezone
                // Usar horário local do meio-dia para evitar mudanças de data por timezone
                const [year, month, day] = dateString.split('-').map(Number);
                return new Date(year, month - 1, day, 12, 0, 0);
            }
            
            // Tentar parsear como ISO string completa ou timestamp
            if (typeof dateString === 'string') {
                const parsedDate = new Date(dateString);
                
                // Verificar se a data é válida
                if (isNaN(parsedDate.getTime())) {
                    console.warn(`[EditInitiativeModal] Data inválida: ${dateString}`);
                    return undefined;
                }
                
                return parsedDate;
            }
            
            return undefined;
        } catch (error) {
            console.error(`[EditInitiativeModal] Erro ao converter data: ${dateString}`, error);
            return undefined;
        }
    }

    const initialData = {
        ...initiative,
        startDate: getDeadlineDate(initiative.startDate),
        endDate: getDeadlineDate(initiative.endDate),
        items: initiative.items?.map(item => ({
            ...item,
            startDate: getDeadlineDate(item.startDate),
            endDate: getDeadlineDate(item.endDate),
            linkedToPrevious: item.linkedToPrevious || false,
            subItems: item.subItems?.map(subItem => ({
                ...subItem,
                startDate: getDeadlineDate(subItem.startDate),
                endDate: getDeadlineDate(subItem.endDate),
                linkedToPrevious: subItem.linkedToPrevious || false,
            })) || [],
        })) || [],
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
                    isLimitedMode={isLimitedMode}
                    canEditStatus={canEditStatus}
                    canEditDeadline={canEditDeadlineValue}
                />
                {canDelete && (
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
                )}
            </DialogContent>
        </Dialog>
    );
}

    