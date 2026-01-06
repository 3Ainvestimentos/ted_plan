"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { InitiativeStatus } from "@/types";
import type { AgendaItem } from "@/lib/agenda-helpers";
import { getHierarchyPath, formatDaysRemaining } from "@/lib/agenda-helpers";
import { getAvailableStatuses } from "@/lib/initiatives-helpers";

interface AgendaTableProps {
  items: AgendaItem[];
  onItemStatusChange?: (item: AgendaItem, newStatus: InitiativeStatus) => void;
  onSubItemStatusChange?: (item: AgendaItem, newStatus: InitiativeStatus) => void;
}

/**
 * Componente de tabela para exibir itens da agenda da semana vigente.
 * 
 * Colunas:
 * - Projeto / Item / Subitem: Hierarquia completa
 * - Responsável: Nome do responsável
 * - Prioridade: Badge colorido
 * - Status: Select editável
 * - Prazo: Data formatada
 * - Dias Restantes: Texto formatado com ícone se atrasado
 * - Risco: Campo de risco
 */
export function AgendaTable({ items, onItemStatusChange, onSubItemStatusChange }: AgendaTableProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-700';
      case 'Média':
        return 'bg-yellow-100 text-yellow-700';
      case 'Baixa':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleStatusChange = (item: AgendaItem, newStatus: InitiativeStatus) => {
    if (item.type === 'item' && onItemStatusChange) {
      onItemStatusChange(item, newStatus);
    } else if (item.type === 'subitem' && onSubItemStatusChange) {
      onSubItemStatusChange(item, newStatus);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma atividade encontrada para a semana vigente.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto / Item / Subitem</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Dias Restantes</TableHead>
            <TableHead>Risco</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const hierarchyPath = item.type === 'item'
              ? getHierarchyPath(item.initiativeTitle, item.title)
              : getHierarchyPath(item.initiativeTitle, item.itemTitle || '', item.title);
            
            const availableStatuses = getAvailableStatuses(item.isOverdue);
            const daysRemainingText = formatDaysRemaining(item.daysRemaining);

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {hierarchyPath}
                </TableCell>
                <TableCell>{item.responsible}</TableCell>
                <TableCell>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={item.status}
                    onValueChange={(value) => handleStatusChange(item, value as InitiativeStatus)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{formatDate(item.deadline)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.isOverdue && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={item.isOverdue ? 'text-red-500' : ''}>
                      {daysRemainingText}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{item.risk || '-'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


