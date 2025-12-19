
"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List, Upload, LayoutDashboard, X } from "lucide-react";
import { useInitiatives } from "@/contexts/initiatives-context";
import { TableGanttView } from "@/components/initiatives/table-gantt-view";
import { InitiativesKanban } from "@/components/initiatives/initiatives-kanban";
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
import { useAuth } from "@/contexts/auth-context";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { canCreateInitiative, canViewInitiativeViewMode, canEditInitiativeStatus } from "@/lib/permissions-config";
import { Badge } from "@/components/ui/badge";


type ViewMode = "dashboard" | "table-gantt" | "kanban";

export default function InitiativesPage() {
  const { initiatives, isLoading, updateInitiativeStatus, updateSubItem, archiveInitiative, unarchiveInitiative } = useInitiatives();
  const { user, getUserArea } = useAuth();
  const { businessAreas } = useStrategicPanel();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Obter área selecionada da URL
  const selectedAreaId = searchParams.get('area') || null;
  const selectedArea = useMemo(() => {
    if (!selectedAreaId) return null;
    return businessAreas.find(a => a.id === selectedAreaId) || null;
  }, [selectedAreaId, businessAreas]);

  /**
   * Dashboard é a visualização inicial/padrão da página
   * Oferece uma visão geral das métricas antes de entrar nas visualizações detalhadas
   */
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);

  // Verificar permissões
  const userType = user?.userType || 'head';
  const userArea = getUserArea();
  const canCreate = canCreateInitiative(userType);
  
  // Verificar se pode ver o modo de visualização atual
  const canViewCurrentMode = useMemo(() => {
    if (!selectedAreaId) return true; // Sem filtro, pode ver tudo
    return canViewInitiativeViewMode(userType, userArea, selectedAreaId, viewMode);
  }, [userType, userArea, selectedAreaId, viewMode]);

  // Ajustar viewMode se não tiver permissão
  useEffect(() => {
    if (!canViewCurrentMode && selectedAreaId && viewMode !== 'dashboard') {
      // Se não pode ver o modo atual, forçar dashboard
      setViewMode('dashboard');
    }
  }, [canViewCurrentMode, selectedAreaId, viewMode]);

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
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) return;

    // Verificar permissão para editar status
    const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId);

    if (!canEdit) {
      toast({
        variant: 'destructive',
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar o status desta iniciativa.",
      });
      return;
    }

    updateInitiativeStatus(initiativeId, newStatus);
  }
  
  // Filtrar iniciativas por área se selecionada
  const filteredInitiatives = useMemo(() => {
    let filtered = initiatives.filter(i => !i.archived);
    if (selectedAreaId) {
      filtered = filtered.filter(i => i.areaId === selectedAreaId);
    }
    return filtered;
  }, [initiatives, selectedAreaId]);

  const activeInitiatives = filteredInitiatives;

  // Remover filtro de área
  const clearAreaFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('area');
    router.push(`/strategic-initiatives${params.toString() ? `?${params.toString()}` : ''}`);
  };

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
          <div className="flex-1">
            <PageHeader
              title="Iniciativas Estratégicas"
              description={selectedArea 
                ? `Iniciativas da área: ${selectedArea.name}` 
                : "Acompanhe, gerencie e organize todas as suas iniciativas em um só lugar."}
            />
            {selectedArea && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  Área: {selectedArea.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAreaFilter}
                  className="h-6 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remover filtro
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center flex-nowrap">
            <div className="p-1 bg-muted rounded-lg flex items-center flex-shrink-0">
              {/* Botão Dashboard - Visualização inicial */}
              <Button 
                variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('dashboard')}
                className="h-8 px-3"
                disabled={selectedAreaId && !canViewInitiativeViewMode(userType, userArea, selectedAreaId, 'dashboard')}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Dashboard</span>
              </Button>
              <Button 
                variant={viewMode === 'table-gantt' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table-gantt')}
                className="h-8 px-3"
                disabled={selectedAreaId && !canViewInitiativeViewMode(userType, userArea, selectedAreaId, 'table-gantt')}
              >
                <List className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Tabela/Gantt</span>
              </Button>
              <Button 
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3"
                disabled={selectedAreaId && !canViewInitiativeViewMode(userType, userArea, selectedAreaId, 'kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Kanban</span>
              </Button>
            </div>
            {canCreate && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" /> Criar
              </Button>
            )}
            {canCreate && (
              <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="flex-shrink-0">
                <Upload className="mr-2 h-4 w-4" /> Importar CSV
              </Button>
            )}
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
        ) : viewMode === 'table-gantt' ? (
          /**
           * Tabela/Gantt - Visualização combinada
           * 
           * Exibe:
           * - Tabela à esquerda com filtros e busca
           * - Gantt à direita com timeline de 6 meses
           * - Layout responsivo sem scroll horizontal
           */
          <TableGanttView 
            initiatives={initiatives} 
            onInitiativeClick={openDossier}
            onUpdateSubItem={updateSubItem}
            onArchive={archiveInitiative}
            onUnarchive={unarchiveInitiative}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <InitiativesKanban initiatives={activeInitiatives} onInitiativeClick={openDossier} />
        )}
      </div>
    </DndProvider>
  );
}
