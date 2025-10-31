
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InitiativeForm } from "./initiative-form";
import { useInitiatives } from "@/contexts/initiatives-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { InitiativeFormData } from "./initiative-form";
import { useState } from "react";

interface CreateInitiativeModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateInitiativeModal({ isOpen, onOpenChange }: CreateInitiativeModalProps) {
    const { addInitiative } = useInitiatives();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleFormSubmit = async (data: InitiativeFormData) => {
        setIsLoading(true);
        await addInitiative(data);
        setIsLoading(false);

        toast({
            title: "Iniciativa Criada!",
            description: `A iniciativa "${data.title}" foi criada com sucesso.`,
        });
        
        onOpenChange(false);
    };

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
                />
            </DialogContent>
        </Dialog>
    );
}

    