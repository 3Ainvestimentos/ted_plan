"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { AgendaAreaFilter } from "@/components/agenda/agenda-area-filter";
import { AgendaFilters } from "@/components/agenda/agenda-filters";
import { AgendaTable } from "@/components/agenda/agenda-table";
import { useInitiatives } from "@/contexts/initiatives-context";
import { useAuth } from "@/contexts/auth-context";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { useToast } from "@/hooks/use-toast";
import { getWeekItems, type AgendaItem } from "@/lib/agenda-helpers";
import { canEditInitiativeStatus } from "@/lib/permissions-config";
import type { InitiativeStatus, InitiativePriority } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Obtém a área padrão baseada no tipo de usuário quando não há filtro selecionado.
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

export default function AgendaPage() {
  const { initiatives, isLoading, updateItem, updateSubItem } = useInitiatives();
  const { user, getUserArea } = useAuth();
  const { businessAreas } = useStrategicPanel();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  // Verificar permissões
  const userType = user?.userType || 'head';
  const userArea = getUserArea();
  
  // Obter área selecionada da URL
  const selectedAreaId = searchParams.get('area') || null;
  
  // Calcular área efetiva (selecionada ou padrão)
  const effectiveAreaId = useMemo(() => {
    return getEffectiveAreaId(selectedAreaId, userType, userArea, businessAreas);
  }, [selectedAreaId, userType, userArea, businessAreas]);
  
  // Filtrar iniciativas por área efetiva
  const filteredInitiatives = useMemo(() => {
    let filtered = initiatives.filter(i => !i.archived);
    
    // Aplicar filtro de área
    if (effectiveAreaId) {
      filtered = filtered.filter(i => i.areaId === effectiveAreaId);
    }
    
    return filtered;
  }, [initiatives, effectiveAreaId]);
  
  // Obter itens da semana vigente
  const weekItems = useMemo(() => {
    return getWeekItems(filteredInitiatives);
  }, [filteredInitiatives]);
  
  // Estados dos filtros
  const [projectFilter, setProjectFilter] = useState<string | 'all'>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<InitiativePriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<InitiativeStatus | 'all'>('all');
  
  // Aplicar filtros secundários
  const filteredItems = useMemo(() => {
    return weekItems.filter(item => {
      // Filtro de projeto
      if (projectFilter !== 'all' && item.initiativeId !== projectFilter) {
        return false;
      }
      
      // Filtro de responsável
      if (responsibleFilter !== 'all' && item.responsible !== responsibleFilter) {
        return false;
      }
      
      // Filtro de prioridade
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }
      
      // Filtro de status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [weekItems, projectFilter, responsibleFilter, priorityFilter, statusFilter]);
  
  // Handler para atualizar status de item
  const handleItemStatusChange = (item: AgendaItem, newStatus: InitiativeStatus) => {
    // Buscar a iniciativa
    const initiative = filteredInitiatives.find(i => i.id === item.initiativeId);
    if (!initiative) return;
    
    // Verificar permissão
    const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId);
    if (!canEdit) {
      toast({
        variant: 'destructive',
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar o status deste item.",
      });
      return;
    }
    
    // Buscar o item
    const initiativeItem = initiative.items?.find(i => i.id === item.id);
    if (!initiativeItem) return;
    
    // Validação: não pode concluir item se nem todos os subitens estão concluídos
    if (newStatus === 'Concluído') {
      if (initiativeItem.subItems && initiativeItem.subItems.length > 0) {
        const allSubItemsCompleted = initiativeItem.subItems.every(subItem => subItem.status === 'Concluído');
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
    
    // Atualizar item
    updateItem(initiative.id, item.id, { status: newStatus });
  };
  
  // Handler para atualizar status de subitem
  const handleSubItemStatusChange = (item: AgendaItem, newStatus: InitiativeStatus) => {
    // Buscar a iniciativa
    const initiative = filteredInitiatives.find(i => i.id === item.initiativeId);
    if (!initiative) return;
    
    // Verificar permissão
    const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId);
    if (!canEdit) {
      toast({
        variant: 'destructive',
        title: "Acesso Negado",
        description: "Você não tem permissão para alterar o status deste subitem.",
      });
      return;
    }
    
    // Buscar o item e o subitem
    const initiativeItem = initiative.items?.find(i => i.id === item.itemId);
    if (!initiativeItem || !initiativeItem.subItems) return;
    
    const subItem = initiativeItem.subItems.find(si => si.id === item.id);
    if (!subItem) return;
    
    // Atualizar subitem: sincronizar completed com status
    const completed = newStatus === 'Concluído';
    updateSubItem(initiative.id, item.itemId!, item.id, completed, newStatus);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Agenda"
          description="Subitens de projetos que devem ser concluídos na semana vigente para evitar atrasos."
        />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Subitens de projetos que devem ser concluídos na semana vigente para evitar atrasos."
      />
      
      {/* Filtro de área (apenas para PMO e Admin) */}
      <AgendaAreaFilter />
      
      {/* Filtros secundários */}
      <AgendaFilters
        items={weekItems}
        projectFilter={projectFilter}
        responsibleFilter={responsibleFilter}
        priorityFilter={priorityFilter}
        statusFilter={statusFilter}
        onProjectChange={setProjectFilter}
        onResponsibleChange={setResponsibleFilter}
        onPriorityChange={setPriorityFilter}
        onStatusChange={setStatusFilter}
      />
      
      {/* Seção Agenda da Semana Vigente */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Agenda da Semana Vigente</h2>
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? 'atividade encontrada' : 'atividades encontradas'}
          </p>
        </div>
        
        {/* Tabela */}
        <AgendaTable
          items={filteredItems}
          onItemStatusChange={handleItemStatusChange}
          onSubItemStatusChange={handleSubItemStatusChange}
        />
      </div>
    </div>
  );
}

