"use client";

import type { InitiativePhase } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDrag } from 'react-dnd';
import { isOverdue } from "@/lib/initiatives-helpers";

/**
 * ============================================
 * COMPONENTE: KanbanPhaseCard
 * ============================================
 * 
 * Card para exibir uma fase no Kanban hierárquico.
 * Similar ao KanbanTaskCard mas adaptado para fases.
 * 
 * @param phase - Dados da fase a exibir
 * @param onClick - Função chamada ao clicar no card
 * @param onExpand - Função chamada ao clicar no botão de expandir (se tiver subitens)
 * 
 * @example
 * <KanbanPhaseCard
 *   phase={phase}
 *   onClick={() => handlePhaseClick(phase)}
 *   onExpand={() => expandPhase(phase.id)}
 * />
 */
interface KanbanPhaseCardProps {
  phase: InitiativePhase;
  initiativeId: string; // ID da iniciativa pai (necessário para drag and drop)
  onClick: () => void;
  onExpand?: () => void;
}

function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return '??';
  }
  const parts = name.trim().split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function KanbanPhaseCard({ phase, initiativeId, onClick, onExpand }: KanbanPhaseCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'phase',
    item: { id: phase.id, initiativeId }, // Passa o ID da fase e da iniciativa
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const hasSubItems = phase.subItems && phase.subItems.length > 0;
  
  // Verificar se está em atraso
  const phaseIsOverdue = isOverdue(phase.deadline, phase.status);
  
  const priorityColorMapping: Record<typeof phase.priority, string> = {
    'Alta': 'bg-red-100 text-red-700',
    'Média': 'bg-yellow-100 text-yellow-700',
    'Baixa': 'bg-blue-100 text-blue-700'
  };
  const priorityColorClass = priorityColorMapping[phase.priority] || "bg-gray-200 text-gray-700";

  let statusIndicator = null;
  if (phase.status === 'Em Risco') {
    statusIndicator = (
      <div title="Em Risco">
        <AlertTriangle className="h-4 w-4 text-orange-500 ml-auto" />
      </div>
    );
  } else if (phase.status === 'Atrasado' || phaseIsOverdue) {
    statusIndicator = (
      <div title="Atrasado">
        <Clock className="h-4 w-4 text-red-500 ml-auto" />
      </div>
    );
  }

  const responsible = phase.responsible || 'Sem responsável';

  return (
    <div ref={drag as any} style={{ opacity: isDragging ? 0.5 : 1 }} className="cursor-grab active:cursor-grabbing">
      <Card className={cn(
        "shadow-sm hover:shadow-md transition-shadow duration-200 border-border",
        // Cor de fundo vermelha clara quando atrasado
        phaseIsOverdue ? 'bg-red-50 border-red-200' : 'bg-card',
        phase.status === 'Em Risco' ? 'border-l-4 border-l-orange-500' : '',
        (phase.status === 'Atrasado' || phaseIsOverdue) ? 'border-l-4 border-l-red-500' : ''
      )}>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-start space-x-2 min-w-0">
            <h4 
              className="text-sm font-medium text-card-foreground flex-grow truncate min-w-0 cursor-pointer" 
              title={phase.title}
              onClick={onClick}
            >
              {phase.title}
            </h4>
            {statusIndicator && <div className="flex-shrink-0">{statusIndicator}</div>}
          </div>

          {hasSubItems && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{phase.subItems?.length || 0} subitens</span>
              {onExpand && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand();
                  }}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                >
                  <span>Expandir</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", priorityColorClass)}>
              {phase.priority}
            </Badge>
            <div className="flex items-center gap-2">
              {phase.deadline && (
                <span>{new Date(phase.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              )}
              <Avatar className="h-6 w-6">
                <AvatarImage 
                  src={`https://placehold.co/24x24.png?text=${getInitials(responsible)}`} 
                  alt={responsible} 
                  data-ai-hint="assignee avatar" 
                />
                <AvatarFallback className="text-xs">{getInitials(responsible)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

