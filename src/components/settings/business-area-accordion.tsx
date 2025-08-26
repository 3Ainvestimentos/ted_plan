

"use client";

import { useState } from "react";
import type { BusinessArea } from "@/types";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "../ui/button";
import { Edit, Trash2 } from "lucide-react";
import { KpiManager } from "./kpi-manager";
import { OkrManager } from "./okr-manager";
import { UpsertBusinessAreaModal } from "./upsert-business-area-modal";
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
} from "@/components/ui/alert-dialog";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { useToast } from "@/hooks/use-toast";

interface BusinessAreaAccordionProps {
    area: BusinessArea;
}

export function BusinessAreaAccordion({ area }: BusinessAreaAccordionProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { deleteBusinessArea } = useStrategicPanel();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deleteBusinessArea(area.id);
            toast({
                title: "Área de Negócio Removida",
                description: `A área "${area.name}" e seus OKRs/KPIs foram removidos.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: "Erro",
                description: `Não foi possível remover a área "${area.name}".`,
            });
        }
    };
    
    return (
        <>
            <UpsertBusinessAreaModal 
                isOpen={isEditModalOpen} 
                onOpenChange={setIsEditModalOpen}
                area={area}
            />
            <AccordionItem value={area.id}>
                <div className="flex justify-between items-center w-full hover:bg-accent/50 px-4 rounded-md">
                    <AccordionTrigger className="hover:no-underline flex-grow py-0">
                        <span className="text-lg font-medium">{area.name}</span>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação removerá permanentemente a área de negócio e todos os seus OKRs e KPIs associados.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                    Remover
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <AccordionContent className="p-4 space-y-8">
                   <section>
                        <h4 className="text-xl font-semibold mb-4">Objetivos e Resultados-Chave (OKRs)</h4>
                        <OkrManager areaId={area.id} okrs={area.okrs} />
                   </section>
                   <section>
                        <h4 className="text-xl font-semibold mb-4">Indicadores Chave de Performance (KPIs)</h4>
                        <KpiManager areaId={area.id} kpis={area.kpis} />
                   </section>
                </AccordionContent>
            </AccordionItem>
        </>
    );
}
