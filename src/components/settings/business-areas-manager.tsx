

"use client";

import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, GripVertical } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { BusinessAreaAccordion } from "./business-area-accordion";
import { useState } from "react";
import { UpsertBusinessAreaModal } from "./upsert-business-area-modal";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

export function BusinessAreasManager() {
    const { businessAreas, isLoading, updateBusinessAreasOrder } = useStrategicPanel();
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

    const onDragEnd = (result: DropResult) => {
        const { destination, source } = result;

        if (!destination) {
            return;
        }

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const newBusinessAreas = Array.from(businessAreas);
        const [reorderedItem] = newBusinessAreas.splice(source.index, 1);
        newBusinessAreas.splice(destination.index, 0, reorderedItem);

        updateBusinessAreasOrder(newBusinessAreas);
    };

    return (
        <>
            <UpsertBusinessAreaModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Área de Negócio
                </Button>
            </div>
            
            {businessAreas.length > 0 ? (
                 <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="business-areas">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                <Accordion type="single" collapsible className="w-full space-y-2">
                                    {businessAreas.map((area, index) => (
                                         <Draggable key={area.id} draggableId={area.id} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps}>
                                                    <BusinessAreaAccordion 
                                                        area={area}
                                                        dragHandleProps={provided.dragHandleProps}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Accordion>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
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
