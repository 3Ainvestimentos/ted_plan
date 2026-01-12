"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ============================================
 * COMPONENTE: KanbanBreadcrumb
 * ============================================
 * 
 * Componente de navegação breadcrumb para o Kanban hierárquico.
 * Permite navegar entre os níveis: Iniciativas → Itens → Subitens
 * 
 * @param currentLevel - Nível atual de visualização ('initiatives' | 'items' | 'subitems')
 * @param initiativeTitle - Título da iniciativa atual (quando em nível de itens ou subitens)
 * @param itemTitle - Título do item atual (quando em nível de subitens)
 * @param initiativeId - ID da iniciativa atual (necessário para navegação direta)
 * @param itemId - ID do item atual (necessário para navegação direta)
 * @param onGoBack - Função chamada ao clicar no botão "Voltar"
 * @param onGoHome - Função chamada ao clicar no botão "Iniciativas" (voltar ao nível raiz)
 * @param onNavigateToInitiative - Função para navegar para itens da iniciativa (navegação direta)
 * @param onNavigateToItem - Função para navegar para subitens do item (navegação direta)
 * 
 * @example
 * <KanbanBreadcrumb
 *   currentLevel="items"
 *   initiativeTitle="Otimizar Funil de Vendas"
 *   initiativeId="init-123"
 *   onGoBack={() => setCurrentLevel('initiatives')}
 *   onGoHome={() => setCurrentLevel('initiatives')}
 *   onNavigateToInitiative={(id) => expandInitiative(id)}
 * />
 */
interface KanbanBreadcrumbProps {
  currentLevel: 'initiatives' | 'items' | 'subitems';
  initiativeTitle?: string;
  itemTitle?: string;
  initiativeId?: string;
  itemId?: string;
  onGoBack: () => void;
  onGoHome: () => void;
  onNavigateToInitiative?: (initiativeId: string) => void;
  onNavigateToItem?: (itemId: string) => void;
}

export function KanbanBreadcrumb({
  currentLevel,
  initiativeTitle,
  itemTitle,
  initiativeId,
  itemId,
  onGoBack,
  onGoHome,
  onNavigateToInitiative,
  onNavigateToItem
}: KanbanBreadcrumbProps) {
  // Não mostrar breadcrumb no nível raiz (iniciativas)
  if (currentLevel === 'initiatives') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onGoHome}
        className="h-8 px-2 text-xs"
      >
        <Home className="h-3.5 w-3.5 mr-1" />
        Iniciativas
      </Button>
      
      {currentLevel === 'items' && initiativeTitle && (
        <>
          <span className="text-muted-foreground">/</span>
          <span 
            className={cn(
              "text-sm font-medium text-foreground truncate max-w-[200px]",
              initiativeId && onNavigateToInitiative && "cursor-pointer hover:text-primary transition-colors"
            )}
            title={initiativeId && onNavigateToInitiative ? "Ver itens desta iniciativa" : initiativeTitle}
            onClick={initiativeId && onNavigateToInitiative ? () => onNavigateToInitiative(initiativeId) : undefined}
          >
            {initiativeTitle}
          </span>
        </>
      )}
      
      {currentLevel === 'subitems' && initiativeTitle && itemTitle && (
        <>
          <span className="text-muted-foreground">/</span>
          <span 
            className={cn(
              "text-sm font-medium text-foreground truncate max-w-[150px]",
              initiativeId && onNavigateToInitiative && "cursor-pointer hover:text-primary transition-colors"
            )}
            title={initiativeId && onNavigateToInitiative ? "Ver itens desta iniciativa" : initiativeTitle}
            onClick={initiativeId && onNavigateToInitiative ? () => onNavigateToInitiative(initiativeId) : undefined}
          >
            {initiativeTitle}
          </span>
          <span className="text-muted-foreground">/</span>
          <span 
            className={cn(
              "text-sm font-medium text-foreground truncate max-w-[150px]",
              itemId && onNavigateToItem && "cursor-pointer hover:text-primary transition-colors"
            )}
            title={itemId && onNavigateToItem ? "Recarregar visualização dos subitens deste item" : itemTitle}
            onClick={itemId && onNavigateToItem ? () => onNavigateToItem(itemId) : undefined}
          >
            {itemTitle}
          </span>
        </>
      )}
      
      <div className="ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onGoBack}
          className="h-8 px-3 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Voltar
        </Button>
      </div>
    </div>
  );
}

