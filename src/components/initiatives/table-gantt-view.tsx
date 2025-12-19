"use client";

/**
 * ============================================
 * COMPONENTE: TableGanttView
 * ============================================
 * 
 * Este componente combina a visualização de Tabela e Gantt em uma única tela.
 * 
 * ARQUITETURA:
 * - Tabela à esquerda: Lista de iniciativas com filtros e busca
 * - Gantt à direita: Timeline de 6 meses com barras de progresso
 * - Layout responsivo sem scroll horizontal
 * 
 * REUTILIZA:
 * - Lógica de filtros e busca da InitiativesTable
 * - Lógica de cálculo de datas e transformação do InitiativeGanttView
 */

// ============================================
// SEÇÃO 1: IMPORTS
// ============================================

import React, { useState, useMemo } from 'react';
import type { Initiative, InitiativeStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { STATUS_ICONS } from '@/lib/constants';
import { 
  ChevronRight, 
  ChevronDown, 
  CornerDownRight,
  ExternalLink,
  Archive,
  Undo
} from 'lucide-react';
import { 
  startOfDay, 
  endOfDay, 
  eachDayOfInterval, 
  isWithinInterval, 
  getMonth, 
  format, 
  isToday, 
  isBefore,
  subDays,
  addMonths,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================
// SEÇÃO 2: INTERFACES E TIPOS
// ============================================

interface TableGanttViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (initiative: Initiative) => void;
  onUpdateSubItem?: (initiativeId: string, phaseId: string, subItemId: string, completed: boolean) => void;
  onArchive?: (initiativeId: string) => void;
  onUnarchive?: (initiativeId: string) => void;
  onStatusChange?: (initiativeId: string, newStatus: InitiativeStatus) => void;
}

interface GanttTask {
  id: string;
  name: string;
  responsible: string;
  status: InitiativeStatus;
  startDate: Date;
  endDate: Date;
  progress: number;
  isOverdue: boolean;
  originalInitiative: Initiative;
}

// ============================================
// SEÇÃO 3: CONSTANTES
// ============================================

const STATUS_COLORS: Record<InitiativeStatus, string> = {
  'Pendente': 'bg-yellow-500',
  'Em execução': 'bg-blue-500',
  'Concluído': 'bg-green-500',
  'Suspenso': 'bg-gray-400',
  'A Fazer': 'bg-slate-400',
  'Em Dia': 'bg-emerald-500',
  'Em Risco': 'bg-orange-500',
  'Atrasado': 'bg-red-500',
};

// ============================================
// SEÇÃO 4: FUNÇÕES HELPER
// ============================================

/**
 * Parse flexível de datas - aceita múltiplos formatos
 */
function parseFlexibleDate(dateInput: any): Date | null {
  if (!dateInput) return null;
  
  if (dateInput instanceof Date) return dateInput;
  
  if (typeof dateInput === 'string') {
    // ISO format
    if (dateInput.includes('T') || dateInput.includes('Z')) {
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    
    // BR format (DD/MM/YYYY ou DD/MM)
    if (dateInput.includes('/')) {
      const parts = dateInput.split('/');
      if (parts.length === 2) {
        // DD/MM - assume ano atual
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = new Date().getFullYear();
        return new Date(year, month, day);
      } else if (parts.length === 3) {
        // DD/MM/YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
  }
  
  // Firestore Timestamp
  if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
    return dateInput.toDate();
  }
  
  return null;
}

/**
 * Extrai deadline de uma Initiative
 */
function extractInitiativeDeadline(initiative: Initiative): Date | null {
  const initiativeDeadline = parseFlexibleDate(initiative.deadline);
  if (initiativeDeadline) return initiativeDeadline;
  
  // Considerar fases e subitens dentro das fases
  if (initiative.phases && initiative.phases.length > 0) {
    const allDeadlines: Date[] = [];
    
    initiative.phases.forEach(phase => {
      const phaseDeadline = parseFlexibleDate(phase.deadline);
      if (phaseDeadline) allDeadlines.push(phaseDeadline);
      
      if (phase.subItems && phase.subItems.length > 0) {
        phase.subItems.forEach(subItem => {
          const subItemDeadline = parseFlexibleDate(subItem.deadline);
          if (subItemDeadline) allDeadlines.push(subItemDeadline);
        });
      }
    });
    
    if (allDeadlines.length > 0) {
      return allDeadlines.reduce((max, d) => d > max ? d : max, allDeadlines[0]);
    }
  }
  
  // Fallback para estrutura antiga (compatibilidade)
  if (initiative.subItems && initiative.subItems.length > 0) {
    const subItemDeadlines = initiative.subItems
      .map(si => parseFlexibleDate(si.deadline))
      .filter((d): d is Date => d !== null);
    
    if (subItemDeadlines.length > 0) {
      return subItemDeadlines.reduce((max, d) => d > max ? d : max, subItemDeadlines[0]);
    }
  }
  
  return null;
}

/**
 * Extrai startDate de uma Initiative
 */
function extractInitiativeStartDate(initiative: Initiative, deadline: Date): Date {
  const initiativeStartDate = parseFlexibleDate(initiative.startDate);
  if (initiativeStartDate) return initiativeStartDate;
  
  // Considerar fases e subitens dentro das fases
  if (initiative.phases && initiative.phases.length > 0) {
    const allStartDates: Date[] = [];
    
    initiative.phases.forEach(phase => {
      const phaseDeadline = parseFlexibleDate(phase.deadline);
      if (phaseDeadline) allStartDates.push(phaseDeadline);
      
      if (phase.subItems && phase.subItems.length > 0) {
        phase.subItems.forEach(subItem => {
          const subItemDeadline = parseFlexibleDate(subItem.deadline);
          if (subItemDeadline) allStartDates.push(subItemDeadline);
        });
      }
    });
    
    if (allStartDates.length > 0) {
      return allStartDates.reduce((min, d) => d < min ? d : min, allStartDates[0]);
    }
  }
  
  // Fallback para estrutura antiga (compatibilidade)
  if (initiative.subItems && initiative.subItems.length > 0) {
    const subItemDeadlines = initiative.subItems
      .map(si => parseFlexibleDate(si.deadline))
      .filter((d): d is Date => d !== null);
    
    if (subItemDeadlines.length > 0) {
      return subItemDeadlines.reduce((min, d) => d < min ? d : min, subItemDeadlines[0]);
    }
  }
  
  return subDays(deadline, 30);
}

/**
 * Calcula o range de datas para o calendário Gantt (6 meses)
 */
function calculateDateRange(): { start: Date; end: Date } {
  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(addMonths(today, 5));
  
  return {
    start: startOfDay(startDate),
    end: endOfDay(endDate)
  };
}

/**
 * Gera cabeçalhos de meses para o Gantt
 */
function generateMonthHeaders(dateHeaders: Date[]): { name: string; colSpan: number }[] {
  const monthHeaders: { name: string; colSpan: number }[] = [];
  let currentMonth = -1;
  
  dateHeaders.forEach(date => {
    const month = getMonth(date);
    
    if (month !== currentMonth) {
      currentMonth = month;
      monthHeaders.push({ 
        name: format(date, 'MMM yyyy', { locale: ptBR }), 
        colSpan: 1 
      });
    } else {
      monthHeaders[monthHeaders.length - 1].colSpan++;
    }
  });
  
  return monthHeaders;
}

/**
 * Transforma Initiative em GanttTask
 */
function transformInitiativeToGanttTask(initiative: Initiative): GanttTask | null {
  const endDate = extractInitiativeDeadline(initiative);
  if (!endDate) return null;
  
  const startDate = extractInitiativeStartDate(initiative, endDate);
  const isOverdue = isBefore(endDate, startOfDay(new Date())) && 
                    initiative.status !== 'Concluído';

  return {
    id: initiative.id,
    name: initiative.title,
    responsible: initiative.owner || '-',
    status: initiative.status,
    startDate,
    endDate,
    progress: initiative.progress || 0,
    isOverdue,
    originalInitiative: initiative,
  };
}

/**
 * Ordena iniciativas por topicNumber
 */
function sortInitiatives(initiatives: Initiative[]): Initiative[] {
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
}

// ============================================
// SEÇÃO 5: COMPONENTE PRINCIPAL
// ============================================

export function TableGanttView({ 
  initiatives, 
  onInitiativeClick,
  onUpdateSubItem,
  onArchive,
  onUnarchive,
  onStatusChange
}: TableGanttViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  const [expandedInitiatives, setExpandedInitiatives] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Filtra iniciativas
  const filteredInitiatives = useMemo(() => {
    const filtered = initiatives.filter(initiative => {
      const matchesSearch = initiative.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (initiative.owner && initiative.owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            initiative.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (initiative.phases && initiative.phases.some(p => 
                              p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.responsible && p.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
                            ));
      const matchesStatus = statusFilter === "all" || initiative.status === statusFilter;
      const matchesArchive = archiveFilter === 'all' || (archiveFilter === 'active' && !initiative.archived) || (archiveFilter === 'archived' && initiative.archived);
      return matchesSearch && matchesStatus && matchesArchive;
    });
    return sortInitiatives(filtered);
  }, [searchTerm, statusFilter, archiveFilter, initiatives]);

  // Calcula dados do Gantt
  const { tasks, dateHeaders, monthHeaders, cellWidth } = useMemo(() => {
    if (!filteredInitiatives || filteredInitiatives.length === 0) {
      return { tasks: [], dateHeaders: [], monthHeaders: [], cellWidth: 0 };
    }

    const dateRange = calculateDateRange();
    const dateHeaders = eachDayOfInterval({ 
      start: dateRange.start, 
      end: dateRange.end 
    });

    const ganttTasks: GanttTask[] = [];
    filteredInitiatives.forEach(initiative => {
      const task = transformInitiativeToGanttTask(initiative);
      if (task) {
        ganttTasks.push(task);
      }
    });

    const monthHeaders = generateMonthHeaders(dateHeaders);

    // Calcula largura das células para evitar scroll horizontal
    const totalDays = dateHeaders.length;
    const fixedColumnsWidth = 64 + 32 + 36 + 20 + 24; // Tabela: #, Título, Responsável, Status, Progresso
    const estimatedAvailableWidth = typeof window !== 'undefined' ? window.innerWidth - 250 - 48 - fixedColumnsWidth : 800;
    const calculatedWidth = estimatedAvailableWidth / totalDays;
    const dynamicCellWidth = Math.max(1, Math.min(2.5, calculatedWidth));

    return { tasks: ganttTasks, dateHeaders, monthHeaders, cellWidth: dynamicCellWidth };
  }, [filteredInitiatives]);

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

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const initiativeStatuses: (string | InitiativeStatus)[] = ["all", "Pendente", "Em execução", "Concluído", "Suspenso"];

  return (
    <Card className="shadow-sm">
      <div className="w-full overflow-x-auto">
        <Table className="min-w-full table-auto">
          <TableHeader>
            {/* Linha 1: Cabeçalhos principais */}
            <TableRow className="bg-muted/50">
              <TableHead className="w-16 sticky left-0 bg-muted/50 z-20">#</TableHead>
              <TableHead className="w-64 sticky left-16 bg-muted/50 z-20">Título da Iniciativa</TableHead>
              <TableHead className="w-32">Responsável</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-20">Progresso</TableHead>
              
              {/* Cabeçalhos dos meses do Gantt */}
              {monthHeaders.map((month, index) => (
                <TableHead 
                  key={index} 
                  colSpan={month.colSpan} 
                  className="text-center text-[10px] font-semibold whitespace-nowrap border-b"
                  style={{ padding: '4px 1px' }}
                >
                  {month.name}
                </TableHead>
              ))}
            </TableRow>
            
            {/* Linha 2: Filtros */}
            <TableRow className="bg-muted/30">
              <TableCell className="p-2 sticky left-0 bg-muted/30 z-10"></TableCell>
              <TableCell className="p-2 sticky left-16 bg-muted/30 z-10">
                <Input 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell className="p-2"></TableCell>
              <TableCell className="p-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    {initiativeStatuses.map(status => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status === "all" ? "Todos os Status" : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
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
              
              {/* Espaço para o Gantt na linha de filtros */}
              <TableCell colSpan={dateHeaders.length} className="p-2"></TableCell>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {filteredInitiatives.length > 0 ? (
              filteredInitiatives.map((initiative: Initiative) => {
                const StatusIcon = STATUS_ICONS[initiative.status];
                const hasPhases = initiative.phases && initiative.phases.length > 0;
                const isInitiativeExpanded = expandedInitiatives.has(initiative.id);
                const isArchivable = initiative.status === 'Concluído' || initiative.status === 'Suspenso';
                
                // Busca task correspondente no Gantt
                const ganttTask = tasks.find(t => t.id === initiative.id);

                return (
                  <React.Fragment key={initiative.id}>
                    <TableRow className={cn(initiative.archived && 'bg-muted/30 text-muted-foreground hover:bg-muted/50')}>
                      {/* Coluna # */}
                      <TableCell className="font-medium sticky left-0 bg-background z-10">
                        {initiative.topicNumber}
                      </TableCell>
                      
                      {/* Coluna Título */}
                      <TableCell className="font-medium sticky left-16 bg-background z-10">
                        <div className="flex items-center gap-1">
                          {hasPhases && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 -ml-2" 
                              onClick={() => toggleInitiative(initiative.id)}
                            >
                              {isInitiativeExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          )}
                          <span 
                            className={cn(hasPhases && "cursor-pointer", "text-current")} 
                            onClick={() => hasPhases && toggleInitiative(initiative.id)}
                          >
                            {initiative.title}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Coluna Responsável */}
                      <TableCell className="text-sm">
                        {initiative.owner || '-'}
                      </TableCell>
                      
                      {/* Coluna Status */}
                      <TableCell>
                        {onStatusChange ? (
                          <Select 
                            value={initiative.status} 
                            onValueChange={(newStatus: InitiativeStatus) => 
                              onStatusChange(initiative.id, newStatus)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs px-2 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {initiativeStatuses.filter(s => s !== 'all').map(s => (
                                <SelectItem key={s} value={s as string}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge 
                            variant={initiative.archived ? 'outline' : initiative.status === 'Concluído' ? 'default' : initiative.status === 'Em Risco' || initiative.status === 'Atrasado' ? 'destructive' : 'secondary'} 
                            className="capitalize flex items-center w-fit"
                          >
                            {StatusIcon && <StatusIcon className="mr-1.5 h-3.5 w-3.5" />}
                            {initiative.status}
                          </Badge>
                        )}
                      </TableCell>
                      
                      {/* Coluna Progresso */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={initiative.progress} className="h-2 w-12" />
                          <span className="text-xs text-muted-foreground">
                            {initiative.progress}%
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Colunas do Gantt */}
                      {dateHeaders.map((day, dayIndex) => {
                        const isInRange = ganttTask && isWithinInterval(day, { 
                          start: ganttTask.startDate, 
                          end: ganttTask.endDate 
                        });
                        
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const isTodayMarker = isToday(day);

                        const barColor = isInRange 
                          ? (ganttTask.isOverdue ? 'bg-red-500' : STATUS_COLORS[ganttTask.status])
                          : '';

                        return (
                          <TableCell 
                            key={dayIndex} 
                            className={cn(
                              "relative p-0",
                              isWeekend && "bg-muted/30",
                              isTodayMarker && "bg-red-100/50 dark:bg-red-900/20"
                            )}
                            style={{ 
                              width: `${cellWidth}px`, 
                              minWidth: `${cellWidth}px`, 
                              maxWidth: `${cellWidth}px`,
                            }}
                          >
                            {isTodayMarker && (
                              <div className="absolute inset-y-0 left-0 w-0.5 bg-red-500 z-10" />
                            )}
                            
                            {isInRange && (
                              <div 
                                className={cn("h-4 w-full opacity-80", barColor)} 
                                title={`${ganttTask.name}: ${format(ganttTask.startDate, 'dd/MM')} - ${format(ganttTask.endDate, 'dd/MM')}`}
                              />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    
                    {/* Fases expandidas */}
                    {isInitiativeExpanded && hasPhases && initiative.phases.map(phase => {
                      const isPhaseExpanded = expandedPhases.has(phase.id);
                      const hasSubItems = phase.subItems && phase.subItems.length > 0;
                      
                      return (
                        <React.Fragment key={phase.id}>
                          <TableRow className="bg-secondary/50 hover:bg-secondary/70">
                            <TableCell className="sticky left-0 bg-secondary/50 z-10"></TableCell>
                            <TableCell colSpan={4} className="pl-12 sticky left-16 bg-secondary/50 z-10">
                              <div className="flex items-center gap-2">
                                <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                {hasSubItems && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 -ml-1" 
                                    onClick={() => togglePhase(phase.id)}
                                  >
                                    {isPhaseExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  </Button>
                                )}
                                <span className="text-sm font-medium">{phase.title}</span>
                              </div>
                            </TableCell>
                            <TableCell colSpan={dateHeaders.length}></TableCell>
                          </TableRow>
                          
                          {/* Subitens expandidos */}
                          {isPhaseExpanded && hasSubItems && phase.subItems.map(subItem => (
                            <TableRow key={subItem.id} className="bg-secondary hover:bg-secondary/80">
                              <TableCell className="sticky left-0 bg-secondary z-10"></TableCell>
                              <TableCell colSpan={4} className="pl-20 sticky left-16 bg-secondary z-10">
                                <div className="flex items-center gap-2">
                                  <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                  <Checkbox 
                                    id={`subitem-${subItem.id}`} 
                                    checked={subItem.completed}
                                    onCheckedChange={(checked) => onUpdateSubItem?.(initiative.id, phase.id, subItem.id, !!checked)}
                                  />
                                  <label 
                                    htmlFor={`subitem-${subItem.id}`} 
                                    className={cn("text-sm", subItem.completed && "line-through text-muted-foreground")}
                                  >
                                    {subItem.title}
                                  </label>
                                </div>
                              </TableCell>
                              <TableCell colSpan={dateHeaders.length}></TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5 + dateHeaders.length} className="text-center h-48">
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

