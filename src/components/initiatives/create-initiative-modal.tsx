
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InitiativeForm } from "./initiative-form";
import { useInitiatives } from "@/contexts/initiatives-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { InitiativeFormData } from "./initiative-form";

interface CreateInitiativeModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateInitiativeModal({ isOpen, onOpenChange }: CreateInitiativeModalProps) {
    const { addInitiative } = useInitiatives();
    const { toast } = useToast();
    const router = useRouter();

    const handleFormSubmit = (data: InitiativeFormData) => {
        const initiativeDataForContext = {
          title: data.title,
          owner: data.owner,
          description: data.description,
          status: data.status,
          priority: data.priority,
          // The context will handle id, lastUpdate, topicNumber, progress, and keyMetrics
        };

        addInitiative(initiativeDataForContext as any);

        toast({
            title: "Iniciativa Criada!",
            description: `A iniciativa "${data.title}" foi criada com sucesso.`,
        });
        
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Criar Nova Iniciativa</DialogTitle>
                    <DialogDescription>
                        Preencha as informações abaixo para cadastrar uma nova iniciativa estratégica.
                    </DialogDescription>
                </DialogHeader>
                <InitiativeForm onSubmit={handleFormSubmit} onCancel={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
