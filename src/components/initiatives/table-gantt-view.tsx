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

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Initiative, InitiativeStatus, InitiativeItem, SubItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { STATUS_ICONS } from '@/lib/constants';
import { isOverdue, getAvailableStatuses } from '@/lib/initiatives-helpers';
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
  onUpdateSubItem?: (initiativeId: string, itemId: string, subItemId: string, completed: boolean) => void;
  onArchive?: (initiativeId: string) => void;
  onUnarchive?: (initiativeId: string) => void;
  onStatusChange?: (initiativeId: string, newStatus: InitiativeStatus) => void;
  onItemStatusChange?: (initiativeId: string, itemId: string, newStatus: InitiativeStatus) => void;
  onSubItemStatusChange?: (initiativeId: string, itemId: string, subItemId: string, newStatus: InitiativeStatus) => void;
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
  // Campos opcionais para identificar tipo e hierarquia
  type?: 'initiative' | 'item' | 'subitem';
  itemId?: string; // ID do item, se for subitem
  initiativeId?: string; // ID da iniciativa, se for item ou subitem
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

/**
 * Cores das barras do Gantt por hierarquia (independente do status)
 * - Iniciativa: verde escuro
 * - Item: verde médio
 * - Subitem: verde claro
 */
const HIERARCHY_COLORS = {
  initiative: 'bg-green-900',      // Verde escuro
  item: 'bg-green-600',           // Verde médio
  subitem: 'bg-green-300'          // Verde claro
};

/**
 * Cores da barra de progresso por status
 * - Concluído: verde
 * - Em execução: azul
 * - Pendente: amarelo
 * - Suspenso: cinza
 */
const PROGRESS_COLORS: Record<InitiativeStatus, string> = {
  'Concluído': 'bg-green-500',
  'Em execução': 'bg-blue-500',
  'Pendente': 'bg-yellow-500',
  'Suspenso': 'bg-gray-400',
  'A Fazer': 'bg-slate-400',
  'Em Dia': 'bg-emerald-500',
  'Em Risco': 'bg-orange-500',
  'Atrasado': 'bg-red-500',
};

/**
 * Componente Progress com cor customizada no indicador
 * 
 * @param value - Valor do progresso (0-100)
 * @param className - Classes CSS adicionais
 * @param indicatorColor - Cor do indicador (classe Tailwind)
 */
const ProgressWithColor = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorColor?: string;
  }
