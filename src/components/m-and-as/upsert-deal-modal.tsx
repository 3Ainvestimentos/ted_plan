
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DealForm } from "./deal-form";
import { useMnaDeals } from "@/contexts/m-and-as-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { DealFormData } from "./deal-form";
import { useState } from "react";

interface UpsertDealModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpsertDealModal({ isOpen, onOpenChange }: UpsertDealModalProps) {
    const { addDeal } = useMnaDeals();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleFormSubmit = async (data: DealFormData) => {
        setIsLoading(true);
        await addDeal(data);
        setIsLoading(false);

        toast({
            title: "Deal Criado!",
            description: `O deal "${data.title}" foi criado com sucesso.`,
        });
        
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Criar Novo Deal</DialogTitle>
                    <DialogDescription>
                        Preencha as informações abaixo para cadastrar um novo deal de M&A.
                    </DialogDescription>
                </DialogHeader>
                <DealForm 
                    onSubmit={handleFormSubmit} 
                    onCancel={() => onOpenChange(false)} 
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}
