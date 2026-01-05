"use client";

import React from 'react';
import { useDrop } from 'react-dnd';
import { KanbanItemCard } from "./kanban-item-card";
import type { InitiativeItem, InitiativeStatus } from "@/types";
import { cn } from "@/lib/utils";

/**
 * ============================================
 * COMPONENTE: KanbanItemColumn
 * ============================================
 * 
 * Coluna do Kanban para exibir itens agrupados por status.
 * Similar ao KanbanColumn mas adaptado para itens.
 * 
 * @param column - Dados da coluna (status, título, itens)
 * @param onDropItem - Função chamada quando um item é arrastado e solto
 * @param onItemClick - Função chamada ao clicar em um item
 * @param onItemExpand - Função chamada ao clicar no botão de expandir de um item
 * 
 * @example
 * <KanbanItemColumn
 *   column={{ id: 'Em execução', title: 'Em execução', items: [...] }}
 *   onDropItem={(itemId, newStatus) => handleDropItem(itemId, newStatus)}
 *   onItemClick={(item) => handleItemClick(item)}
 *   onItemExpand={(itemId) => expandItem(itemId)}
 * />
 */
interface KanbanItemColumnProps {
  column: {
    id: InitiativeStatus;
    title: string;
    items: InitiativeItem[];
  };
  initiativeId: string; // ID da iniciativa pai (necessário para os cards)
  onDropItem: (itemId: string, initiativeId: string, newStatus: InitiativeStatus) => void;
  onItemClick: (item: InitiativeItem) => void;
  onItemExpand?: (itemId: string) => void;
}

export function KanbanItemColumn({ 
  column, 
  initiativeId,
  onDropItem, 
  onItemClick,
  onItemExpand 
}: KanbanItemColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'item',
    drop: (item: { id: string; initiativeId: string }) => {
      onDropItem(item.id, item.initiativeId, column.id);
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
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{column.items.length}</span>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto flex-grow px-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent min-h-[calc(100vh-250px)]">
        {column.items.map((item) => (
          <KanbanItemCard
            key={item.id}
            item={item}
            initiativeId={initiativeId}
            onClick={() => onItemClick(item)}
            onExpand={onItemExpand ? () => onItemExpand(item.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

