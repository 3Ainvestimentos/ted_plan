
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List } from "lucide-react";
import { useMnaDeals } from "@/contexts/m-and-as-context";
import { InitiativesTable } from "@/components/initiatives/initiatives-table";
import { InitiativesKanban } from "@/components/initiatives/initiatives-kanban";
import { PageHeader } from "@/components/layout/page-header";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { MnaDeal } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { InitiativeDossierModal } from "@/components/initiatives/initiative-dossier-modal";
import { UpsertDealModal } from "@/components/m-and-as/upsert-deal-modal";


type ViewMode = "table" | "kanban";

export default function MnaPage() {
  const { deals, isLoading } = useMnaDeals();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<MnaDeal | null>(null);

  const openDossier = (deal: MnaDeal) => {
    setSelectedDeal(deal);
  }

  const closeDossier = () => {
    setSelectedDeal(null);
  }
  
  const activeDeals = useMemo(() => deals.filter(i => !i.archived), [deals]);

  const initiatives = deals; // Adapter for reusable components

  return (
    <DndProvider backend={HTML5Backend}>
      <UpsertDealModal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      
      {selectedDeal && (
        <InitiativeDossierModal
          isOpen={!!selectedDeal}
          onOpenChange={(isOpen) => !isOpen && closeDossier()}
          initiative={selectedDeal}
        />
      )}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader
            title="M&As"
            description="Gerencie seu funil de oportunidades de Fusões e Aquisições."
          />
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <div className="p-1 bg-muted rounded-lg flex items-center">
              <Button 
                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Tabela</span>
              </Button>
              <Button 
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Kanban</span>
              </Button>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Criar Deal
            </Button>
          </div>
        </div>
        
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : viewMode === 'table' ? (
          <InitiativesTable initiatives={initiatives} onInitiativeClick={openDossier} />
        ) : (
          <InitiativesKanban initiatives={activeDeals} onInitiativeClick={openDossier} />
        )}
      </div>
    </DndProvider>
  );
}
