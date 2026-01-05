"use client";

import React from 'react';
import { useDrop } from 'react-dnd';
import { KanbanPhaseCard } from "./kanban-phase-card";
import type { InitiativePhase, InitiativeStatus } from "@/types";
import { cn } from "@/lib/utils";

/**
 * ============================================
 * COMPONENTE: KanbanPhaseColumn
 * ============================================
 * 
 * Coluna do Kanban para exibir fases agrupadas por status.
 * Similar ao KanbanColumn mas adaptado para fases.
 * 
 * @param column - Dados da coluna (status, título, fases)
 * @param onDropPhase - Função chamada quando uma fase é arrastada e solta
 * @param onPhaseClick - Função chamada ao clicar em uma fase
 * @param onPhaseExpand - Função chamada ao clicar no botão de expandir de uma fase
 * 
 * @example
 * <KanbanPhaseColumn
 *   column={{ id: 'Em execução', title: 'Em execução', phases: [...] }}
 *   onDropPhase={(phaseId, newStatus) => handleDropPhase(phaseId, newStatus)}
 *   onPhaseClick={(phase) => handlePhaseClick(phase)}
 *   onPhaseExpand={(phaseId) => expandPhase(phaseId)}
 * />
 */
interface KanbanPhaseColumnProps {
  column: {
    id: InitiativeStatus;
    title: string;
    phases: InitiativePhase[];
  };
  initiativeId: string; // ID da iniciativa pai (necessário para os cards)
  onDropPhase: (phaseId: string, initiativeId: string, newStatus: InitiativeStatus) => void;
  onPhaseClick: (phase: InitiativePhase) => void;
  onPhaseExpand?: (phaseId: string) => void;
}

export function KanbanPhaseColumn({ 
  column, 
  initiativeId,
  onDropPhase, 
  onPhaseClick,
  onPhaseExpand 
}: KanbanPhaseColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'phase',
    drop: (item: { id: string; initiativeId: string }) => {
      onDropPhase(item.id, item.initiativeId, column.id);
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
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{column.phases.length}</span>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto flex-grow px-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent min-h-[calc(100vh-250px)]">
        {column.phases.map((phase) => (
          <KanbanPhaseCard
            key={phase.id}
            phase={phase}
            initiativeId={initiativeId}
            onClick={() => onPhaseClick(phase)}
            onExpand={onPhaseExpand ? () => onPhaseExpand(phase.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

