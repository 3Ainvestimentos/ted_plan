
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
import { EditInitiativeModal } from "@/components/initiatives/edit-initiative-modal";
import { useAuth } from "@/contexts/auth-context";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { canCreateInitiative, canViewMode, canEditInitiativeStatus } from "@/lib/permissions-config";
import { Badge } from "@/components/ui/badge";


type ViewMode = "dashboard" | "table-gantt" | "kanban";

/**
 * ============================================
 * FUNÇÕES HELPER DE ÁREA
 * ============================================
 */

/**
 * Obtém a área padrão baseada no tipo de usuário quando não há filtro selecionado.
 * 
 * REGRAS:
 * - Head: Retorna a área do próprio usuário (userArea) para visualização completa
 * - PMO: Busca e retorna a área "Estratégia e IA" por nome
 * - Admin: Retorna null (pode ver todas as áreas)
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param userArea - ID da área do usuário (apenas para Head)
 * @param businessAreas - Array de todas as áreas de negócio disponíveis
 * @returns ID da área padrão ou null se não houver padrão definido
 * 
 * @example
 * // Head sem filtro
 * const defaultArea = getDefaultAreaId('head', 'area-123', businessAreas);
 * // Retorna: 'area-123'
 * 
 * @example
 * // PMO sem filtro
 * const defaultArea = getDefaultAreaId('pmo', undefined, businessAreas);
 * // Retorna: ID da área "Estratégia e IA"
 */
function getDefaultAreaId(
  userType: 'admin' | 'pmo' | 'head',
  userArea: string | undefined,
  businessAreas: Array<{ id: string; name: string }>
): string | null {
  // Head: usa sua própria área como padrão
  if (userType === 'head' && userArea) {
    return userArea;
  }
  
  // PMO: busca área "Estratégia e IA" primeiro por ID, depois por nome
  if (userType === 'pmo' || userType === 'admin') {
    // Primeiro: buscar pelo ID específico
    const estrategiaAreaById = businessAreas.find(
      area => area.id === 'Sg1SSSWI0WMy4U3Dgc3e'
    );
    if (estrategiaAreaById) {
      return estrategiaAreaById.id;
    }
    
    // Fallback: buscar por nome "Estratégia e IA"
    const estrategiaArea = businessAreas.find(
      area => area.name.toLowerCase().includes('estratégia') && 
              (area.name.toLowerCase().includes('ia') || area.name.toLowerCase().includes('ai'))
    );
    
    // Fallback adicional: busca apenas por "Estratégia" se não encontrar com IA
    if (!estrategiaArea) {
      const estrategiaFallback = businessAreas.find(
        area => area.name.toLowerCase().includes('estratégia')
      );
      return estrategiaFallback?.id || null;
    }
    
    return estrategiaArea.id || null;
  }
  
  // Admin sem área específica: retorna null (pode ver todas)
  return null;
}

/**
 * Obtém a área efetiva considerando a área selecionada e os padrões.
 * 
 * LÓGICA:
 * - Se há selectedAreaId na URL, retorna essa área
 * - Se não há selectedAreaId, retorna a área padrão baseada no userType
 * - Retorna null se não houver área selecionada nem padrão
 * 
 * @param selectedAreaId - ID da área selecionada na URL (pode ser null)
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param userArea - ID da área do usuário (apenas para Head)
 * @param businessAreas - Array de todas as áreas de negócio disponíveis
 * @returns ID da área efetiva ou null se não houver área definida
 * 
 * @example
 * // Head com filtro selecionado
 * const effectiveArea = getEffectiveAreaId('area-456', 'head', 'area-123', businessAreas);
 * // Retorna: 'area-456'
 * 
 * @example
 * // Head sem filtro (usa padrão)
 * const effectiveArea = getEffectiveAreaId(null, 'head', 'area-123', businessAreas);
 * // Retorna: 'area-123' (sua própria área)
 */
