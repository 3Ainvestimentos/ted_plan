"use client";

/**
 * ============================================
 * COMPONENTE: InitiativeGanttView
 * ============================================
 * 
 * Este componente renderiza uma visualização de Gantt para Iniciativas Estratégicas.
 * 
 * ARQUITETURA MODULAR:
 * - Funções helper separadas para facilitar manutenção
 * - Cada função tem responsabilidade única
 * - Código bem documentado e organizado
 * 
 * CONCEITOS IMPORTANTES:
 * 
 * 1. USEMEMO:
 *    - Hook do React que "memoriza" o resultado de um cálculo
 *    - Só recalcula quando as dependências mudam
 *    - Evita recálculos desnecessários em cada render
 * 
 * 2. ESTRUTURA DO GANTT:
 *    - Eixo Y: Lista de tarefas (iniciativas)
 *    - Eixo X: Timeline de dias
 *    - Barras: Representam duração de cada iniciativa
 * 
 * 3. FIRESTORE → COMPONENTE:
 *    - useInitiatives() busca dados do Firestore
 *    - Passa initiatives[] para este componente via props
 *    - Este componente apenas renderiza, não busca dados
 */

// ============================================
// SEÇÃO 1: IMPORTS
// ============================================

// React e Hooks
import React, { useMemo } from 'react';

// Tipos TypeScript
import type { Initiative, InitiativeStatus } from '@/types';

// Utilitários de Data (date-fns)
import { 
  startOfDay, 
  endOfDay, 
  parseISO, 
  eachDayOfInterval, 
  isWithinInterval, 
  getMonth, 
  format, 
  isToday, 
  isBefore,
  subDays,
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  parse,
  isValid
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes UI
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

// ============================================
// SEÇÃO 2: CONSTANTES E CONFIGURAÇÕES
// ============================================

/**
 * Status disponíveis para seleção no dropdown
 * - Quando está em atraso, mostra opções específicas
 * - Caso contrário, mostra opções normais
 */
const STATUS_OPTIONS: InitiativeStatus[] = ['Pendente', 'Em execução', 'Concluído'];
const OVERDUE_STATUS_OPTIONS: InitiativeStatus[] = ['Em execução', 'Concluído'];

/**
 * Cores das barras do Gantt por status
 * - Usamos Tailwind CSS classes
 * - Mapeia cada status para uma cor específica
 */
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
// SEÇÃO 3: INTERFACES E TIPOS
// ============================================

/**
 * GanttTask: Representação interna de uma tarefa no Gantt
 * 
 * Cada iniciativa do Firestore é transformada em uma GanttTask
 * para facilitar a renderização no componente
 */
interface GanttTask {
  id: string;                    // ID único da iniciativa
  name: string;                   // Título para exibição
  responsible: string;            // Responsável (owner)
  status: InitiativeStatus;      // Status atual
  startDate: Date;               // Data de início (calculada ou definida)
  endDate: Date;                 // Data de término (deadline)
  progress: number;              // Progresso 0-100
  isOverdue: boolean;            // Se está atrasado
  originalInitiative: Initiative; // Referência à iniciativa original
}

/**
 * Props do componente InitiativeGanttView
 * 
 * @param initiatives - Array de iniciativas vindas do Firestore
 * @param onInitiativeClick - Callback quando usuário clica em uma iniciativa
 * @param onStatusChange - Callback opcional para atualizar status
 */
interface InitiativeGanttViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (initiative: Initiative) => void;
  onStatusChange?: (initiativeId: string, newStatus: InitiativeStatus) => void;
}

// ============================================
// SEÇÃO 4: FUNÇÕES HELPER (MODULARES)
// ============================================

/**
 * Parse flexível de datas - aceita múltiplos formatos
 * 
 * O Firestore pode ter datas em diferentes formatos:
 * - ISO: "2025-12-24"
 * - BR curto: "24/12"
 * - BR completo: "24/12/2025"
 * - Timestamp do Firestore: { seconds: 123456789, nanoseconds: 0 }
 * 
 * @param dateInput - String, Date, ou Timestamp do Firestore
 * @returns Date válida ou null se não conseguir parsear
 */
