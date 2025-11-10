
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DealForm } from "./deal-form";
import { useMnaDeals } from "@/contexts/m-and-as-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { DealFormData } from "./deal-form";
import { useState, useEffect } from "react";
import type { MnaDeal } from "@/types";

interface UpsertDealModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    deal?: MnaDeal | null;
}

export function UpsertDealModal({ isOpen, onOpenChange, deal }: UpsertDealModalProps) {
    const { addDeal, updateDeal } = useMnaDeals();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!deal;

    const handleFormSubmit = async (data: DealFormData) => {
        setIsLoading(true);

        // Convert sub-item deadlines back to string format for Firestore
        const dataWithFormattedDates = {
            ...data,
            subItems: data.subItems?.map(si => ({
                ...si,
                deadline: si.deadline ? si.deadline.toISOString().split('T')[0] : null,
            }))
        };
        
        try {
            if (isEditing && deal) {
                await updateDeal(deal.id, dataWithFormattedDates as any);
                 toast({
                    title: "Deal Atualizado!",
                    description: `O deal "${data.title}" foi atualizado com sucesso.`,
                });
            } else {
                await addDeal(dataWithFormattedDates as any);
                toast({
                    title: "Deal Criado!",
                    description: `O deal "${data.title}" foi criado com sucesso.`,
                });
            }
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro",
                description: "Não foi possível salvar o deal."
            })
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Deal' : 'Criar Novo Deal'}</DialogTitle>
                    <DialogDescription>
                       {isEditing ? 'Atualize os detalhes do deal.' : 'Preencha as informações abaixo para cadastrar um novo deal de M&A.'}
                    </DialogDescription>
                </DialogHeader>
                <DealForm 
                    onSubmit={handleFormSubmit} 
                    onCancel={() => onOpenChange(false)} 
                    isLoading={isLoading}
                    initialData={deal as DealFormData}
                />
            </DialogContent>
        </Dialog>
    );
}
