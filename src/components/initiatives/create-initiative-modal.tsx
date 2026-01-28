
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
import type { InitiativePageContext } from "@/lib/permissions-config";

interface CreateInitiativeModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    preselectedAreaId?: string | null;
    pageContext?: InitiativePageContext;
}

export function CreateInitiativeModal({ isOpen, onOpenChange, preselectedAreaId, pageContext }: CreateInitiativeModalProps) {
    const { addInitiative } = useInitiatives();
    const { toast } = useToast();
    const router = useRouter();
    const { user, getUserArea } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Verificar permissão para criar (sem areaId ainda, será verificado no submit)
    const userType = user?.userType || 'head';
    const userArea = getUserArea();
    // canCreate será verificado no handleFormSubmit com o areaId do form
    // Aqui apenas verificamos se tem permissão básica (sem validação de área)
    const canCreateBasic = canCreateInitiative(userType, pageContext, userArea, undefined);
    // canEditDeadline também será verificado no submit com o areaId
    // Por enquanto, passamos um valor padrão que será recalculado no form
    const canEditDeadlineValue = canEditDeadline(userType, pageContext, userArea, undefined);

    // Fechar modal se não tiver permissão básica
    useEffect(() => {
        if (isOpen && !canCreateBasic) {
            toast({
                variant: 'destructive',
                title: "Acesso Negado",
                description: "Você não tem permissão para criar iniciativas nesta página.",
            });
            onOpenChange(false);
        }
    }, [isOpen, canCreateBasic, onOpenChange, toast]);

    const handleFormSubmit = async (data: InitiativeFormData) => {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create-initiative-modal.tsx:44',message:'handleFormSubmit called',data:{canCreateBasic,hasTitle:!!data.title,itemsCount:data.items?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Verificar permissão com área da iniciativa
        const canCreate = canCreateInitiative(userType, pageContext, userArea, data.areaId);
        
        if (!canCreate) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create-initiative-modal.tsx:47',message:'handleFormSubmit: permission denied',data:{canCreate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            toast({
                variant: 'destructive',
                title: "Acesso Negado",
                description: "Você não tem permissão para criar iniciativas nesta área.",
            });
            return;
        }

        setIsLoading(true);
        
        // Definir initiativeType baseado no pageContext
        const initiativeType = pageContext === 'other-initiatives' ? 'other' : 'strategic';
        
        // Adicionar initiativeType aos dados antes de salvar
        const dataWithType = {
            ...data,
            initiativeType: initiativeType as 'strategic' | 'other',
        };
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create-initiative-modal.tsx:56',message:'Calling addInitiative',data:{title:data.title,itemsCount:data.items?.length||0,initiativeType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        await addInitiative(dataWithType as InitiativeFormData);
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create-initiative-modal.tsx:58',message:'addInitiative completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setIsLoading(false);

        toast({
            title: "Iniciativa Criada!",
            description: `A iniciativa "${data.title}" foi criada com sucesso.`,
        });
        
        onOpenChange(false);
    };

    if (!canCreateBasic) {
        return null; // Não renderizar se não tiver permissão básica
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

    