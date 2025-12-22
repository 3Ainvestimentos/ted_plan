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
  Undo,
  Pencil
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
  onEditInitiative?: (initiative: Initiative) => void;
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
/**
 * Parse flexível de datas - aceita múltiplos formatos
 * 
 * Formatos suportados:
 * - Date object
 * - ISO string com timezone (YYYY-MM-DDTHH:mm:ssZ)
 * - ISO string sem timezone (YYYY-MM-DD) - formato padrão do sistema
 * - Formato BR (DD/MM/YYYY ou DD/MM)
 * - Firestore Timestamp
 */
function parseFlexibleDate(dateInput: any): Date | null {
  if (!dateInput) return null;
  
  // Se já é um Date object
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return dateInput;
  }
  
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    
    // ISO format com timezone (YYYY-MM-DDTHH:mm:ssZ)
    if (trimmed.includes('T') || trimmed.includes('Z')) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    
    // ISO format sem timezone (YYYY-MM-DD) - formato padrão do sistema
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parsed = new Date(trimmed + 'T00:00:00');
      if (!isNaN(parsed.getTime())) return parsed;
    }
    
    // BR format (DD/MM/YYYY ou DD/MM)
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/').map(p => parseInt(p.trim(), 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        // DD/MM - assume ano atual
        const day = parts[0];
        const month = parts[1] - 1;
        const year = new Date().getFullYear();
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) return parsed;
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        // DD/MM/YYYY
        const day = parts[0];
        const month = parts[1] - 1;
        const year = parts[2];
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
  }
  
  // Firestore Timestamp
  if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
    try {
      return dateInput.toDate();
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

/**
 * Extrai deadline de uma Initiative
 * 
 * Busca o prazo (deadline) da iniciativa, considerando:
 * 1. Deadline direto da iniciativa
 * 2. Deadlines das fases
 * 3. Deadlines dos subitens dentro das fases
 * 4. Fallback para estrutura antiga (subitens diretos)
 * 
 * Retorna o MAIOR deadline encontrado (prazo mais distante)
 */
function extractInitiativeDeadline(initiative: Initiative): Date | null {
  // 1. Tenta deadline direto da iniciativa
  const initiativeDeadline = parseFlexibleDate(initiative.deadline);
  if (initiativeDeadline) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Gantt] Iniciativa "${initiative.title}" tem deadline direto:`, initiativeDeadline);
    }
    return initiativeDeadline;
  }
  
  // 2. Busca deadlines nas fases e subitens
  if (initiative.phases && initiative.phases.length > 0) {
    const allDeadlines: Date[] = [];
    
    initiative.phases.forEach((phase, phaseIndex) => {
      const phaseDeadline = parseFlexibleDate(phase.deadline);
      if (phaseDeadline) {
        allDeadlines.push(phaseDeadline);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Gantt] Fase "${phase.title}" tem deadline:`, phaseDeadline);
        }
      }
      
      if (phase.subItems && phase.subItems.length > 0) {
        phase.subItems.forEach((subItem, subItemIndex) => {
          const subItemDeadline = parseFlexibleDate(subItem.deadline);
          if (subItemDeadline) {
            allDeadlines.push(subItemDeadline);
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Gantt] Subitem "${subItem.title}" tem deadline:`, subItemDeadline);
            }
          }
        });
      }
    });
    
    if (allDeadlines.length > 0) {
      const maxDeadline = allDeadlines.reduce((max, d) => d > max ? d : max, allDeadlines[0]);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Gantt] Iniciativa "${initiative.title}" - usando maior deadline das fases/subitens:`, maxDeadline);
      }
      return maxDeadline;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Gantt] Iniciativa "${initiative.title}" tem ${initiative.phases.length} fases mas nenhuma tem deadline`);
      }
    }
  }
  
  // 3. Fallback para estrutura antiga (compatibilidade)
  if (initiative.subItems && initiative.subItems.length > 0) {
    const subItemDeadlines = initiative.subItems
      .map(si => parseFlexibleDate(si.deadline))
      .filter((d): d is Date => d !== null);
    
    if (subItemDeadlines.length > 0) {
      const maxDeadline = subItemDeadlines.reduce((max, d) => d > max ? d : max, subItemDeadlines[0]);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Gantt] Iniciativa "${initiative.title}" - usando deadline de subitens antigos:`, maxDeadline);
      }
      return maxDeadline;
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Gantt] Iniciativa "${initiative.title}" não tem nenhum deadline definido`);
  }
  return null;
}

/**
 * Extrai startDate de uma Initiative
 * 
 * Lógica:
 * 1. Se tem startDate explícito, usa ele
 * 2. Se não, busca o menor deadline das fases/subitens como aproximação
 * 3. Se não encontrar, usa 30 dias antes do deadline final como fallback
 */
function extractInitiativeStartDate(initiative: Initiative, deadline: Date): Date {
  // 1. Tenta usar startDate explícito da iniciativa
  const initiativeStartDate = parseFlexibleDate(initiative.startDate);
  if (initiativeStartDate) return initiativeStartDate;
  
  // 2. Busca o menor deadline das fases e subitens como data de início aproximada
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
      // Retorna o menor deadline como data de início aproximada
      const minDeadline = allDeadlines.reduce((min, d) => d < min ? d : min, allDeadlines[0]);
      // Se o menor deadline for muito próximo do deadline final, usa 30 dias antes
      const daysDiff = Math.ceil((deadline.getTime() - minDeadline.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return subDays(deadline, 30);
      }
      return minDeadline;
    }
  }
  
  // 3. Fallback para estrutura antiga (compatibilidade)
  if (initiative.subItems && initiative.subItems.length > 0) {
    const subItemDeadlines = initiative.subItems
      .map(si => parseFlexibleDate(si.deadline))
      .filter((d): d is Date => d !== null);
    
    if (subItemDeadlines.length > 0) {
      const minDeadline = subItemDeadlines.reduce((min, d) => d < min ? d : min, subItemDeadlines[0]);
      const daysDiff = Math.ceil((deadline.getTime() - minDeadline.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return subDays(deadline, 30);
      }
      return minDeadline;
    }
  }
  
  // 4. Fallback final: 30 dias antes do deadline
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
  onEditInitiative,
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
    const fixedColumnsWidth = 64 + 32 + (onEditInitiative ? 48 : 0) + 36 + 20 + 24; // Tabela: #, Título, Responsável, Editar (opcional), Status, Progresso
    const estimatedAvailableWidth = typeof window !== 'undefined' ? window.innerWidth - 250 - 48 - fixedColumnsWidth : 800;
    const calculatedWidth = estimatedAvailableWidth / totalDays;
    // Largura mínima de 2px e máxima de 4px para melhor visualização
    const dynamicCellWidth = Math.max(2, Math.min(4, calculatedWidth));

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
    <div className="space-y-4">
      {/* Seção de Filtros - acima da tabela */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="w-[180px]">
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
          </div>
          <div className="w-[150px]">
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
          </div>
        </div>
      </Card>

      {/* Tabela com Gantt */}
      <Card className="shadow-sm">
        <div className="w-full overflow-x-auto overflow-y-visible">
          <Table className="min-w-full table-auto">
            <TableHeader>
              {/* Linha 1: Cabeçalhos principais */}
              <TableRow className="bg-muted/50">
                <TableHead className="w-16 sticky left-0 bg-muted/50 z-20">#</TableHead>
                <TableHead className="w-64 sticky left-16 bg-muted/50 z-20">Título da Iniciativa</TableHead>
                <TableHead className="w-32">Responsável</TableHead>
                {onEditInitiative && <TableHead className="w-12"></TableHead>}
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
                
                // Debug: log se não encontrou task (pode indicar falta de deadline)
                if (!ganttTask && process.env.NODE_ENV === 'development') {
                  console.log(`[Gantt Debug] Iniciativa "${initiative.title}" não tem GanttTask (sem deadline?)`, {
                    hasDeadline: !!initiative.deadline,
                    hasPhases: !!(initiative.phases && initiative.phases.length > 0),
                    phasesWithDeadline: initiative.phases?.filter(p => p.deadline).length || 0
                  });
                }

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
                      
                      {/* Coluna Editar */}
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
                      {(() => {
                        // Calcula posição da barra do Gantt (se houver tarefa)
                        let barStartIndex = -1;
                        let barEndIndex = -1;
                        let barColor = '';
                        
                        if (ganttTask) {
                          const taskStart = startOfDay(ganttTask.startDate);
                          const taskEnd = startOfDay(ganttTask.endDate);
                          
                          // Encontra o índice da primeira célula que corresponde ou é posterior à data de início
                          barStartIndex = dateHeaders.findIndex(day => {
                            const dayStart = startOfDay(day);
                            return dayStart.getTime() >= taskStart.getTime();
                          });
                          
                          // Encontra o índice da primeira célula que é posterior à data de fim
                          barEndIndex = dateHeaders.findIndex(day => {
                            const dayStart = startOfDay(day);
                            return dayStart.getTime() > taskEnd.getTime();
                          });
                          
                          // Se não encontrou uma célula posterior, usa a última célula
                          if (barEndIndex < 0) {
                            barEndIndex = dateHeaders.length;
                          }
                          // Ajusta para incluir a última célula do intervalo
                          barEndIndex = barEndIndex - 1;
                          
                          // Se não encontrou início, usa a primeira célula
                          if (barStartIndex < 0) {
                            barStartIndex = 0;
                          }
                          
                          // Garante que endIndex >= startIndex
                          if (barEndIndex < barStartIndex) {
                            barEndIndex = barStartIndex;
                          }
                          
                          barColor = ganttTask.isOverdue 
                            ? 'bg-red-500' 
                            : STATUS_COLORS[ganttTask.status] || 'bg-blue-500';
                        }
                        
                        return dateHeaders.map((day, dayIndex) => {
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          const isTodayMarker = isToday(day);
                          const isInBarRange = barStartIndex >= 0 && dayIndex >= barStartIndex && dayIndex <= barEndIndex;
                          const isBarStart = dayIndex === barStartIndex;
                          const isBarEnd = dayIndex === barEndIndex;
                          
                          return (
                            <TableCell 
                              key={dayIndex} 
                              className={cn(
                                "relative p-0 border-r border-border/50 overflow-visible",
                                isWeekend && "bg-muted/30",
                                isTodayMarker && "bg-red-100/50 dark:bg-red-900/20"
                              )}
                              style={{ 
                                width: `${cellWidth}px`, 
                                minWidth: `${cellWidth}px`, 
                                maxWidth: `${cellWidth}px`,
                                padding: 0,
                                overflow: 'visible',
                              }}
                            >
                              {/* Marcador de hoje */}
                              {isTodayMarker && (
                                <div className="absolute inset-y-0 left-0 w-0.5 bg-red-500 z-20" />
                              )}
                              
                              {/* Barra do Gantt - renderiza apenas na primeira célula do intervalo */}
                              {isBarStart && ganttTask && barStartIndex >= 0 && barEndIndex >= barStartIndex && (() => {
                                const span = barEndIndex - barStartIndex + 1;
                                const barWidth = Math.max(40, span * cellWidth);
                                
                                return (
                                  <div 
                                    className={cn(
                                      "absolute top-1/2 -translate-y-1/2 h-6 rounded-md opacity-90 z-10 shadow-sm border border-white/20",
                                      barColor
                                    )}
                                    style={{
                                      left: '0px',
                                      width: `${barWidth}px`,
                                      height: '24px',
                                      minWidth: '40px',
                                      pointerEvents: 'none',
                                    }}
                                    title={`${ganttTask.name}: ${format(ganttTask.startDate, 'dd/MM/yyyy')} - ${format(ganttTask.endDate, 'dd/MM/yyyy')}`}
                                  />
                                );
                              })()}
                            </TableCell>
                          );
                        });
                      })()}
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
    </div>
  );
}