>(({ className, value, indicatorColor = 'bg-primary', ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 transition-all", indicatorColor)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
ProgressWithColor.displayName = "ProgressWithColor";

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
 * Extrai endDate de uma Initiative
 * 
 * Busca o prazo (endDate) da iniciativa, considerando:
 * 1. EndDate direto da iniciativa
 * 2. EndDates das items
 * 3. EndDates dos subitens dentro das items
 * 4. Fallback para estrutura antiga (subitens diretos)
 * 
 * Retorna o MAIOR endDate encontrado (prazo mais distante)
 */
function extractInitiativeDeadline(initiative: Initiative): Date | null {
  // 1. Tenta endDate direto da iniciativa
  const initiativeEndDate = parseFlexibleDate(initiative.endDate);
  if (initiativeEndDate) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Gantt] Iniciativa "${initiative.title}" tem endDate direto:`, initiativeEndDate);
    }
    return initiativeEndDate;
  }
  
  // 2. Busca endDates nas items e subitens
  if (initiative.items && initiative.items.length > 0) {
    const allEndDates: Date[] = [];
    
    initiative.items.forEach((item, itemIndex) => {
      const itemEndDate = parseFlexibleDate(item.endDate);
      if (itemEndDate) {
        allEndDates.push(itemEndDate);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Gantt] Item "${item.title}" tem endDate:`, itemEndDate);
        }
      }
      
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach((subItem, subItemIndex) => {
          const subItemEndDate = parseFlexibleDate(subItem.endDate);
          if (subItemEndDate) {
            allEndDates.push(subItemEndDate);
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Gantt] Subitem "${subItem.title}" tem endDate:`, subItemEndDate);
            }
          }
        });
      }
    });
    
    if (allEndDates.length > 0) {
      const maxEndDate = allEndDates.reduce((max, d) => d > max ? d : max, allEndDates[0]);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Gantt] Iniciativa "${initiative.title}" - usando maior endDate das items/subitens:`, maxEndDate);
      }
      return maxEndDate;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Gantt] Iniciativa "${initiative.title}" tem ${initiative.items.length} items mas nenhuma tem endDate`);
      }
    }
  }
  
  // 3. Fallback para estrutura antiga (compatibilidade)
  if (initiative.subItems && initiative.subItems.length > 0) {
    const subItemEndDates = initiative.subItems
      .map(si => parseFlexibleDate(si.endDate))
      .filter((d): d is Date => d !== null);
    
    if (subItemEndDates.length > 0) {
      const maxEndDate = subItemEndDates.reduce((max, d) => d > max ? d : max, subItemEndDates[0]);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Gantt] Iniciativa "${initiative.title}" - usando endDate de subitens antigos:`, maxEndDate);
      }
      return maxEndDate;
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Gantt] Iniciativa "${initiative.title}" não tem nenhum endDate definido`);
  }
  return null;
}

/**
 * Extrai startDate de uma Initiative
 * 
 * Lógica:
 * 1. Se tem startDate explícito, usa ele
 * 2. Se não, busca o menor endDate das items/subitens como aproximação
 * 3. Se não encontrar, usa 30 dias antes do endDate final como fallback
 */
function extractInitiativeStartDate(initiative: Initiative, endDate: Date): Date {
  // 1. Tenta usar startDate explícito da iniciativa
  const initiativeStartDate = parseFlexibleDate(initiative.startDate);
  if (initiativeStartDate) return initiativeStartDate;
  
  // 2. Busca o menor endDate das items e subitens como data de início aproximada
  if (initiative.items && initiative.items.length > 0) {
    const allEndDates: Date[] = [];
    
    initiative.items.forEach(item => {
      // Prioriza startDate do item, depois endDate
      const itemStartDate = parseFlexibleDate(item.startDate);
      if (itemStartDate) {
        allEndDates.push(itemStartDate);
      } else {
        const itemEndDate = parseFlexibleDate(item.endDate);
        if (itemEndDate) allEndDates.push(itemEndDate);
      }
      
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach(subItem => {
          // Prioriza startDate do subitem, depois endDate
          const subItemStartDate = parseFlexibleDate(subItem.startDate);
          if (subItemStartDate) {
            allEndDates.push(subItemStartDate);
          } else {
            const subItemEndDate = parseFlexibleDate(subItem.endDate);
            if (subItemEndDate) allEndDates.push(subItemEndDate);
          }
        });
      }
    });
    
    if (allEndDates.length > 0) {
      // Retorna o menor endDate como data de início aproximada
      const minEndDate = allEndDates.reduce((min, d) => d < min ? d : min, allEndDates[0]);
      // Se o menor endDate for muito próximo do endDate final, usa 30 dias antes
      const daysDiff = Math.ceil((endDate.getTime() - minEndDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return subDays(endDate, 30);
      }
      return minEndDate;
    }
  }
  
  // 3. Fallback para estrutura antiga (compatibilidade)
  if (initiative.subItems && initiative.subItems.length > 0) {
    const subItemEndDates = initiative.subItems
      .map(si => parseFlexibleDate(si.endDate))
      .filter((d): d is Date => d !== null);
    
    if (subItemEndDates.length > 0) {
      const minEndDate = subItemEndDates.reduce((min, d) => d < min ? d : min, subItemEndDates[0]);
      const daysDiff = Math.ceil((endDate.getTime() - minEndDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return subDays(endDate, 30);
      }
      return minEndDate;
    }
  }
  
  // 4. Fallback final: 30 dias antes do endDate
  return subDays(endDate, 30);
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
 * Transforma uma Initiative em GanttTask para renderização no Gantt.
 * 
 * @param initiative - Iniciativa para transformar
 * @returns GanttTask ou null se não tiver endDate válido
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
    type: 'initiative',
  };
}

/**
 * Transforma uma Item em GanttTask para renderização no Gantt.
 * 
 * Extrai endDate, startDate, status, responsible da item.
 * Se a item não tiver endDate, retorna null.
 * 
 * @param item - Item para transformar
 * @param initiative - Iniciativa pai (para referência)
 * @returns GanttTask ou null se não tiver endDate válido
 */
function transformItemToGanttTask(item: InitiativeItem, initiative: Initiative): GanttTask | null {
  const endDate = parseFlexibleDate(item.endDate);
  if (!endDate) return null;
  
  // Para item, startDate pode ser o endDate da iniciativa ou usar startDate do item ou 30 dias antes do endDate da item
  const initiativeEndDate = parseFlexibleDate(initiative.endDate);
  const itemStartDate = parseFlexibleDate(item.startDate);
  const startDate = itemStartDate || (initiativeEndDate 
    ? (isBefore(initiativeEndDate, endDate) ? initiativeEndDate : subDays(endDate, 30))
    : subDays(endDate, 30));
  
  const isOverdue = isBefore(endDate, startOfDay(new Date())) && 
                    item.status !== 'Concluído';

  // Progresso da item baseado nos subitens concluídos
  const progress = item.subItems && item.subItems.length > 0
    ? Math.round((item.subItems.filter(si => si.status === 'Concluído').length / item.subItems.length) * 100)
    : (item.status === 'Concluído' ? 100 : 0);

  return {
    id: item.id,
    name: item.title,
    responsible: item.responsible || '-',
    status: item.status,
    startDate,
    endDate,
    progress,
    isOverdue,
    originalInitiative: initiative,
    type: 'item',
    initiativeId: initiative.id,
  };
}

/**
 * Transforma um SubItem em GanttTask para renderização no Gantt.
 * 
 * Extrai endDate, startDate, status, responsible do subitem.
 * Se o subitem não tiver endDate, retorna null.
 * 
 * @param subItem - Subitem para transformar
 * @param item - Item pai (para referência)
 * @param initiative - Iniciativa pai (para referência)
 * @returns GanttTask ou null se não tiver endDate válido
 */
function transformSubItemToGanttTask(subItem: SubItem, item: InitiativeItem, initiative: Initiative): GanttTask | null {
  const endDate = parseFlexibleDate(subItem.endDate);
  if (!endDate) return null;
  
  // Para subitem, startDate pode ser o endDate da item ou usar startDate do subitem ou 7 dias antes do endDate do subitem
  const itemEndDate = parseFlexibleDate(item.endDate);
  const subItemStartDate = parseFlexibleDate(subItem.startDate);
  const startDate = subItemStartDate || (itemEndDate 
    ? (isBefore(itemEndDate, endDate) ? itemEndDate : subDays(endDate, 7))
    : subDays(endDate, 7));
  
  const isOverdue = isBefore(endDate, startOfDay(new Date())) && 
                    subItem.status !== 'Concluído';

  return {
    id: subItem.id,
    name: subItem.title,
    responsible: subItem.responsible || '-',
    status: subItem.status,
    startDate,
    endDate,
    progress: subItem.completed ? 100 : 0,
    isOverdue,
    originalInitiative: initiative,
    type: 'subitem',
    itemId: item.id,
    initiativeId: initiative.id,
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
  onStatusChange,
  onItemStatusChange,
  onSubItemStatusChange
}: TableGanttViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  const [expandedInitiatives, setExpandedInitiatives] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // Estado para mensagens de erro temporárias (desaparecem após 10 segundos)
  const [tempErrorMessages, setTempErrorMessages] = useState<Set<string>>(new Set());

  // Filtra iniciativas
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
    const fixedColumnsWidth = 64 + 32 + (onEditInitiative ? 48 : 0) + 36 + 24 + 20 + 24; // Tabela: #, Título, Responsável, Editar (opcional), Status, Prioridade, Progresso
    const estimatedAvailableWidth = typeof window !== 'undefined' ? window.innerWidth - 250 - 48 - fixedColumnsWidth : 800;
    const calculatedWidth = estimatedAvailableWidth / totalDays;
    // Largura mínima de 2px e máxima de 4px para melhor visualização
    const dynamicCellWidth = Math.max(2, Math.min(4, calculatedWidth));

    return { tasks: ganttTasks, dateHeaders, monthHeaders, cellWidth: dynamicCellWidth };
  }, [filteredInitiatives]);

  // Função para adicionar mensagem de erro temporária (desaparece após 10 segundos)
  const addTempErrorMessage = useCallback((key: string) => {
    setTempErrorMessages(prev => new Set(prev).add(key));
    // Remover após 10 segundos
    setTimeout(() => {
      setTempErrorMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 10000);
  }, []);

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
        <TooltipProvider>
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
                <TableHead className="w-24">Prioridade</TableHead>
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
                const hasItems = initiative.items && initiative.items.length > 0;
                const isInitiativeExpanded = expandedInitiatives.has(initiative.id);
                const isArchivable = initiative.status === 'Concluído' || initiative.status === 'Suspenso';
                
                // Busca task correspondente no Gantt
                const ganttTask = tasks.find(t => t.id === initiative.id);
                
                // Debug: log se não encontrou task (pode indicar falta de endDate)
                if (!ganttTask && process.env.NODE_ENV === 'development') {
                  console.log(`[Gantt Debug] Iniciativa "${initiative.title}" não tem GanttTask (sem endDate?)`, {
                    hasEndDate: !!initiative.endDate,
                    hasItems: !!(initiative.items && initiative.items.length > 0),
                    itemsWithEndDate: initiative.items?.filter(p => p.endDate).length || 0
                  });
                }

                // Verificar se está em atraso
                const initiativeIsOverdue = isOverdue(initiative.endDate, initiative.status);
                
                return (
                  <React.Fragment key={initiative.id}>
                    <TableRow className={cn(
                      initiative.archived && 'bg-muted/30 text-muted-foreground hover:bg-muted/50',
                      !initiative.archived && initiativeIsOverdue && 'bg-red-50 hover:bg-red-100'
                    )}>
                      {/* Coluna # */}
                      <TableCell className="font-medium sticky left-0 bg-background z-10">
                        {initiative.topicNumber}
                      </TableCell>
                      
                      {/* Coluna Título */}
                      <TableCell className="font-medium sticky left-16 bg-background z-10">
                        <div className="flex items-center gap-1">
                          {hasItems && (
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
                            className={cn(hasItems && "cursor-pointer", "text-current")} 
                            onClick={() => hasItems && toggleInitiative(initiative.id)}
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
                          <div className="space-y-1">
                            <Select 
                              value={initiative.status} 
                              onValueChange={(newStatus: InitiativeStatus) => {
                                // Verificar se está tentando concluir sem todas as items concluídas
                                const allItemsCompleted = initiative.items && initiative.items.length > 0
                                  ? initiative.items.every(item => item.status === 'Concluído')
                                  : true;
                                
                                if (newStatus === 'Concluído' && !allItemsCompleted && initiative.items && initiative.items.length > 0) {
                                  // Adicionar mensagem de erro temporária
                                  addTempErrorMessage(`initiative-${initiative.id}`);
                                }
                                
                                onStatusChange(initiative.id, newStatus);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs px-2 w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  // Verificar se todas as items estão concluídas
                                  // IMPORTANTE: Considerar apenas items com status definido e igual a 'Concluído'
                                  // Items sem status ou com status vazio são consideradas não concluídas
                                  const allItemsCompleted = initiative.items && initiative.items.length > 0
                                    ? initiative.items.every(item => item.status === 'Concluído')
                                    : true; // Se não tem items, pode concluir
                                  
                                  // Se está atrasado, limitar opções para apenas Atrasado ou Concluído
                                  let availableStatuses = initiativeIsOverdue 
                                    ? getAvailableStatuses(true)
                                    : initiativeStatuses.filter(s => s !== 'all') as InitiativeStatus[];
                                  
                                  // SEMPRE remover "Concluído" se nem todas as items estão concluídas (mesmo se estiver em atraso)
                                  if (!allItemsCompleted && initiative.items && initiative.items.length > 0) {
                                    availableStatuses = availableStatuses.filter(s => s !== 'Concluído') as InitiativeStatus[];
                                    // Se estava em atraso e removemos "Concluído", só sobra "Atrasado"
                                    if (availableStatuses.length === 0) {
                                      availableStatuses = ['Atrasado'] as InitiativeStatus[];
                                    }
                                  }
                                  
                                  return availableStatuses.map(s => (
                                    <SelectItem key={s} value={s as string}>{s}</SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                            {(() => {
                              const allItemsCompleted = initiative.items && initiative.items.length > 0
                                ? initiative.items.every(item => item.status === 'Concluído')
                                : false;
                              
                              if (initiativeIsOverdue) {
                                return (
                                  <p className="text-xs text-muted-foreground">
                                    Apenas Atrasado ou Concluído
                                  </p>
                                );
                              }
                              
                              // Mostrar mensagem de erro apenas se estiver no conjunto de mensagens temporárias
                              if (!allItemsCompleted && initiative.items && initiative.items.length > 0 && tempErrorMessages.has(`initiative-${initiative.id}`)) {
                                return (
                                  <p className="text-xs text-destructive">
                                    Não é possível concluir: todas as items devem estar concluídas
                                  </p>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
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
                      
                      {/* Coluna Prioridade */}
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "capitalize",
                            initiative.priority === 'Alta' && "bg-red-100 text-red-700 border-red-300",
                            initiative.priority === 'Média' && "bg-yellow-100 text-yellow-700 border-yellow-300",
                            initiative.priority === 'Baixa' && "bg-blue-100 text-blue-700 border-blue-300"
                          )}
                        >
                          {initiative.priority}
                        </Badge>
                      </TableCell>
                      
                      {/* Coluna Progresso */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ProgressWithColor 
                            value={initiative.progress} 
                            className="h-2 w-12" 
                            indicatorColor={PROGRESS_COLORS[initiative.status]}
                          />
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
                          
                          // Usar cor por hierarquia (verde escuro para iniciativas)
                          barColor = HIERARCHY_COLORS.initiative;
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
                                "relative p-0 overflow-visible",
                                isWeekend && "bg-muted/30 border-r border-border/50",
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
                                <div className="absolute inset-y-0 left-0 w-px bg-red-500 z-20" />
                              )}
                              
                              {/* Barra do Gantt - renderiza apenas na primeira célula do intervalo */}
                              {isBarStart && ganttTask && barStartIndex >= 0 && barEndIndex >= barStartIndex && (() => {
                                const span = barEndIndex - barStartIndex + 1;
                                const barWidth = Math.max(40, span * cellWidth);
                                
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div 
                                        className={cn(
                                          "absolute top-1/2 -translate-y-1/2 h-6 opacity-90 z-10 shadow-sm border border-white/20 cursor-pointer",
                                          barColor
                                        )}
                                        style={{
                                          left: '0px',
                                          width: `${barWidth}px`,
                                          height: '24px',
                                          minWidth: '40px',
                                          pointerEvents: 'auto',
                                        }}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Início: {format(ganttTask.startDate, 'dd/MM/yyyy')}</p>
                                      <p className="text-xs">Fim: {format(ganttTask.endDate, 'dd/MM/yyyy')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })()}
                            </TableCell>
                          );
                        });
                      })()}
                    </TableRow>
                    
                    {/* Items expandidas */}
                    {isInitiativeExpanded && hasItems && initiative.items.map(item => {
                      const isItemExpanded = expandedItems.has(item.id);
                      const hasSubItems = item.subItems && item.subItems.length > 0;
                      const itemGanttTask = transformItemToGanttTask(item, initiative);
                      const itemIsOverdue = itemGanttTask ? itemGanttTask.isOverdue : false;
                      const ItemStatusIcon = STATUS_ICONS[item.status];
                      
                      return (
                        <React.Fragment key={item.id}>
                          <TableRow className={cn("bg-secondary/50 hover:bg-secondary/70", itemIsOverdue && "bg-red-50")}>
                            <TableCell className="sticky left-0 bg-secondary/50 z-10"></TableCell>
                            <TableCell className="pl-12 sticky left-16 bg-secondary/50 z-10">
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
                            
                            {/* Coluna Responsável */}
                            <TableCell className="text-sm bg-secondary/50">
                              {item.responsible || '-'}
                            </TableCell>
                            
                            {/* Coluna Editar - vazia para items */}
                            {onEditInitiative && (
                              <TableCell className="bg-secondary/50"></TableCell>
                            )}
                            
                            {/* Coluna Status */}
                            <TableCell className="bg-secondary/50">
                              {onItemStatusChange ? (
                                <div className="space-y-1">
                                  <Select 
                                    value={item.status} 
                                    onValueChange={(newStatus: InitiativeStatus) => {
                                      // Verificar se está tentando concluir sem todos os subitens concluídos
                                      const itemSubItems = item.subItems || [];
                                      const allSubItemsCompleted = itemSubItems.length > 0 
                                        ? itemSubItems.every((si: SubItem) => si.status === 'Concluído')
                                        : true;
                                      
                                      if (newStatus === 'Concluído' && !allSubItemsCompleted && itemSubItems.length > 0) {
                                        // Adicionar mensagem de erro temporária
                                        addTempErrorMessage(`item-${item.id}`);
                                      }
                                      
                                      onItemStatusChange(initiative.id, item.id, newStatus);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs px-2 w-[120px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(() => {
                                        // Verificar se todos os subitens estão concluídos
                                        const itemSubItems = item.subItems || [];
                                        const allSubItemsCompleted = itemSubItems.length > 0 
                                          ? itemSubItems.every((si: SubItem) => si.status === 'Concluído')
                                          : true; // Se não tem subitens, pode concluir
                                        
                                        // Se está atrasado, limitar opções para apenas Atrasado ou Concluído
                                        const itemEndDate = parseFlexibleDate(item.endDate);
                                        const itemIsOverdue = itemEndDate ? isOverdue(itemEndDate, item.status) : false;
                                        let availableStatuses = itemIsOverdue 
                                          ? getAvailableStatuses(true)
                                          : initiativeStatuses.filter(s => s !== 'all') as InitiativeStatus[];
                                        
                                        // SEMPRE remover "Concluído" se nem todos os subitens estão concluídos (mesmo se estiver em atraso)
                                        if (!allSubItemsCompleted && itemSubItems.length > 0) {
                                          availableStatuses = availableStatuses.filter(s => s !== 'Concluído') as InitiativeStatus[];
                                          // Se estava em atraso e removemos "Concluído", só sobra "Atrasado"
                                          if (availableStatuses.length === 0) {
                                            availableStatuses = ['Atrasado'] as InitiativeStatus[];
                                          }
                                        }
                                        
                                        return availableStatuses.map(s => (
                                          <SelectItem key={s} value={s as string}>{s}</SelectItem>
                                        ));
                                      })()}
                                    </SelectContent>
                                  </Select>
                                  {(() => {
                                    const itemEndDate = parseFlexibleDate(item.endDate);
                                    const itemIsOverdue = itemEndDate ? isOverdue(itemEndDate, item.status) : false;
                                    const itemSubItems = item.subItems || [];
                                    const allSubItemsCompleted = itemSubItems.length > 0 
                                      ? itemSubItems.every((si: SubItem) => si.status === 'Concluído')
                                      : true;
                                    
                                    if (itemIsOverdue) {
                                      return (
                                        <p className="text-xs text-muted-foreground">
                                          Apenas Atrasado ou Concluído
                                        </p>
                                      );
                                    }
                                    
                                    // Mostrar mensagem de erro apenas se estiver no conjunto de mensagens temporárias
                                    if (!allSubItemsCompleted && itemSubItems.length > 0 && tempErrorMessages.has(`item-${item.id}`)) {
                                      return (
                                        <p className="text-xs text-destructive">
                                          Não é possível concluir: todos os subitens devem estar concluídos
                                        </p>
                                      );
                                    }
                                    
                                    return null;
                                  })()}
                                </div>
                              ) : (
                                <Badge 
                                  variant={item.status === 'Concluído' ? 'default' : item.status === 'Em Risco' || item.status === 'Atrasado' ? 'destructive' : 'secondary'} 
                                  className="capitalize flex items-center w-fit"
                                >
                                  {ItemStatusIcon && <ItemStatusIcon className="mr-1.5 h-3.5 w-3.5" />}
                                  {item.status}
                                </Badge>
                              )}
                            </TableCell>
                            
                            {/* Coluna Prioridade */}
                            <TableCell className="bg-secondary/50">
                              <Badge 
                                variant="outline"
                                className={cn(
                                  "capitalize",
                                  item.priority === 'Alta' && "bg-red-100 text-red-700 border-red-300",
                                  item.priority === 'Média' && "bg-yellow-100 text-yellow-700 border-yellow-300",
                                  item.priority === 'Baixa' && "bg-blue-100 text-blue-700 border-blue-300"
                                )}
                              >
                                {item.priority}
                              </Badge>
                            </TableCell>
                            
                            {/* Coluna Progresso */}
                            <TableCell className="bg-secondary/50">
                              <div className="flex items-center gap-2">
                                <ProgressWithColor 
                                  value={itemGanttTask?.progress || 0} 
                                  className="h-2 w-12" 
                                  indicatorColor={PROGRESS_COLORS[item.status]}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {itemGanttTask?.progress || 0}%
                                </span>
                              </div>
                            </TableCell>
                            
                            {/* Colunas do Gantt para Item */}
                            {(() => {
                              if (!itemGanttTask) {
                                return dateHeaders.map((day, dayIndex) => {
                                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                  return (
                                    <TableCell 
                                      key={dayIndex} 
                                      className={cn(
                                        "relative p-0",
                                        isWeekend && "bg-muted/30 border-r border-border/50",
                                        isToday(day) && "bg-red-100/50 dark:bg-red-900/20"
                                      )}
                                      style={{ 
                                        width: `${cellWidth}px`, 
                                        minWidth: `${cellWidth}px`, 
                                        maxWidth: `${cellWidth}px`,
                                        padding: 0,
                                      }}
                                    />
                                  );
                                });
                              }
                              
                              const taskStart = startOfDay(itemGanttTask.startDate);
                              const taskEnd = startOfDay(itemGanttTask.endDate);
                              
                              let barStartIndex = dateHeaders.findIndex(day => {
                                const dayStart = startOfDay(day);
                                return dayStart.getTime() >= taskStart.getTime();
                              });
                              
                              let barEndIndex = dateHeaders.findIndex(day => {
                                const dayStart = startOfDay(day);
                                return dayStart.getTime() > taskEnd.getTime();
                              });
                              
                              if (barEndIndex < 0) {
                                barEndIndex = dateHeaders.length;
                              }
                              barEndIndex = barEndIndex - 1;
                              
                              if (barStartIndex < 0) {
                                barStartIndex = 0;
                              }
                              
                              if (barEndIndex < barStartIndex) {
                                barEndIndex = barStartIndex;
                              }
                              
                              // Usar cor por hierarquia (verde médio para items)
                              const barColor = HIERARCHY_COLORS.item;
                              
                              return dateHeaders.map((day, dayIndex) => {
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                const isTodayMarker = isToday(day);
                                const isInBarRange = barStartIndex >= 0 && dayIndex >= barStartIndex && dayIndex <= barEndIndex;
                                const isBarStart = dayIndex === barStartIndex;
                                
                                return (
                                  <TableCell 
                                    key={dayIndex} 
                                    className={cn(
                                      "relative p-0 overflow-visible bg-secondary/50",
                                      isWeekend && "bg-muted/30 border-r border-border/50",
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
                                    {isTodayMarker && (
                                      <div className="absolute inset-y-0 left-0 w-px bg-red-500 z-20" />
                                    )}
                                    
                                    {isBarStart && itemGanttTask && barStartIndex >= 0 && barEndIndex >= barStartIndex && (() => {
                                      const span = barEndIndex - barStartIndex + 1;
                                      const barWidth = Math.max(40, span * cellWidth);
                                      
                                      return (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div 
                                              className={cn(
                                                "absolute top-1/2 -translate-y-1/2 h-5 opacity-90 z-10 shadow-sm border border-white/20 cursor-pointer",
                                                barColor
                                              )}
                                              style={{
                                                left: '0px',
                                                width: `${barWidth}px`,
                                                height: '20px',
                                                minWidth: '40px',
                                                pointerEvents: 'auto',
                                              }}
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">Início: {format(itemGanttTask.startDate, 'dd/MM/yyyy')}</p>
                                            <p className="text-xs">Fim: {format(itemGanttTask.endDate, 'dd/MM/yyyy')}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })()}
                                  </TableCell>
                                );
                              });
                            })()}
                          </TableRow>
                          
                          {/* Subitens expandidos */}
                          {isItemExpanded && hasSubItems && item.subItems && item.subItems.map(subItem => {
                            const subItemGanttTask = transformSubItemToGanttTask(subItem, item, initiative);
                            const subItemIsOverdue = subItemGanttTask ? subItemGanttTask.isOverdue : false;
                            const SubItemStatusIcon = STATUS_ICONS[subItem.status];
                            
                            return (
                              <TableRow key={subItem.id} className={cn("bg-secondary hover:bg-secondary/80", subItemIsOverdue && "bg-red-50")}>
                                <TableCell className="sticky left-0 bg-secondary z-10"></TableCell>
                                <TableCell className="pl-20 sticky left-16 bg-secondary z-10">
                                  <div className="flex items-center gap-2">
                                    <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                    <Checkbox 
                                      id={`subitem-${subItem.id}`} 
                                      checked={subItem.status === 'Concluído'}
                                      onCheckedChange={(checked) => {
                                        // Sincronizar checkbox com status: marcado = "Concluído", desmarcado = "Em execução"
                                        const newStatus = checked ? 'Concluído' as InitiativeStatus : 'Em execução' as InitiativeStatus;
                                        if (onSubItemStatusChange) {
                                          onSubItemStatusChange(initiative.id, item.id, subItem.id, newStatus);
                                        } else if (onUpdateSubItem) {
                                          // Fallback: usar updateSubItem se onSubItemStatusChange não estiver disponível
                                          onUpdateSubItem(initiative.id, item.id, subItem.id, !!checked);
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor={`subitem-${subItem.id}`} 
                                      className={cn("text-sm", subItem.status === 'Concluído' && "line-through text-muted-foreground")}
                                    >
                                      {subItem.title}
                                    </label>
                                  </div>
                                </TableCell>
                                
                                {/* Coluna Responsável */}
                                <TableCell className="text-sm bg-secondary">
                                  {subItem.responsible || '-'}
                                </TableCell>
                                
                                {/* Coluna Editar - vazia para subitens */}
                                {onEditInitiative && (
                                  <TableCell className="bg-secondary"></TableCell>
                                )}
                                
                                {/* Coluna Status */}
                                <TableCell className="bg-secondary">
                                  {onSubItemStatusChange ? (
                                    <div className="space-y-1">
                                      <Select 
                                        value={subItem.status} 
                                        onValueChange={(newStatus: InitiativeStatus) => 
                                          onSubItemStatusChange(initiative.id, item.id, subItem.id, newStatus)
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-xs px-2 w-[120px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(() => {
                                            // Se está atrasado, limitar opções para apenas Atrasado ou Concluído
                                            const subItemEndDate = parseFlexibleDate(subItem.endDate);
                                            const subItemIsOverdue = subItemEndDate ? isOverdue(subItemEndDate, subItem.status) : false;
                                            const availableStatuses = subItemIsOverdue 
                                              ? getAvailableStatuses(true)
                                              : initiativeStatuses.filter(s => s !== 'all') as InitiativeStatus[];
                                            
                                            return availableStatuses.map(s => (
                                              <SelectItem key={s} value={s as string}>{s}</SelectItem>
                                            ));
                                          })()}
                                        </SelectContent>
                                      </Select>
                                      {(() => {
                                        const subItemEndDate = parseFlexibleDate(subItem.endDate);
                                        const subItemIsOverdue = subItemEndDate ? isOverdue(subItemEndDate, subItem.status) : false;
                                        if (subItemIsOverdue) {
                                          return (
                                            <p className="text-xs text-muted-foreground">
                                              Apenas Atrasado ou Concluído
                                            </p>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  ) : (
                                    <Badge 
                                      variant={subItem.status === 'Concluído' ? 'default' : subItem.status === 'Em Risco' || subItem.status === 'Atrasado' ? 'destructive' : 'secondary'} 
                                      className="capitalize flex items-center w-fit"
                                    >
                                      {SubItemStatusIcon && <SubItemStatusIcon className="mr-1.5 h-3.5 w-3.5" />}
                                      {subItem.status}
                                    </Badge>
                                  )}
                                </TableCell>
                                
                                {/* Coluna Prioridade */}
                                <TableCell className="bg-secondary">
                                  <Badge 
                                    variant="outline"
                                    className={cn(
                                      "capitalize",
                                      subItem.priority === 'Alta' && "bg-red-100 text-red-700 border-red-300",
                                      subItem.priority === 'Média' && "bg-yellow-100 text-yellow-700 border-yellow-300",
                                      subItem.priority === 'Baixa' && "bg-blue-100 text-blue-700 border-blue-300"
                                    )}
                                  >
                                    {subItem.priority}
                                  </Badge>
                                </TableCell>
                                
                                {/* Coluna Progresso */}
                                <TableCell className="bg-secondary">
                                  <div className="flex items-center gap-2">
                                    <ProgressWithColor 
                                      value={subItemGanttTask?.progress || 0} 
                                      className="h-2 w-12" 
                                      indicatorColor={PROGRESS_COLORS[subItem.status]}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {subItemGanttTask?.progress || 0}%
                                    </span>
                                  </div>
                                </TableCell>
                                
                                {/* Colunas do Gantt para Subitem */}
                                {(() => {
                                  if (!subItemGanttTask) {
                                    return dateHeaders.map((day, dayIndex) => {
                                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                      return (
                                        <TableCell 
                                          key={dayIndex} 
                                          className={cn(
                                            "relative p-0 bg-secondary",
                                            isWeekend && "bg-muted/30 border-r border-border/50",
                                            isToday(day) && "bg-red-100/50 dark:bg-red-900/20"
                                          )}
                                          style={{ 
                                            width: `${cellWidth}px`, 
                                            minWidth: `${cellWidth}px`, 
                                            maxWidth: `${cellWidth}px`,
                                            padding: 0,
                                          }}
                                        />
                                      );
                                    });
                                  }
                                  
                                  const taskStart = startOfDay(subItemGanttTask.startDate);
                                  const taskEnd = startOfDay(subItemGanttTask.endDate);
                                  
                                  let barStartIndex = dateHeaders.findIndex(day => {
                                    const dayStart = startOfDay(day);
                                    return dayStart.getTime() >= taskStart.getTime();
                                  });
                                  
                                  let barEndIndex = dateHeaders.findIndex(day => {
                                    const dayStart = startOfDay(day);
                                    return dayStart.getTime() > taskEnd.getTime();
                                  });
                                  
                                  if (barEndIndex < 0) {
                                    barEndIndex = dateHeaders.length;
                                  }
                                  barEndIndex = barEndIndex - 1;
                                  
                                  if (barStartIndex < 0) {
                                    barStartIndex = 0;
                                  }
                                  
                                  if (barEndIndex < barStartIndex) {
                                    barEndIndex = barStartIndex;
                                  }
                                  
                                  // Usar cor por hierarquia (verde claro para subitens)
                                  const barColor = HIERARCHY_COLORS.subitem;
                                  
                                  return dateHeaders.map((day, dayIndex) => {
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    const isTodayMarker = isToday(day);
                                    const isInBarRange = barStartIndex >= 0 && dayIndex >= barStartIndex && dayIndex <= barEndIndex;
                                    const isBarStart = dayIndex === barStartIndex;
                                    
                                    return (
                                      <TableCell 
                                        key={dayIndex} 
                                        className={cn(
                                          "relative p-0 overflow-visible bg-secondary",
                                          isWeekend && "bg-muted/30 border-r border-border/50",
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
                                        {isTodayMarker && (
                                          <div className="absolute inset-y-0 left-0 w-px bg-red-500 z-20" />
                                        )}
                                        
                                        {isBarStart && subItemGanttTask && barStartIndex >= 0 && barEndIndex >= barStartIndex && (() => {
                                          const span = barEndIndex - barStartIndex + 1;
                                          const barWidth = Math.max(40, span * cellWidth);
                                          
                                          return (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div 
                                                  className={cn(
                                                    "absolute top-1/2 -translate-y-1/2 h-4 opacity-90 z-10 shadow-sm border border-white/20 cursor-pointer",
                                                    barColor
                                                  )}
                                                  style={{
                                                    left: '0px',
                                                    width: `${barWidth}px`,
                                                    height: '16px',
                                                    minWidth: '40px',
                                                    pointerEvents: 'auto',
                                                  }}
                                                />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">Início: {format(subItemGanttTask.startDate, 'dd/MM/yyyy')}</p>
                                                <p className="text-xs">Fim: {format(subItemGanttTask.endDate, 'dd/MM/yyyy')}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })()}
                                      </TableCell>
                                    );
                                  });
                                })()}
                              </TableRow>
                            );
                          })}
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
        </TooltipProvider>
      </Card>
    </div>
  );
}

