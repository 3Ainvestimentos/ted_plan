
"use client";

import React, { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List, Upload, Download, Loader2 } from "lucide-react";
import { useInitiatives } from "@/contexts/initiatives-context";
import { InitiativesTable } from "@/components/initiatives/initiatives-table";
import { InitiativesKanban } from "@/components/initiatives/initiatives-kanban";
import { PageHeader } from "@/components/layout/page-header";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useToast } from "@/hooks/use-toast";
import type { Initiative } from "@/types";
import { CreateInitiativeModal } from "@/components/initiatives/create-initiative-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { InitiativeDossierModal } from "@/components/initiatives/initiative-dossier-modal";
import { ImportInitiativesModal } from "@/components/initiatives/import-initiatives-modal";


type ViewMode = "table" | "kanban";

export default function InitiativesPage() {
  const { initiatives, isLoading } = useInitiatives();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  const openDossier = (initiative: Initiative) => {
    setSelectedInitiative(initiative);
  }

  const closeDossier = () => {
    setSelectedInitiative(null);
  }
  
  const activeInitiatives = useMemo(() => initiatives.filter(i => !i.archived), [initiatives]);

  return (
    <DndProvider backend={HTML5Backend}>
      <CreateInitiativeModal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      <ImportInitiativesModal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} />
      
      {selectedInitiative && (
        <InitiativeDossierModal
          isOpen={!!selectedInitiative}
          onOpenChange={(isOpen) => !isOpen && closeDossier()}
          initiative={selectedInitiative}
        />
      )}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader
            title="Iniciativas Estratégicas"
            description="Acompanhe, gerencie e organize todas as suas iniciativas em um só lugar."
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
              <PlusCircle className="mr-2 h-4 w-4" /> Criar
            </Button>
             <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Importar CSV
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
          <InitiativesKanban initiatives={activeInitiatives} onInitiativeClick={openDossier} />
        )}
      </div>
    </DndProvider>
  );
}
