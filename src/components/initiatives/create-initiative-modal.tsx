
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InitiativeForm } from "./initiative-form";
import { useInitiatives } from "@/contexts/initiatives-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { InitiativeFormData } from "./initiative-form";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { canCreateInitiative, canEditDeadline } from "@/lib/permissions-config";

interface CreateInitiativeModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    preselectedAreaId?: string | null;
}

export function CreateInitiativeModal({ isOpen, onOpenChange, preselectedAreaId }: CreateInitiativeModalProps) {
    const { addInitiative } = useInitiatives();
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Verificar permissão para criar
    const userType = user?.userType || 'head';
    const canCreate = canCreateInitiative(userType);
    const canEditDeadlineValue = canEditDeadline(userType);

    // Fechar modal se não tiver permissão
    useEffect(() => {
        if (isOpen && !canCreate) {
            toast({
                variant: 'destructive',
                title: "Acesso Negado",
                description: "Você não tem permissão para criar iniciativas. Apenas PMO e Administradores podem criar iniciativas.",
            });
            onOpenChange(false);
        }
    }, [isOpen, canCreate, onOpenChange, toast]);

    const handleFormSubmit = async (data: InitiativeFormData) => {
        if (!canCreate) {
            toast({
                variant: 'destructive',
                title: "Acesso Negado",
                description: "Você não tem permissão para criar iniciativas.",
            });
            return;
        }

        setIsLoading(true);
        await addInitiative(data);
        setIsLoading(false);

        toast({
            title: "Iniciativa Criada!",
            description: `A iniciativa "${data.title}" foi criada com sucesso.`,
        });
        
        onOpenChange(false);
    };

    if (!canCreate) {
        return null; // Não renderizar se não tiver permissão
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Criar Nova Iniciativa</DialogTitle>
                    <DialogDescription>
                        Preencha as informações abaixo para cadastrar uma nova iniciativa estratégica.
                    </DialogDescription>
                </DialogHeader>
                <InitiativeForm 
                    onSubmit={handleFormSubmit} 
                    onCancel={() => onOpenChange(false)} 
                    isLoading={isLoading}
                    canEditDeadline={canEditDeadlineValue}
                    preselectedAreaId={preselectedAreaId}
                />
            </DialogContent>
        </Dialog>
    );
}

    