function parseFlexibleDate(dateInput: any): Date | null {
  if (!dateInput) return null;
  
  // Se já é um objeto Date
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null;
  }
  
  // Se é um Timestamp do Firestore (tem .seconds e .nanoseconds)
  if (dateInput?.seconds !== undefined) {
    const date = new Date(dateInput.seconds * 1000);
    return isValid(date) ? date : null;
  }
  
  // Se é um Timestamp do Firestore com método toDate()
  if (typeof dateInput?.toDate === 'function') {
    const date = dateInput.toDate();
    return isValid(date) ? date : null;
  }
  
  // Se é uma string
  if (typeof dateInput === 'string') {
    // Tenta formato ISO primeiro (mais comum em APIs)
    let date = parseISO(dateInput);
    if (isValid(date)) return date;
    
    // Tenta formato brasileiro completo: "24/12/2025"
    date = parse(dateInput, 'dd/MM/yyyy', new Date());
    if (isValid(date)) return date;
    
    // Tenta formato brasileiro curto: "24/12" (assume ano atual)
    date = parse(dateInput, 'dd/MM', new Date());
    if (isValid(date)) return date;
    
    // Tenta formato americano: "12/24/2025"
    date = parse(dateInput, 'MM/dd/yyyy', new Date());
    if (isValid(date)) return date;
  }
  
  return null;
}

/**
 * Extrai deadline de uma Initiative
 * 
 * Como a Initiative pode não ter um deadline próprio,
 * calculamos baseado nos subitens:
 * - Se tem deadline definido na iniciativa, usa ele
 * - Senão, pega o MAIOR deadline dos subitens
 * 
 * @param initiative - Iniciativa para extrair deadline
 * @returns Date válida ou null se não encontrar
 */
function extractInitiativeDeadline(initiative: Initiative): Date | null {
  // Primeiro tenta o deadline da iniciativa
  const initiativeDeadline = parseFlexibleDate(initiative.deadline);
  if (initiativeDeadline) return initiativeDeadline;
  
  // Se não tem, busca nos subitems
  if (initiative.subItems && initiative.subItems.length > 0) {
    const subItemDeadlines = initiative.subItems
      .map(si => parseFlexibleDate(si.deadline))
      .filter((d): d is Date => d !== null);
    
    if (subItemDeadlines.length > 0) {
      // Retorna o maior deadline (mais distante)
      return subItemDeadlines.reduce((max, d) => d > max ? d : max, subItemDeadlines[0]);
    }
  }
  
  return null;
}

/**
 * Extrai startDate de uma Initiative
 * 
 * Calcula a data de início:
 * - Se tem startDate definido, usa ele
 * - Senão, pega o MENOR deadline dos subitens como aproximação
 * - Ou usa 30 dias antes do deadline como fallback
 * 
 * @param initiative - Iniciativa para extrair startDate
 * @param deadline - Deadline já calculado (para fallback)
 * @returns Date válida
 */
function extractInitiativeStartDate(initiative: Initiative, deadline: Date): Date {
  // Primeiro tenta o startDate da iniciativa
  const initiativeStartDate = parseFlexibleDate(initiative.startDate);
  if (initiativeStartDate) return initiativeStartDate;
  
  // Se não tem, busca nos subitems o menor deadline
  if (initiative.subItems && initiative.subItems.length > 0) {
    const subItemDeadlines = initiative.subItems
      .map(si => parseFlexibleDate(si.deadline))
      .filter((d): d is Date => d !== null);
    
    if (subItemDeadlines.length > 0) {
      // Retorna o menor deadline como "início"
      return subItemDeadlines.reduce((min, d) => d < min ? d : min, subItemDeadlines[0]);
    }
  }
  
  // Fallback: 30 dias antes do deadline
  return subDays(deadline, 30);
}

/**
 * Calcula o range de datas para o calendário Gantt
 * 
 * NOVA LÓGICA: Exibe sempre um semestre (6 meses)
 * - Mês atual + próximos 5 meses
 * - Começa no primeiro dia do mês atual
 * - Termina no último dia do mês atual + 5 meses
 * 
 * Isso garante uma visualização consistente e previsível,
 * independente das datas das iniciativas.
 * 
 * @param initiatives - Array de iniciativas (não usado, mas mantido para compatibilidade)
 * @returns Objeto com start e end dates do semestre atual
 */
function calculateDateRange(initiatives: Initiative[]): { start: Date; end: Date } {
  // Data atual
  const today = new Date();
  
  // Primeiro dia do mês atual
  const startDate = startOfMonth(today);
  
  // Último dia do mês atual + 5 meses (6 meses total = semestre)
  const endDate = endOfMonth(addMonths(today, 5));
  
  return {
    start: startOfDay(startDate),
    end: endOfDay(endDate)
  };
}

