
"use client";

import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { BusinessAreaAccordion } from "./business-area-accordion";
import { useState } from "react";
import { UpsertBusinessAreaModal } from "./upsert-business-area-modal";

export function BusinessAreasManager() {
    const { businessAreas, isLoading } = useStrategicPanel();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    return (
        <>
            <UpsertBusinessAreaModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Área de Negócio
                </Button>
            </div>
            
            {businessAreas.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {businessAreas.map(area => (
                        <BusinessAreaAccordion key={area.id} area={area} />
                    ))}
                </Accordion>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                    <Briefcase className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold">Nenhuma Área de Negócio Encontrada</h3>
                    <p className="mt-2 max-w-md">
                        Comece adicionando uma nova área de negócio para gerenciar seus OKRs e KPIs.
                    </p>
                </div>
            )}
        </>
    );
}
