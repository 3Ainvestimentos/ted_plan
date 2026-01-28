
"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List, LayoutDashboard, X } from "lucide-react";
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
import { EditInitiativeModal } from "@/components/initiatives/edit-initiative-modal";
import { useAuth } from "@/contexts/auth-context";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { canCreateInitiative, canViewMode, canEditInitiativeStatus } from "@/lib/permissions-config";
import { Badge } from "@/components/ui/badge";
import type { InitiativePageContext } from "@/lib/permissions-config";


type ViewMode = "dashboard" | "table-gantt" | "kanban";

const PAGE_CONTEXT: InitiativePageContext = 'other-initiatives';

/**
 * ============================================
 * FUNÇÕES HELPER DE ÁREA
 * ============================================
 */

/**
 * Obtém a área padrão baseada no tipo de usuário quando não há filtro selecionado.
 * 
 * REGRAS PARA OUTRAS INICIATIVAS:
 * - Head: Retorna a área do próprio usuário (userArea) - SEMPRE sua própria área
 * - PMO: Retorna null (pode ver todas as áreas)
 * - Admin: Retorna null (pode ver todas as áreas)
 * 
 * DIFERENÇA: Em "Outras Iniciativas", PMO e Admin não têm área padrão específica
 * (não usam "Estratégia e IA" como padrão)
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param userArea - ID da área do usuário (apenas para Head)
 * @param businessAreas - Array de todas as áreas de negócio disponíveis
 * @returns ID da área padrão ou null se não houver padrão definido
 */
