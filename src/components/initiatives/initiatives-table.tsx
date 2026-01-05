
"use client";

import { STATUS_ICONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronDown, ChevronRight, Filter, CornerDownRight, ChevronsUpDown, Archive, Undo, DollarSign, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useState, useMemo } from "react";
import type { Initiative, InitiativePriority, InitiativeStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { useInitiatives } from "@/contexts/initiatives-context";

interface InitiativesTableProps {
    initiatives: Initiative[];
    onInitiativeClick: (initiative: Initiative) => void;
    onEditInitiative?: (initiative: Initiative) => void;
    // Props opcionais para permitir uso com M&As
    onUpdateSubItem?: (initiativeId: string, itemId: string, subItemId: string, completed: boolean) => void;
    onArchive?: (initiativeId: string) => void;
    onUnarchive?: (initiativeId: string) => void;
}

const sortInitiatives = (initiatives: Initiative[]) => {
    return initiatives.sort((a, b) => {
        const aParts = a.topicNumber.split('.').map(Number);
        const bParts = b.topicNumber.split('.').map(Number);
        const len = Math.max(aParts.length, bParts.length);
        for (let i = 0; i < len; i++) {
            const aVal = aParts[i] || 0;
            const bVal = bParts[i] || 0;
            if (aVal !== bVal) return aVal - bVal;
        }
        return 0;
    });
};

export function InitiativesTable({ 
  initiatives, 
  onInitiativeClick,
  onEditInitiative,
  onUpdateSubItem,
  onArchive,
  onUnarchive 
}: InitiativesTableProps) {
  // Usa funções do contexto como fallback se não forem passadas como props
  const initiativesContext = useInitiatives();
  
  const updateSubItem = onUpdateSubItem || initiativesContext.updateSubItem;
  const archiveInitiative = onArchive || initiativesContext.archiveInitiative;
  const unarchiveInitiative = onUnarchive || initiativesContext.unarchiveInitiative;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  
  const parentInitiativeIds = useMemo(() => 
    new Set(initiatives.filter(i => i.items && i.items.length > 0).map(i => i.id))
  , [initiatives]);

  const [expandedInitiatives, setExpandedInitiatives] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [areAllExpanded, setAreAllExpanded] = useState(false);

  const toggleAllTopics = () => {
    if (areAllExpanded) {
        setExpandedInitiatives(new Set());
        setExpandedItems(new Set());
    } else {
        setExpandedInitiatives(new Set(parentInitiativeIds));
        // Expandir todos os itens também
        const allItemIds = new Set<string>();
        initiatives.forEach(init => {
          if (init.items) {
            init.items.forEach(item => {
              if (item.subItems && item.subItems.length > 0) {
                allItemIds.add(item.id);
              }
            });
          }
        });
        setExpandedItems(allItemIds);
    }
    setAreAllExpanded(prev => !prev);
  };

  const toggleInitiative = (initiativeId: string) => {
    setExpandedInitiatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(initiativeId)) {
        newSet.delete(initiativeId);
      } else {
        newSet.add(initiativeId);
      }
      return newSet;
    });
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredInitiatives = useMemo(() => {
    const filtered = initiatives.filter(initiative => {
      const matchesSearch = initiative.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (initiative.owner && initiative.owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            initiative.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (initiative.items && initiative.items.some(p => 
                              p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.responsible && p.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
                            ));
      const matchesStatus = statusFilter === "all" || initiative.status === statusFilter;
      const matchesArchive = archiveFilter === 'all' || (archiveFilter === 'active' && !initiative.archived) || (archiveFilter === 'archived' && initiative.archived)
      return matchesSearch && matchesStatus && matchesArchive;
    });
    return sortInitiatives(filtered);
  }, [searchTerm, statusFilter, archiveFilter, initiatives]);
  
  const initiativeStatuses: (string | InitiativeStatus)[] = ["all", "Pendente", "Em execução", "Concluído", "Suspenso"];

  const hasAuc = useMemo(() => initiatives.some(i => i.auc !== undefined && i.auc !== null), [initiatives]);

  return (
    <Card className="shadow-sm">
      <div className="w-full overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
                <div className="flex items-center gap-2">
                    Tópico
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleAllTopics} disabled={parentInitiativeIds.size === 0}>
                        <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </TableHead>
            <TableHead className="w-[35%]">Título da Iniciativa</TableHead>
            { hasAuc && <TableHead>AUC</TableHead> }
                  <TableHead>Responsável</TableHead>
                  {onEditInitiative && <TableHead className="w-12"></TableHead>}
                  <TableHead>Status</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
          <TableRow className="bg-muted/30">
            <TableCell className="p-2"></TableCell>
            <TableCell className="p-2">
                 <Input 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
            </TableCell>
            { hasAuc && <TableCell className="p-2"></TableCell> }
            <TableCell className="p-2"></TableCell>
            <TableCell className="p-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8">
                    <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                    {initiativeStatuses.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">{status === "all" ? "Todos os Status" : status}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell className="p-2"></TableCell>
            <TableCell className="p-2">
                <Select value={archiveFilter} onValueChange={setArchiveFilter}>
                    <SelectTrigger className="h-8">
                    <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Ativas</SelectItem>
                        <SelectItem value="archived">Arquivadas</SelectItem>
                        <SelectItem value="all">Todas</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInitiatives.length > 0 ? (
            filteredInitiatives.map((initiative: Initiative) => {
              const StatusIcon = STATUS_ICONS[initiative.status];
              const hasItems = initiative.items && initiative.items.length > 0;
              const isInitiativeExpanded = expandedInitiatives.has(initiative.id);
              const isArchivable = initiative.status === 'Concluído' || initiative.status === 'Suspenso';

              return (
                <React.Fragment key={initiative.id}>
                <TableRow className={cn(initiative.archived && 'bg-muted/30 text-muted-foreground hover:bg-muted/50')}>
                  <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                       {initiative.topicNumber}
                      </div>
                  </TableCell>
                  <TableCell className="font-medium font-body">
                     <div className="flex items-center gap-1">
                        {hasItems && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 -ml-2" onClick={() => toggleInitiative(initiative.id)}>
                              {isInitiativeExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        )}
                        <span className={cn(hasItems && "cursor-pointer", "text-current")} onClick={() => hasItems && toggleInitiative(initiative.id)}>
                          {initiative.title}
                       </span>
                     </div>
                  </TableCell>
                  {hasAuc && (
                    <TableCell>
                      {initiative.auc ? (
                         <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground"/>
                            {initiative.auc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="font-body text-current">{initiative.owner || '-'}</TableCell>
                  {onEditInitiative && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditInitiative(initiative)}
                        title="Editar iniciativa"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={initiative.archived ? 'outline' : initiative.status === 'Concluído' ? 'default' : initiative.status === 'Em Risco' || initiative.status === 'Atrasado' ? 'destructive' : 'secondary'} className="capitalize flex items-center w-fit">
                      {StatusIcon && <StatusIcon className="mr-1.5 h-3.5 w-3.5" />}
                      {initiative.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={initiative.progress} className="w-24 h-2" aria-label={`Progresso de ${initiative.title}`} />
                      <span className="text-sm text-current">{initiative.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button variant="outline" size="sm" onClick={() => onInitiativeClick(initiative)}>
                         Ver Dossiê <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                     {isArchivable && !initiative.archived && (
                        <Button variant="outline" size="sm" onClick={() => archiveInitiative(initiative.id)}>
                          <Archive className="h-4 w-4" />
                        </Button>
                     )}
                     {initiative.archived && (
                        <Button variant="outline" size="sm" onClick={() => unarchiveInitiative(initiative.id)}>
                           <Undo className="h-4 w-4" />
                        </Button>
                     )}
                  </TableCell>
                </TableRow>
                 {/* Itens expandidos */}
                 {isInitiativeExpanded && hasItems && initiative.items.map(item => {
                   const isItemExpanded = expandedItems.has(item.id);
                   const hasSubItems = item.subItems && item.subItems.length > 0;
                   
                   return (
                     <React.Fragment key={item.id}>
                       <TableRow className="bg-secondary/50 hover:bg-secondary/70">
                         <TableCell></TableCell>
                         <TableCell colSpan={hasAuc ? 5 : 4} className="pl-12">
                           <div className="flex items-center gap-2">
                             <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                             {hasSubItems && (
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-5 w-5 -ml-1" 
                                 onClick={() => toggleItem(item.id)}
                               >
                                 {isItemExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                               </Button>
                             )}
                             <span className="text-sm font-medium">{item.title}</span>
                           </div>
                         </TableCell>
                         <TableCell></TableCell>
                       </TableRow>
                       
                       {/* Subitens expandidos */}
                       {isItemExpanded && hasSubItems && item.subItems.map(subItem => (
                         <TableRow key={subItem.id} className="bg-secondary hover:bg-secondary/80">
                           <TableCell></TableCell>
                           <TableCell colSpan={hasAuc ? 5 : 4} className="pl-20">
                             <div className="flex items-center gap-2">
                               <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                               <Checkbox 
                                 id={`subitem-${subItem.id}`} 
                                 checked={subItem.completed}
                                 onCheckedChange={(checked) => updateSubItem(initiative.id, item.id, subItem.id, !!checked)}
                               />
                               <label htmlFor={`subitem-${subItem.id}`} className={cn("text-sm", subItem.completed && "line-through text-muted-foreground")}>
                                 {subItem.title}
                               </label>
                             </div>
                           </TableCell>
                           <TableCell></TableCell>
                         </TableRow>
                       ))}
                     </React.Fragment>
                   );
                 })}
                </React.Fragment>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={hasAuc ? 7 : 6} className="text-center h-48">
                <p className="text-muted-foreground">Nenhuma iniciativa encontrada.</p>
                <p className="text-sm text-muted-foreground mt-1">Tente ajustar sua busca ou filtros.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </Card>
  );
}
