"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { STATUS_ICONS } from "@/lib/constants";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Initiative, InitiativeItem, SubItem } from "@/types";
import { cn } from "@/lib/utils";

interface HierarchyItemInfoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'initiative' | 'item' | 'subitem';
  data: Initiative | InitiativeItem | SubItem;
  // Opcional: para exibir filhos (itens de uma iniciativa, subitens de um item)
  children?: Array<InitiativeItem | SubItem>;
}

/**
 * Formata uma data ISO string para formato brasileiro
 */
function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  
  try {
    // Se é formato ISO 'YYYY-MM-DD'
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
    
    // Tentar parsear como Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
    
    return dateString;
  } catch {
    return dateString;
  }
}

export function HierarchyItemInfoModal({ 
  isOpen, 
  onOpenChange, 
  type, 
  data,
  children 
}: HierarchyItemInfoModalProps) {
  
  const getTitle = () => {
    switch (type) {
      case 'initiative':
        return 'Informações da Iniciativa';
      case 'item':
        return 'Informações do Item';
      case 'subitem':
        return 'Informações do Subitem';
    }
  };

  const getResponsible = () => {
    if (type === 'initiative') {
      return (data as Initiative).owner || '-';
    } else if (type === 'item') {
      return (data as InitiativeItem).responsible || '-';
    } else {
      return (data as SubItem).responsible || '-';
    }
  };

  const getStartDate = () => {
    if (type === 'initiative') {
      return (data as Initiative).startDate;
    } else if (type === 'item') {
      return (data as InitiativeItem).startDate;
    } else {
      return (data as SubItem).startDate;
    }
  };

  const getEndDate = () => {
    if (type === 'initiative') {
      return (data as Initiative).endDate;
    } else if (type === 'item') {
      return (data as InitiativeItem).endDate;
    } else {
      return (data as SubItem).endDate;
    }
  };

  const getStatus = () => {
    return data.status;
  };

  const getPriority = () => {
    return data.priority;
  };

  const getDescription = () => {
    return data.description || '-';
  };

  const StatusIcon = STATUS_ICONS[getStatus()];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Detalhes completos do {type === 'initiative' ? 'iniciativa' : type === 'item' ? 'item' : 'subitem'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Título */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Título</h3>
            <p className="text-base font-medium">{data.title}</p>
          </div>

          {/* Informações principais em grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Responsável */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Responsável</h3>
              <p className="text-sm">{getResponsible()}</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Status</h3>
              <Badge 
                variant={getStatus() === 'Concluído' ? 'default' : getStatus() === 'Em Risco' || getStatus() === 'Atrasado' ? 'destructive' : 'secondary'} 
                className="capitalize flex items-center w-fit"
              >
                {StatusIcon && <StatusIcon className="mr-1.5 h-3.5 w-3.5" />}
                {getStatus()}
              </Badge>
            </div>

            {/* Data de Início */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Data de Início</h3>
              <p className="text-sm">{formatDate(getStartDate())}</p>
            </div>

            {/* Data de Fim */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Data de Fim</h3>
              <p className="text-sm">{formatDate(getEndDate())}</p>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Prioridade</h3>
              <Badge 
                variant="outline"
                className={cn(
                  "capitalize",
                  getPriority() === 'Alta' && "bg-red-100 text-red-700 border-red-300",
                  getPriority() === 'Média' && "bg-yellow-100 text-yellow-700 border-yellow-300",
                  getPriority() === 'Baixa' && "bg-blue-100 text-blue-700 border-blue-300"
                )}
              >
                {getPriority()}
              </Badge>
            </div>

            {/* Vinculado ao anterior (apenas para item e subitem) */}
            {(type === 'item' || type === 'subitem') && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Vinculado ao Anterior</h3>
                <p className="text-sm">
                  {(data as InitiativeItem | SubItem).linkedToPrevious ? 'Sim' : 'Não'}
                </p>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Observações</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{getDescription()}</p>
          </div>

          {/* Lista de filhos (itens ou subitens) */}
          {children && children.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {type === 'initiative' ? 'Itens' : 'Subitens'} ({children.length})
              </h3>
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                {children.map((child, index) => {
                  const ChildStatusIcon = STATUS_ICONS[child.status];
                  return (
                    <div key={child.id || index} className="flex items-start justify-between p-2 bg-background rounded border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{child.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Responsável: {type === 'item' ? (child as InitiativeItem).responsible || '-' : (child as SubItem).responsible}</span>
                          <span>•</span>
                          <span>{formatDate(child.startDate)} - {formatDate(child.endDate)}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={child.status === 'Concluído' ? 'default' : child.status === 'Em Risco' || child.status === 'Atrasado' ? 'destructive' : 'secondary'} 
                        className="capitalize flex items-center w-fit ml-2"
                      >
                        {ChildStatusIcon && <ChildStatusIcon className="mr-1 h-3 w-3" />}
                        {child.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

