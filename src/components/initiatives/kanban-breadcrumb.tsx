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
 * @param onGoBack - Função chamada ao clicar no botão "Voltar"
 * @param onGoHome - Função chamada ao clicar no botão "Iniciativas" (voltar ao nível raiz)
 * 
 * @example
 * <KanbanBreadcrumb
 *   currentLevel="items"
 *   initiativeTitle="Otimizar Funil de Vendas"
 *   onGoBack={() => setCurrentLevel('initiatives')}
 *   onGoHome={() => setCurrentLevel('initiatives')}
 * />
 */
interface KanbanBreadcrumbProps {
  currentLevel: 'initiatives' | 'items' | 'subitems';
  initiativeTitle?: string;
  itemTitle?: string;
  onGoBack: () => void;
  onGoHome: () => void;
}

export function KanbanBreadcrumb({
  currentLevel,
  initiativeTitle,
  itemTitle,
  onGoBack,
  onGoHome
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
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]" title={initiativeTitle}>
            {initiativeTitle}
          </span>
        </>
      )}
      
      {currentLevel === 'subitems' && initiativeTitle && itemTitle && (
        <>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[150px]" title={initiativeTitle}>
            {initiativeTitle}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[150px]" title={itemTitle}>
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

