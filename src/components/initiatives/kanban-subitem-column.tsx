"use client";

import React from 'react';
import { useDrop } from 'react-dnd';
import { KanbanSubItemCard } from "./kanban-subitem-card";
import type { SubItem, InitiativeStatus } from "@/types";
import { cn } from "@/lib/utils";

/**
 * ============================================
 * COMPONENTE: KanbanSubItemColumn
 * ============================================
 * 
 * Coluna do Kanban para exibir subitens agrupados por status.
 * Similar ao KanbanColumn mas adaptado para subitens.
 * 
 * @param column - Dados da coluna (status, título, subitens)
 * @param onDropSubItem - Função chamada quando um subitem é arrastado e solto
 * @param onSubItemClick - Função chamada ao clicar em um subitem
 * 
 * @example
 * <KanbanSubItemColumn
 *   column={{ id: 'Em execução', title: 'Em execução', subItems: [...] }}
 *   onDropSubItem={(subItemId, newStatus) => handleDropSubItem(subItemId, newStatus)}
 *   onSubItemClick={(subItem) => handleSubItemClick(subItem)}
 * />
 */
interface KanbanSubItemColumnProps {
  column: {
    id: InitiativeStatus;
    title: string;
    subItems: SubItem[];
  };
  initiativeId: string; // ID da iniciativa pai (necessário para os cards)
  itemId: string; // ID do item pai (necessário para os cards)
  onDropSubItem: (subItemId: string, initiativeId: string, itemId: string, newStatus: InitiativeStatus) => void;
  onSubItemClick: (subItem: SubItem) => void;
}

export function KanbanSubItemColumn({ 
  column, 
  initiativeId,
  itemId,
  onDropSubItem, 
  onSubItemClick 
}: KanbanSubItemColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'subitem',
    drop: (item: { id: string; initiativeId: string; itemId: string }) => {
      onDropSubItem(item.id, item.initiativeId, item.itemId, column.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={cn(
        "flex-1 min-w-0 max-w-full bg-secondary/30 rounded-lg p-1.5 flex flex-col transition-colors duration-200",
        isOver && canDrop ? "bg-primary/10" : "",
        isOver && !canDrop ? "bg-destructive/10" : ""
      )}
    >
      <div className="flex justify-between items-center p-2 mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">{column.title}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{column.subItems.length}</span>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto flex-grow px-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent min-h-[calc(100vh-250px)]">
        {column.subItems.map((subItem) => (
          <KanbanSubItemCard
            key={subItem.id}
            subItem={subItem}
            initiativeId={initiativeId}
            itemId={itemId}
            onClick={() => onSubItemClick(subItem)}
          />
        ))}
      </div>
    </div>
  );
}