function getEffectiveAreaId(
  selectedAreaId: string | null,
  userType: 'admin' | 'pmo' | 'head',
  userArea: string | undefined,
  businessAreas: Array<{ id: string; name: string }>
): string | null {
  // Se há área selecionada na URL, usar ela
  if (selectedAreaId) {
    return selectedAreaId;
  }
  
  // Caso contrário, usar área padrão
  return getDefaultAreaId(userType, userArea, businessAreas);
}

export default function InitiativesPage() {
  const { initiatives, isLoading, updateInitiativeStatus, updateSubItem, updatePhase, archiveInitiative, unarchiveInitiative } = useInitiatives();
  const { user, getUserArea } = useAuth();
  const { businessAreas } = useStrategicPanel();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Verificar permissões
  const userType = user?.userType || 'head';
  const userArea = getUserArea();
  const canCreate = canCreateInitiative(userType);
  
  // Obter área selecionada da URL
  const selectedAreaId = searchParams.get('area') || null;
  
  // Calcular área efetiva (selecionada ou padrão)
  const effectiveAreaId = useMemo(() => {
    return getEffectiveAreaId(selectedAreaId, userType, userArea, businessAreas);
  }, [selectedAreaId, userType, userArea, businessAreas]);
  
  // Área selecionada para exibição (pode ser diferente da efetiva se não há filtro)
  const selectedArea = useMemo(() => {
    const areaIdToShow = selectedAreaId || effectiveAreaId;
    if (!areaIdToShow) return null;
    return businessAreas.find(a => a.id === areaIdToShow) || null;
  }, [selectedAreaId, effectiveAreaId, businessAreas]);

  /**
   * Dashboard é a visualização inicial/padrão da página
   * Oferece uma visão geral das métricas antes de entrar nas visualizações detalhadas
   */
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  
  // Verificar se pode ver o modo de visualização atual usando área efetiva
  const canViewCurrentMode = useMemo(() => {
    if (!effectiveAreaId) return true; // Sem área efetiva, pode ver tudo (admin)
    return canViewMode(userType, userArea, effectiveAreaId, viewMode);
  }, [userType, userArea, effectiveAreaId, viewMode]);

  // Ajustar viewMode se não tiver permissão
  useEffect(() => {
    if (!canViewCurrentMode && effectiveAreaId && viewMode !== 'dashboard') {
      // Se não pode ver o modo atual, forçar dashboard
      setViewMode('dashboard');
    }
  }, [canViewCurrentMode, effectiveAreaId, viewMode]);

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

    // Validação: não pode concluir iniciativa se nem todas as fases estão concluídas
    // IMPORTANTE: Esta validação deve ser SEMPRE aplicada, mesmo se a iniciativa estiver em atraso
    // IMPORTANTE: Fases sem status ou com status vazio são consideradas não concluídas
    if (newStatus === 'Concluído') {
      // Se não tem fases, pode concluir
      if (initiative.phases && initiative.phases.length > 0) {
        // Verificar se todas as fases têm status definido e igual a 'Concluído'
        const allPhasesCompleted = initiative.phases.every(phase => phase.status === 'Concluído');
        if (!allPhasesCompleted) {
          toast({
            variant: 'destructive',
            title: "Não é possível concluir",
            description: "Todas as fases devem estar concluídas antes de concluir a iniciativa.",
          });
          return;
        }
      }
    }

    updateInitiativeStatus(initiativeId, newStatus);
  }

  /**
   * Handler para atualizar status de fase diretamente do Gantt
   * 
   * Quando o usuário muda o status de uma fase no dropdown, essa função é chamada
   */
  const handlePhaseStatusChange = (initiativeId: string, phaseId: string, newStatus: InitiativeStatus) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) return;

    // Verificar permissão para editar status (mesma regra da iniciativa)
    const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId);

    if (!canEdit) {
      toast({
        variant: 'destructive',
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar o status desta fase.",
      });
      return;
    }

    // Buscar a fase
    const phase = initiative.phases?.find(p => p.id === phaseId);
    if (!phase) return;

    // Validação: não pode concluir fase se nem todos os subitens estão concluídos
    // IMPORTANTE: Esta validação deve ser SEMPRE aplicada, mesmo se a fase estiver em atraso
    if (newStatus === 'Concluído') {
      // Se não tem subitens, pode concluir
      if (phase.subItems && phase.subItems.length > 0) {
        const allSubItemsCompleted = phase.subItems.every(subItem => subItem.status === 'Concluído');
        if (!allSubItemsCompleted) {
          toast({
            variant: 'destructive',
            title: "Não é possível concluir",
            description: "Todos os subitens devem estar concluídos antes de concluir a fase.",
          });
          return;
        }
      }
    }

    // Atualizar fase com novo status
    updatePhase(initiativeId, phaseId, { status: newStatus });
  }

  /**
   * Handler para atualizar status de subitem diretamente do Gantt
   * 
   * Quando o usuário muda o status de um subitem no dropdown, essa função é chamada
   */
  const handleSubItemStatusChange = (initiativeId: string, phaseId: string, subItemId: string, newStatus: InitiativeStatus) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) return;

    // Verificar permissão para editar status (mesma regra da iniciativa)
    const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId);

    if (!canEdit) {
      toast({
        variant: 'destructive',
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar o status deste subitem.",
      });
      return;
    }

    // Buscar a fase e o subitem
    const phase = initiative.phases?.find(p => p.id === phaseId);
    if (!phase || !phase.subItems) return;

    const subItem = phase.subItems.find(si => si.id === subItemId);
    if (!subItem) return;

    // Atualizar subitem: sincronizar completed com status
    // IMPORTANTE: "Concluído" = completed true, outros status = completed false
    const updatedSubItems = phase.subItems.map(si => 
      si.id === subItemId 
        ? { ...si, status: newStatus, completed: newStatus === 'Concluído' }
        : si
    );

    // Atualizar fase com subitens atualizados
    updatePhase(initiativeId, phaseId, { subItems: updatedSubItems });
  }
  
  // Filtrar iniciativas por área efetiva (aplicar filtro automático quando não há selectedAreaId)
  const filteredInitiatives = useMemo(() => {
    let filtered = initiatives.filter(i => !i.archived);
    // Usar área efetiva para filtrar (considera área padrão quando não há filtro)
    if (effectiveAreaId) {
      filtered = filtered.filter(i => i.areaId === effectiveAreaId);
    }
    return filtered;
  }, [initiatives, effectiveAreaId]);

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
      
      {editingInitiative && (
        <EditInitiativeModal
          isOpen={!!editingInitiative}
          onOpenChange={(isOpen) => !isOpen && setEditingInitiative(null)}
          initiative={editingInitiative}
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
                {/* Mostrar botão "Remover filtro" apenas se há filtro explícito na URL */}
                {selectedAreaId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAreaFilter}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remover filtro
                  </Button>
                )}
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
                disabled={effectiveAreaId ? !canViewMode(userType, userArea, effectiveAreaId, 'dashboard') : false}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Dashboard</span>
              </Button>
              <Button 
                variant={viewMode === 'table-gantt' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table-gantt')}
                className="h-8 px-3"
                disabled={effectiveAreaId ? !canViewMode(userType, userArea, effectiveAreaId, 'table-gantt') : false}
              >
                <List className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Tabela/Gantt</span>
              </Button>
              <Button 
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3"
                disabled={effectiveAreaId ? !canViewMode(userType, userArea, effectiveAreaId, 'kanban') : false}
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
            initiatives={activeInitiatives} 
            onInitiativeClick={openDossier}
            onEditInitiative={(initiative) => setEditingInitiative(initiative)}
            onUpdateSubItem={updateSubItem}
            onArchive={archiveInitiative}
            onUnarchive={unarchiveInitiative}
            onStatusChange={handleStatusChange}
            onPhaseStatusChange={handlePhaseStatusChange}
            onSubItemStatusChange={handleSubItemStatusChange}
          />
        ) : (
          <InitiativesKanban initiatives={activeInitiatives} onInitiativeClick={openDossier} />
        )}
      </div>
    </DndProvider>
  );
}
