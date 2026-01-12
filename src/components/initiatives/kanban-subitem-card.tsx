"use client";

import type { SubItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDrag } from 'react-dnd';
import { isOverdue } from "@/lib/initiatives-helpers";

/**
 * ============================================
 * COMPONENTE: KanbanSubItemCard
 * ============================================
 * 
 * Card para exibir um subitem no Kanban hierárquico.
 * Similar ao KanbanTaskCard mas adaptado para subitens.
 * Não tem botão de expandir (último nível).
 * 
 * @param subItem - Dados do subitem a exibir
 * @param onClick - Função chamada ao clicar no card
 * 
 * @example
 * <KanbanSubItemCard
 *   subItem={subItem}
 *   onClick={() => handleSubItemClick(subItem)}
 * />
 */
interface KanbanSubItemCardProps {
  subItem: SubItem;
  initiativeId: string; // ID da iniciativa pai (necessário para drag and drop)
  itemId: string; // ID do item pai (necessário para drag and drop)
  onClick: () => void; // Função chamada ao clicar no card (abre modal de informações)
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

export function KanbanSubItemCard({ subItem, initiativeId, itemId, onClick }: KanbanSubItemCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'subitem',
    item: { id: subItem.id, initiativeId, itemId }, // Passa o ID do subitem, iniciativa e item
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  // Verificar se está em atraso
  const subItemIsOverdue = isOverdue(subItem.endDate, subItem.status);
  
  const priorityColorMapping: Record<typeof subItem.priority, string> = {
    'Alta': 'bg-red-100 text-red-700',
    'Média': 'bg-yellow-100 text-yellow-700',
    'Baixa': 'bg-blue-100 text-blue-700'
  };
  const priorityColorClass = priorityColorMapping[subItem.priority] || "bg-gray-200 text-gray-700";

  let statusIndicator = null;
  if (subItem.status === 'Em Risco') {
    statusIndicator = (
      <div title="Em Risco">
        <AlertTriangle className="h-4 w-4 text-orange-500 ml-auto" />
      </div>
    );
  } else if (subItem.status === 'Atrasado' || subItemIsOverdue) {
    statusIndicator = (
      <div title="Atrasado">
        <Clock className="h-4 w-4 text-red-500 ml-auto" />
      </div>
    );
  }

  const responsible = subItem.responsible || 'Sem responsável';

  return (
    <div ref={drag as any} style={{ opacity: isDragging ? 0.5 : 1 }} className="cursor-grab active:cursor-grabbing">
      <Card className={cn(
        "shadow-sm hover:shadow-md transition-shadow duration-200 border-border",
        // Cor de fundo vermelha clara quando atrasado
        subItemIsOverdue ? 'bg-red-50 border-red-200' : 'bg-card',
        subItem.status === 'Em Risco' ? 'border-l-4 border-l-orange-500' : '',
        (subItem.status === 'Atrasado' || subItemIsOverdue) ? 'border-l-4 border-l-red-500' : ''
      )}>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-start space-x-2 min-w-0">
            <h4 
              className="text-sm font-medium text-card-foreground flex-grow truncate min-w-0 cursor-pointer" 
              title={subItem.title}
              onClick={onClick}
            >
              {subItem.title}
            </h4>
            {statusIndicator && <div className="flex-shrink-0">{statusIndicator}</div>}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", priorityColorClass)}>
              {subItem.priority}
            </Badge>
            <div className="flex items-center gap-2">
              {subItem.endDate && (
                <span>{new Date(subItem.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
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

