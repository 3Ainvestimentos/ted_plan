"use client";

/**
 * ============================================
 * PÁGINA: M&As (Fusões e Aquisições)
 * ============================================
 * 
 * Esta página exibe os deals de M&A em 3 visualizações:
 * - Tabela: Lista tradicional
 * - Kanban: Cards organizados por status
 * - Gantt: Timeline visual de prazos
 * 
 * FLUXO DE DADOS:
 * 1. useMnaDeals() → busca dados do Firestore
 * 2. deals[] → passa para os componentes de visualização
 * 3. Cada visualização renderiza os mesmos dados de forma diferente
 */

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List, GanttChart } from "lucide-react";
import { useMnaDeals } from "@/contexts/m-and-as-context";
import { InitiativesTable } from "@/components/initiatives/initiatives-table";
import { MnaKanban } from "@/components/m-and-as/mna-kanban";
import { MnaGanttView } from "@/components/m-and-as/mna-gantt-view";
import { PageHeader } from "@/components/layout/page-header";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { MnaDeal, InitiativeStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { InitiativeDossierModal } from "@/components/initiatives/initiative-dossier-modal";
import { UpsertDealModal } from "@/components/m-and-as/upsert-deal-modal";

/**
 * ViewMode - Tipo que define as visualizações possíveis
 * 
 * Em TypeScript, 'type' cria um alias para um tipo
 * O '|' significa "ou" - pode ser um desses valores
 */
type ViewMode = "table" | "kanban" | "gantt";

export default function MnaPage() {
  /**
   * ============================================
   * HOOKS E ESTADOS
   * ============================================
   * 
   * useMnaDeals() - Hook customizado que:
   * 1. Conecta ao Firestore
   * 2. Busca a coleção 'mnaDeals'
   * 3. Retorna { deals, isLoading, updateDealStatus, ... }
   * 
   * useState() - Hook do React para criar estado local
   * SINTAXE: const [valor, setValor] = useState(valorInicial);
   * 
   * - 'valor' = o estado atual
   * - 'setValor' = função para atualizar o estado
   * - Quando setValor é chamado, o componente re-renderiza
   */
  const { deals, isLoading, updateDealStatus, updateSubItem, archiveDeal, unarchiveDeal } = useMnaDeals();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  /**
   * Busca o deal atualizado do array deals
   * 
   * Isso garante que quando o checkbox é atualizado,
   * o modal sempre mostra o estado mais recente
   */
  const selectedDeal = useMemo(() => {
    if (!selectedDealId) return null;
    return deals.find(d => d.id === selectedDealId) || null;
  }, [selectedDealId, deals]);

  /**
   * Funções de callback para abrir/fechar o modal de detalhes
   * 
   * Arrow function: (parametro) => { corpo }
   * É uma forma mais curta de escrever funções
   */
  const openDossier = (deal: MnaDeal) => {
    setSelectedDealId(deal.id); // Salva apenas o ID
  };

  const closeDossier = () => {
    setSelectedDealId(null);
  };

  /**
   * Callback para atualizar status diretamente do Gantt
   * 
   * Esta função é passada como prop para o MnaGanttView
   * Quando o usuário muda o status no dropdown, essa função é chamada
   * Ela então chama updateDealStatus do contexto, que salva no Firestore
   */
  const handleStatusChange = (dealId: string, newStatus: InitiativeStatus) => {
    updateDealStatus(dealId, newStatus);
  };
  
  /**
   * useMemo - Memoriza o resultado de um cálculo
   * 
   * Aqui filtramos deals para remover os arquivados
   * O [deals] no final significa: só recalcula quando 'deals' mudar
   * 
   * .filter() - Cria novo array apenas com itens que passam no teste
   * (i => !i.archived) - Função que retorna true se NÃO está arquivado
   */
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
          isMna={true}
        />
      )}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader
            title="M&As"
            description="Gerencie seu funil de oportunidades de Fusões e Aquisições."
          />
          {/* ============================================
               SELETOR DE VISUALIZAÇÃO
               ============================================
               
               Grupo de botões para alternar entre visualizações
               
               variant={condicao ? 'secondary' : 'ghost'}
               - Se a condição for true → usa variant 'secondary' (botão destacado)
               - Se false → usa 'ghost' (botão transparente)
               
               Isso cria o efeito visual de "botão selecionado"
            */}
            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
              <div className="p-1 bg-muted rounded-lg flex items-center">
                {/* Botão Tabela */}
                <Button 
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Tabela</span>
                </Button>
                
                {/* Botão Kanban */}
                <Button 
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('kanban')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Kanban</span>
                </Button>
                
                {/* Botão Gantt (NOVO) */}
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
              
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Criar Deal
              </Button>
            </div>
        </div>
        
        {/* ============================================
           RENDERIZAÇÃO CONDICIONAL
           ============================================
           
           Esta é uma cadeia de operadores ternários:
           
           condição1 ? resultado1 : condição2 ? resultado2 : resultado3
           
           Leia assim:
           - Se isLoading → mostra Skeleton
           - Senão, se viewMode === 'table' → mostra Tabela
           - Senão, se viewMode === 'kanban' → mostra Kanban
           - Senão → mostra Gantt
           
           IMPORTANTE SOBRE FIRESTORE:
           Os dados (deals) vêm do useMnaDeals() que:
           1. Chama getDocs(collection(db, 'mnaDeals'))
           2. Transforma cada documento em objeto MnaDeal
           3. Retorna no array 'deals'
           4. Passamos esse array para os componentes de visualização
        */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : viewMode === 'table' ? (
          <InitiativesTable 
            initiatives={initiatives} 
            onInitiativeClick={openDossier}
            onUpdateSubItem={updateSubItem}
            onArchive={archiveDeal}
            onUnarchive={unarchiveDeal}
          />
        ) : viewMode === 'kanban' ? (
          <MnaKanban deals={activeDeals} onDealClick={openDossier} />
        ) : (
          /* 
           * MnaGanttView - Visualização Gantt
           * 
           * Props passadas:
           * - deals: Array de deals do Firestore (filtrados para não arquivados)
           * - onDealClick: Função que abre o modal de detalhes
           * - onStatusChange: Função que atualiza status no Firestore
           */
          <MnaGanttView 
            deals={activeDeals} 
            onDealClick={openDossier}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </DndProvider>
  );
}