function getDefaultAreaId(
  userType: 'admin' | 'pmo' | 'head',
  userArea: string | undefined,
  businessAreas: Array<{ id: string; name: string }>
): string | null {
  // Head: usa sua própria área como padrão (SEMPRE)
  if (userType === 'head' && userArea) {
    return userArea;
  }
  
  // PMO e Admin: sem área padrão (podem ver todas)
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

export default function OtherInitiativesPage() {
  const { initiatives, isLoading, updateInitiativeStatus, updateSubItem, updateItem, archiveInitiative, unarchiveInitiative } = useInitiatives();
  const { user, getUserArea } = useAuth();
  const { businessAreas, updateBusinessArea } = useStrategicPanel();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Obter área selecionada da URL
  const selectedAreaId = searchParams.get('area') || null;
  
  // Verificar permissões com pageContext
  const userType = user?.userType || 'head';
  const userArea = getUserArea();
  
  // Calcular área efetiva (selecionada ou padrão)
  const effectiveAreaId = useMemo(() => {
    return getEffectiveAreaId(selectedAreaId, userType, userArea, businessAreas);
  }, [selectedAreaId, userType, userArea, businessAreas]);
  
  // Verificar permissão para criar usando a área efetiva
  // Para head em 'other-initiatives', precisa que a área efetiva seja sua própria área
  const canCreate = useMemo(() => {
    return canCreateInitiative(userType, PAGE_CONTEXT, userArea, effectiveAreaId || undefined);
  }, [userType, userArea, effectiveAreaId]);
  
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

    // Verificar permissão para editar status com pageContext
    const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId, PAGE_CONTEXT);

    if (!canEdit) {
      toast({
        variant: 'destructive',
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar o status desta iniciativa.",
      });
      return;
    }

    // Validação: não pode concluir iniciativa se nem todos os itens estão concluídos
    if (newStatus === 'Concluído') {
      if (initiative.items && initiative.items.length > 0) {
        const allItemsCompleted = initiative.items.every(item => item.status === 'Concluído');
        if (!allItemsCompleted) {
          toast({
            variant: 'destructive',
            title: "Não é possível concluir",
            description: "Todos os itens devem estar concluídos antes de concluir a iniciativa.",
          });
          return;
        }
      }
    }

    updateInitiativeStatus(initiativeId, newStatus);
  }

  /**
   * Handler para atualizar status de item diretamente do Gantt
   */
  const handleItemStatusChange = (initiativeId: string, itemId: string, newStatus: InitiativeStatus) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) return;

    // Verificar permissão para editar status com pageContext
    const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId, PAGE_CONTEXT);

    if (!canEdit) {
      toast({
        variant: 'destructive',
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar o status deste item.",
      });
      return;
    }

    const item = initiative.items?.find(p => p.id === itemId);
    if (!item) return;

    // Validação: não pode concluir item se nem todos os subitens estão concluídos
    if (newStatus === 'Concluído') {
      if (item.subItems && item.subItems.length > 0) {
        const allSubItemsCompleted = item.subItems.every(subItem => subItem.status === 'Concluído');
        if (!allSubItemsCompleted) {
          toast({
            variant: 'destructive',
            title: "Não é possível concluir",
            description: "Todos os subitens devem estar concluídos antes de concluir o item.",
          });
          return;
        }
      }
    }

    updateItem(initiativeId, itemId, { status: newStatus });
  }

  /**
   * Handler para atualizar status de subitem diretamente do Gantt
   */
  const handleSubItemStatusChange = (initiativeId: string, itemId: string, subItemId: string, newStatus: InitiativeStatus) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative) return;

    // Verificar permissão para editar status com pageContext
    const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId, PAGE_CONTEXT);

    if (!canEdit) {
      toast({
        variant: 'destructive',
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar o status deste subitem.",
      });
      return;
    }

    const item = initiative.items?.find(p => p.id === itemId);
    if (!item || !item.subItems) return;

    const subItem = item.subItems.find(si => si.id === subItemId);
    if (!subItem) return;

    // Atualizar subitem: sincronizar completed com status
    const completed = newStatus === 'Concluído';
    updateSubItem(initiativeId, itemId, subItemId, completed, newStatus);
  }
  
  // Filtrar iniciativas por initiativeType === 'other' E por área efetiva
  const filteredInitiatives = useMemo(() => {
    let filtered = initiatives.filter(i => {
      // Filtrar por tipo: apenas 'other' (undefined/null tratado como 'strategic')
      const isOther = i.initiativeType === 'other';
      // Filtrar não arquivadas
      const notArchived = !i.archived;
      return isOther && notArchived;
    });
    
    // Usar área efetiva para filtrar (considera área padrão quando não há filtro)
    if (effectiveAreaId) {
      filtered = filtered.filter(i => i.areaId === effectiveAreaId);
    }
    return filtered;
  }, [initiatives, effectiveAreaId]);

  const activeInitiatives = filteredInitiatives;

  /**
   * Handler para atualizar a contextualização geral da área
   */
  const handleUpdateAreaContext = async (areaId: string, generalContext: string) => {
    try {
      await updateBusinessArea(areaId, { generalContext });
    } catch (error) {
      console.error('Erro ao atualizar contextualização da área:', error);
      throw error;
    }
  };

  // Remover filtro de área
  const clearAreaFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('area');
    router.push(`/other-initiatives${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <CreateInitiativeModal 
        isOpen={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        preselectedAreaId={selectedAreaId}
        pageContext={PAGE_CONTEXT}
      />
      
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
          pageContext={PAGE_CONTEXT}
        />
      )}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <PageHeader
              title="Outras Iniciativas"
              description={selectedArea 
                ? `Iniciativas da área: ${selectedArea.name}` 
                : "Gerencie iniciativas operacionais e projetos da sua área."}
            />
            {selectedArea && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  Área: {selectedArea.name}
                </Badge>
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
          </div>
        </div>
        
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : viewMode === 'dashboard' ? (
          <InitiativesDashboard 
            initiatives={activeInitiatives}
            selectedAreaId={effectiveAreaId}
            selectedAreaName={selectedArea?.name}
            selectedAreaGeneralContext={selectedArea?.generalContext}
            onUpdateArea={handleUpdateAreaContext}
          />
        ) : viewMode === 'table-gantt' ? (
          <TableGanttView 
            initiatives={activeInitiatives} 
            onInitiativeClick={openDossier}
            onEditInitiative={(initiative) => setEditingInitiative(initiative)}
            onUpdateSubItem={updateSubItem}
            onArchive={archiveInitiative}
            onUnarchive={unarchiveInitiative}
            onStatusChange={handleStatusChange}
            onItemStatusChange={handleItemStatusChange}
            onSubItemStatusChange={handleSubItemStatusChange}
          />
        ) : (
          <InitiativesKanban 
            initiatives={activeInitiatives} 
            onInitiativeClick={openDossier}
            pageContext={PAGE_CONTEXT}
          />
        )}
      </div>
    </DndProvider>
  );
}