/**
 * Gera cabeçalhos de meses para o Gantt
 * 
 * Agrupa dias por mês para mostrar "Jan 2025", "Fev 2025" etc.
 * 
 * @param dateHeaders - Array de datas do calendário
 * @returns Array de objetos com nome do mês e colSpan
 */
function generateMonthHeaders(dateHeaders: Date[]): { name: string; colSpan: number }[] {
  const monthHeaders: { name: string; colSpan: number }[] = [];
  let currentMonth = -1;
  
  dateHeaders.forEach(date => {
    const month = getMonth(date);
    
    if (month !== currentMonth) {
      // Novo mês começou
      currentMonth = month;
      monthHeaders.push({ 
        name: format(date, 'MMM yyyy', { locale: ptBR }), 
        colSpan: 1 
      });
    } else {
      // Mesmo mês, incrementa colSpan
      monthHeaders[monthHeaders.length - 1].colSpan++;
    }
  });
  
  return monthHeaders;
}

/**
 * Transforma Initiative em GanttTask para renderização
 * 
 * @param initiative - Iniciativa para transformar
 * @returns GanttTask ou null se não tiver deadline válido
 */
function transformInitiativeToGanttTask(initiative: Initiative): GanttTask | null {
  // Extrai deadline
  const endDate = extractInitiativeDeadline(initiative);
  
  // Se não tem deadline válido, não inclui no Gantt
  if (!endDate) {
    return null;
  }
  
  // Extrai startDate
  const startDate = extractInitiativeStartDate(initiative, endDate);
  
  // Verifica se está atrasado
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

// ============================================
// SEÇÃO 5: COMPONENTE PRINCIPAL
// ============================================

export function InitiativeGanttView({ 
  initiatives, 
  onInitiativeClick, 
  onStatusChange 
}: InitiativeGanttViewProps) {
  
  /**
   * useMemo - Memorização de cálculos pesados
   * 
   * Calcula tasks, dateHeaders e monthHeaders apenas quando
   * o array 'initiatives' muda, evitando recálculos desnecessários
   */
  const { tasks, dateHeaders, monthHeaders, cellWidth } = useMemo(() => {
    // Se não há iniciativas, retorna arrays vazios
    if (!initiatives || initiatives.length === 0) {
      return { tasks: [], dateHeaders: [], monthHeaders: [], cellWidth: 0 };
    }

    // Calcula range de datas (semestre: mês atual + 5 meses)
    const dateRange = calculateDateRange(initiatives);

    // Gera array de dias (cabeçalho do calendário)
    const dateHeaders = eachDayOfInterval({ 
      start: dateRange.start, 
      end: dateRange.end 
    });

    // Transforma iniciativas em GanttTasks
    const ganttTasks: GanttTask[] = [];
    
    initiatives.forEach(initiative => {
      const task = transformInitiativeToGanttTask(initiative);
      if (task) {
        ganttTasks.push(task);
      }
    });

    // Gera cabeçalhos de meses
    const monthHeaders = generateMonthHeaders(dateHeaders);

    /**
     * Calcula largura das células do calendário para exibir tudo sem scroll horizontal
     * 
     * LÓGICA DE CÁLCULO:
     * 1. Estima largura disponível para o calendário (descontando colunas fixas)
     * 2. Divide pelo número total de dias do semestre (6 meses ≈ 180 dias)
     * 3. Aplica limites mínimo (1px) e máximo (2.5px) para manter legibilidade
     * 
     * EXEMPLO:
     * - 180 dias no semestre
     * - 1200px disponível para calendário
     * - 1200 / 180 = 6.67px por dia (limitado a 2.5px máximo)
     * - Resultado: 2.5px por célula
     * 
     * NOTA: A largura é calculada dinamicamente para garantir que todos os dias
     * do semestre (6 meses) caibam na tela sem necessidade de scroll horizontal
     */
    const totalDays = dateHeaders.length;
    
    // Largura estimada disponível para o calendário (descontando colunas fixas)
    // Colunas fixas: Iniciativa (256px) + Responsável (128px) + Status (144px) + Progresso (80px) + Deadline (96px) = ~704px
    // Largura total típica: ~1920px (full HD) ou ~1440px (laptop)
    // Usamos 1200px como estimativa conservadora
    const estimatedAvailableWidth = 1200;
    
    // Calcula largura por célula
    const calculatedWidth = estimatedAvailableWidth / totalDays;
    
    // Aplica limites: mínimo 1px, máximo 2.5px
    // Isso garante visualização compacta mas legível
    const cellWidth = Math.max(1, Math.min(2.5, calculatedWidth));

    return { tasks: ganttTasks, dateHeaders, monthHeaders, cellWidth };
  }, [initiatives]); // Dependência: só recalcula quando 'initiatives' muda

  // ----------------------------------------
  // RENDERIZAÇÃO: Estado vazio
  // ----------------------------------------
  if (initiatives.length === 0) {
    return (
      <Card className="flex items-center justify-center h-64">
        <CardContent>
          <p className="text-muted-foreground">
            Nenhuma iniciativa encontrada. Crie uma nova iniciativa para visualizar o Gantt.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ----------------------------------------
  // RENDERIZAÇÃO: Tabela Gantt
  // ----------------------------------------
  /**
   * Container sem overflow-x-auto para exibir todo o conteúdo integralmente
   * 
   * ESTRATÉGIA PARA SEM SCROLL HORIZONTAL:
   * 1. Removido overflow-x-auto do container
   * 2. Largura das células calculada dinamicamente baseada no número de dias
   * 3. Tabela usa width: 100% para ocupar todo o espaço disponível
   * 4. Células do calendário têm largura fixa calculada (1.5px - 3px por dia)
   * 
   * Isso garante que o semestre completo (6 meses) seja exibido sem scroll
   */
  return (
    <div className="border rounded-lg w-full">
      <Table className="w-full table-auto">
        {/* ========== CABEÇALHO ========== */}
        <TableHeader>
          {/* Linha dos meses */}
          <TableRow className="bg-muted/50">
            <TableHead className="w-64 sticky left-0 bg-muted/50 z-20" rowSpan={2}>
              Iniciativa
            </TableHead>
            <TableHead className="w-32" rowSpan={2}>Responsável</TableHead>
            <TableHead className="w-36" rowSpan={2}>Status</TableHead>
            <TableHead className="w-20" rowSpan={2}>Progresso</TableHead>
            <TableHead className="w-24" rowSpan={2}>Deadline</TableHead>
            
            {/* Cabeçalhos dos meses */}
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

        {/* ========== CORPO DA TABELA ========== */}
        <TableBody>
          {tasks.map(task => {
            // Decide quais opções de status mostrar
            const statusOptions = task.isOverdue ? OVERDUE_STATUS_OPTIONS : STATUS_OPTIONS;
            
            return (
              <TableRow 
                key={task.id} 
                className={cn(
                  "h-10",
                  task.isOverdue && "bg-destructive/10"
                )}
              >
                {/* Coluna: Nome da Iniciativa */}
                <TableCell className="sticky left-0 bg-background z-10">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-current font-medium truncate text-left justify-start w-full"
                    onClick={() => onInitiativeClick(task.originalInitiative)}
                  >
                    {task.name}
                  </Button>
                </TableCell>

                {/* Coluna: Responsável */}
                <TableCell className="text-sm">
                  {task.responsible}
                </TableCell>

                {/* Coluna: Status (Select dropdown) */}
                <TableCell>
                  {onStatusChange ? (
                    <Select 
                      value={task.status} 
                      onValueChange={(newStatus: InitiativeStatus) => 
                        onStatusChange(task.id, newStatus)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs px-2 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{task.status}</Badge>
                  )}
                </TableCell>

                {/* Coluna: Progresso */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={task.progress} className="h-2 w-12" />
                    <span className="text-xs text-muted-foreground">
                      {task.progress}%
                    </span>
                  </div>
                </TableCell>

                {/* Coluna: Deadline */}
                <TableCell className="text-sm">
                  {format(task.endDate, 'dd/MM/yy')}
                </TableCell>

                {/* ========== CÉLULAS DO GANTT (Timeline) ========== */}
                {dateHeaders.map((day, dayIndex) => {
                  const isInRange = isWithinInterval(day, { 
                    start: task.startDate, 
                    end: task.endDate 
                  });
                  
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isTodayMarker = isToday(day);

                  const barColor = isInRange 
                    ? (task.isOverdue ? 'bg-red-500' : STATUS_COLORS[task.status])
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
                      {/* Marcador vertical de "hoje" */}
                      {isTodayMarker && (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-red-500 z-10" />
                      )}
                      
                      {/* Barra do Gantt */}
                      {isInRange && (
                        <div 
                          className={cn("h-4 w-full opacity-80", barColor)} 
                          title={`${task.name}: ${format(task.startDate, 'dd/MM')} - ${format(task.endDate, 'dd/MM')}`}
                        />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

