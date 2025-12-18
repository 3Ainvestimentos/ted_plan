
"use client";

import React, { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List, Upload, Download, Loader2, GanttChart, LayoutDashboard } from "lucide-react";
import { useInitiatives } from "@/contexts/initiatives-context";
import { InitiativesTable } from "@/components/initiatives/initiatives-table";
import { InitiativesKanban } from "@/components/initiatives/initiatives-kanban";
import { InitiativeGanttView } from "@/components/initiatives/initiative-gantt-view";
import { InitiativesDashboard } from "@/components/initiatives/initiatives-dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useToast } from "@/hooks/use-toast";
import type { Initiative, InitiativeStatus } from "@/types";
import { CreateInitiativeModal } from "@/components/initiatives/create-initiative-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { InitiativeDossierModal } from "@/components/initiatives/initiative-dossier-modal";
import { ImportInitiativesModal } from "@/components/initiatives/import-initiatives-modal";


type ViewMode = "dashboard" | "table" | "kanban" | "gantt";

export default function InitiativesPage() {
  const { initiatives, isLoading, updateInitiativeStatus } = useInitiatives();
  /**
   * Dashboard é a visualização inicial/padrão da página
   * Oferece uma visão geral das métricas antes de entrar nas visualizações detalhadas
   */
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);

  /**
   * Busca a iniciativa atualizada do array initiatives
   * 
   * Isso garante que quando o checkbox é atualizado,
   * o modal sempre mostra o estado mais recente
   */
  const selectedInitiative = useMemo(() => {
    if (!selectedInitiativeId) return null;
    return initiatives.find(i => i.id === selectedInitiativeId) || null;
  }, [selectedInitiativeId, initiatives]);

  const openDossier = (initiative: Initiative) => {
    setSelectedInitiativeId(initiative.id); // Salva apenas o ID
  }

  const closeDossier = () => {
    setSelectedInitiativeId(null);
  }

  /**
   * Handler para atualizar status diretamente do Gantt
   * 
   * Esta função é passada como prop para o InitiativeGanttView
   * Quando o usuário muda o status no dropdown, essa função é chamada
   */
  const handleStatusChange = (initiativeId: string, newStatus: InitiativeStatus) => {
    updateInitiativeStatus(initiativeId, newStatus);
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
          <div className="flex items-center gap-2 self-end sm:self-center flex-nowrap">
            <div className="p-1 bg-muted rounded-lg flex items-center flex-shrink-0">
              {/* Botão Dashboard - Visualização inicial */}
              <Button 
                variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('dashboard')}
                className="h-8 px-3"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Dashboard</span>
              </Button>
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
              <Button 
                variant={viewMode === 'gantt' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('gantt')}
                className="h-8 px-3"
              >
                <GanttChart className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Gantt</span>
              </Button>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" /> Criar
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="flex-shrink-0">
              <Upload className="mr-2 h-4 w-4" /> Importar CSV
            </Button>
          </div>
        </div>
        
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : viewMode === 'dashboard' ? (
          /**
           * Dashboard - Visualização inicial com métricas e resumos
           * 
           * Exibe:
           * - Métricas principais (total, concluídas, atrasadas, em dia)
           * - Métricas secundárias (progresso médio, checklists, responsáveis)
           * - Distribuições (status, prioridade, responsáveis)
           */
          <InitiativesDashboard initiatives={activeInitiatives} />
        ) : viewMode === 'table' ? (
          <InitiativesTable initiatives={initiatives} onInitiativeClick={openDossier} />
        ) : viewMode === 'kanban' ? (
          <InitiativesKanban initiatives={activeInitiatives} onInitiativeClick={openDossier} />
        ) : (
          <InitiativeGanttView 
            initiatives={activeInitiatives} 
            onInitiativeClick={openDossier}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </DndProvider>
  );
}
