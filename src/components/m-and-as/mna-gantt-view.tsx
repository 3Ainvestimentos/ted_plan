"use client";

/**
 * ============================================
 * COMPONENTE: MnaGanttView
 * ============================================
 * 
 * Este componente renderiza uma visualização de Gantt para M&A Deals.
 * 
 * CONCEITOS IMPORTANTES:
 * 
 * 1. USEMEMO:
 *    - Hook do React que "memoriza" o resultado de um cálculo
 *    - Só recalcula quando as dependências mudam
 *    - Evita recálculos desnecessários em cada render
 * 
 * 2. ESTRUTURA DO GANTT:
 *    - Eixo Y: Lista de tarefas (deals)
 *    - Eixo X: Timeline de dias
 *    - Barras: Representam duração de cada deal
 * 
 * 3. FIRESTORE → COMPONENTE:
 *    - useMnaDeals() busca dados do Firestore
 *    - Passa deals[] para este componente via props
 *    - Este componente apenas renderiza, não busca dados
 */

import React, { useMemo } from 'react';
import type { MnaDeal, InitiativeStatus } from '@/types';
import { 
  startOfDay, 
  endOfDay, 
  parseISO, 
  eachDayOfInterval, 
  isWithinInterval, 
  getMonth, 
  getYear, 
  format, 
  isToday, 
  isBefore,
  subDays,
  addDays,
  parse,
  isValid
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * ============================================
 * FUNÇÃO HELPER: Parse de datas flexível
 * ============================================
 * 
 * O Firestore pode ter datas em diferentes formatos:
 * - ISO: "2025-12-24"
 * - BR curto: "24/12"
 * - BR completo: "24/12/2025"
 * - Timestamp do Firestore: { seconds: 123456789, nanoseconds: 0 }
 * 
 * Esta função tenta todos os formatos e retorna a data válida
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
    
    console.warn(`[MnaGanttView] Não foi possível parsear a data string: "${dateInput}"`);
  }
  
  return null;
}

/**
 * ============================================
 * FUNÇÃO HELPER: Extrair deadline do Deal
 * ============================================
 * 
 * Como o Deal pode não ter um deadline próprio,
 * calculamos baseado nos subitens:
 * - Se tem deadline definido no deal, usa ele
 * - Senão, pega o MAIOR deadline dos subitens
 */
function extractDealDeadline(deal: MnaDeal): Date | null {
  // Primeiro tenta o deadline do deal
  const dealDeadline = parseFlexibleDate(deal.deadline);
  if (dealDeadline) return dealDeadline;
  
  // Se não tem, busca nos subitems
  if (deal.subItems && deal.subItems.length > 0) {
    const subItemDeadlines = deal.subItems
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
 * ============================================
 * FUNÇÃO HELPER: Extrair startDate do Deal
 * ============================================
 * 
 * Calcula a data de início:
 * - Se tem startDate definido, usa ele
 * - Senão, pega o MENOR deadline dos subitens como aproximação
 * - Ou usa 30 dias antes do deadline
 */
function extractDealStartDate(deal: MnaDeal, deadline: Date): Date {
  // Primeiro tenta o startDate do deal
  const dealStartDate = parseFlexibleDate(deal.startDate);
  if (dealStartDate) return dealStartDate;
  
  // Se não tem, busca nos subitems o menor deadline
  if (deal.subItems && deal.subItems.length > 0) {
    const subItemDeadlines = deal.subItems
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
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

// ============================================
// CONSTANTES
// ============================================

/**
 * Status disponíveis para seleção
 * - Quando está em atraso, mostra opções específicas
 * - Caso contrário, mostra opções normais
 */
const STATUS_OPTIONS: InitiativeStatus[] = ['Pendente', 'Em execução', 'Concluído'];
const OVERDUE_STATUS_OPTIONS: InitiativeStatus[] = ['Em execução', 'Concluído'];

/**
 * Cores das barras do Gantt por status
 * - Usamos Tailwind CSS classes
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
// INTERFACES
// ============================================

/**
 * GanttTask: Representação interna de uma tarefa no Gantt
 * 
 * Cada deal do Firestore é transformado em uma GanttTask
 * para facilitar a renderização
 */
interface GanttTask {
  id: string;           // ID único do deal
  name: string;         // Título para exibição
  responsible: string;  // Responsável
  status: InitiativeStatus;
  startDate: Date;      // Data de início (calculada ou definida)
  endDate: Date;        // Data de término (deadline)
  progress: number;     // Progresso 0-100
  isOverdue: boolean;   // Se está atrasado
  originalDeal: MnaDeal; // Referência ao deal original
  cidade?: string;      // Cidade do M&A (opcional)
}

/**
 * Props do componente
 * 
 * @param deals - Array de deals vindos do Firestore
 * @param onDealClick - Callback quando usuário clica em um deal
 * @param onStatusChange - Callback para atualizar status
 */
interface MnaGanttViewProps {
  deals: MnaDeal[];
  onDealClick: (deal: MnaDeal) => void;
  onStatusChange?: (dealId: string, newStatus: InitiativeStatus) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function MnaGanttView({ deals, onDealClick, onStatusChange }: MnaGanttViewProps) {
  
  // Debug: log para verificar os dados recebidos
  console.log('[MnaGanttView] Deals recebidos:', deals.length, deals.map(d => ({
    id: d.id,
    title: d.title,
    deadline: d.deadline,
    startDate: d.startDate
  })));
  
  /**
   * useMemo - Memorização de cálculos pesados
   * 
   * SINTAXE:
   * const resultado = useMemo(() => {
   *   // cálculos pesados aqui
   *   return valorCalculado;
   * }, [dependencias]);
   * 
   * EXPLICAÇÃO:
   * - O código dentro do useMemo só executa quando 'deals' muda
   * - Se o componente re-renderiza mas 'deals' não mudou,
   *   o React reutiliza o valor anterior (não recalcula)
   * - Isso é importante porque temos muitos cálculos de datas aqui
   */
  const { tasks, dateHeaders, monthHeaders } = useMemo(() => {
    // Se não há deals, retorna arrays vazios
    if (!deals || deals.length === 0) {
      return { tasks: [], dateHeaders: [], monthHeaders: [] };
    }

    // ----------------------------------------
    // PASSO 1: Coletar todas as datas válidas
    // ----------------------------------------
    /**
     * Precisamos encontrar a menor e maior data
     * para definir o range do calendário
     * 
     * .filter() - Remove valores inválidos
     * .flat() - Transforma [[a,b], [c,d]] em [a,b,c,d]
     */
    const allDates: Date[] = [];
    
    /**
     * Coleta todas as datas válidas dos deals
     * Usa as funções extract* para buscar datas do deal ou subitems
     */
    deals.forEach(deal => {
      // Extrai deadline (do deal ou subitems)
      const deadlineDate = extractDealDeadline(deal);
      console.log(`[MnaGanttView] Deal "${deal.title}" - deadline extraído:`, deadlineDate, '| subItems:', deal.subItems?.length || 0);
      
      if (deadlineDate) {
        allDates.push(deadlineDate);
        
        // Também adiciona o startDate
        const startDate = extractDealStartDate(deal, deadlineDate);
        allDates.push(startDate);
      }
    });
    
    console.log('[MnaGanttView] Total de datas válidas:', allDates.length);

    // Se nenhuma data válida, usa data atual como fallback
    // Isso garante que o Gantt sempre apareça, mesmo sem datas
    if (allDates.length === 0) {
      console.warn('[MnaGanttView] Nenhuma data válida encontrada. Usando data atual como fallback.');
      allDates.push(new Date());
    }

    // ----------------------------------------
    // PASSO 2: Calcular range do calendário
    // ----------------------------------------
    /**
     * .reduce() - Percorre array e acumula resultado
     * 
     * Aqui usamos para encontrar a menor (min) e maior (max) data
     * 
     * Exemplo:
     * [date1, date2, date3].reduce((menor, atual) => 
     *   atual < menor ? atual : menor
     * , date1)
     * 
     * Começa com date1, compara com cada elemento,
     * mantém o menor
     */
    const minDate = allDates.reduce((min, d) => d < min ? d : min, allDates[0]);
    const maxDate = allDates.reduce((max, d) => d > max ? d : max, allDates[0]);

    // Adiciona margem de 7 dias antes e depois
    const chartStartDate = startOfDay(subDays(minDate, 7));
    const chartEndDate = endOfDay(addDays(maxDate, 7));

    // ----------------------------------------
    // PASSO 3: Gerar array de dias (cabeçalho)
    // ----------------------------------------
    /**
     * eachDayOfInterval - Função do date-fns
     * Gera array com todos os dias entre duas datas
     * 
     * Exemplo:
     * eachDayOfInterval({ start: '2025-01-01', end: '2025-01-03' })
     * → [Date(01), Date(02), Date(03)]
     */
    const dateHeaders = eachDayOfInterval({ start: chartStartDate, end: chartEndDate });

    // ----------------------------------------
    // PASSO 4: Transformar deals em GanttTasks
    // ----------------------------------------
    /**
     * .map() - Transforma cada elemento do array
     * 
     * Para cada deal do Firestore, criamos um GanttTask
     * com os campos necessários para renderização
     * 
     * IMPORTANTE: Se o deal não tem deadline, não será exibido no Gantt
     */
    const ganttTasks: GanttTask[] = [];
    
    deals.forEach(deal => {
      // Extrai deadline do deal ou dos subitems
      const endDate = extractDealDeadline(deal);
      
      // Se não tem deadline válido, não inclui no Gantt
      if (!endDate) {
        console.log(`[MnaGanttView] Deal "${deal.title}" ignorado - sem deadline válido`);
        return; // Pula este deal
      }
      
      // Extrai startDate
      const startDate = extractDealStartDate(deal, endDate);
      
      // Verifica se está atrasado
      // isBefore() compara se a primeira data é anterior à segunda
      const isOverdue = isBefore(endDate, startOfDay(new Date())) && 
                        deal.status !== 'Concluído';

      ganttTasks.push({
        id: deal.id,
        name: deal.title,
        responsible: deal.responsible || deal.owner || '-',
        status: deal.status,
        startDate,
        endDate,
        progress: deal.progress || 0,
        isOverdue,
        originalDeal: deal,
        cidade: deal.cidade,
      });
    });

    // ----------------------------------------
    // PASSO 5: Gerar cabeçalhos de meses
    // ----------------------------------------
    /**
     * Agrupa dias por mês para mostrar "Jan 2025", "Fev 2025" etc.
     * 
     * colSpan = quantos dias aquele mês tem no range
     */
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

    return { tasks: ganttTasks, dateHeaders, monthHeaders };
  }, [deals]); // Dependência: só recalcula quando 'deals' muda

  // ----------------------------------------
  // RENDERIZAÇÃO: Estado vazio
  // ----------------------------------------
  if (deals.length === 0) {
    return (
      <Card className="flex items-center justify-center h-64">
        <CardContent>
          <p className="text-muted-foreground">
            Nenhum deal encontrado. Crie um novo deal para visualizar o Gantt.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Log de debug para tasks
  console.log('[MnaGanttView] Tasks geradas:', tasks.length, tasks);

  // ----------------------------------------
  // RENDERIZAÇÃO: Tabela Gantt
  // ----------------------------------------
  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table className="min-w-full table-fixed">
        {/* ========== CABEÇALHO ========== */}
        <TableHeader>
          {/* Linha dos meses */}
          <TableRow className="bg-muted/50">
            <TableHead className="w-64 sticky left-0 bg-muted/50 z-20" rowSpan={2}>
              Deal
            </TableHead>
            <TableHead className="w-24" rowSpan={2}>Cidade</TableHead>
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
          {/**
           * .map() sobre tasks
           * 
           * Para cada task, renderiza uma linha <TableRow>
           * A sintaxe (task) => (...) é uma arrow function
           */}
          {tasks.map(task => {
            // Decide quais opções de status mostrar
            const statusOptions = task.isOverdue ? OVERDUE_STATUS_OPTIONS : STATUS_OPTIONS;
            
            return (
              <TableRow 
                key={task.id} 
                className={cn(
                  "h-10",
                  // Condicional: adiciona fundo vermelho se atrasado
                  task.isOverdue && "bg-destructive/10"
                )}
              >
                {/* Coluna: Nome do Deal */}
                <TableCell className="sticky left-0 bg-background z-10">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-current font-medium truncate text-left justify-start w-full"
                    onClick={() => onDealClick(task.originalDeal)}
                  >
                    {task.name}
                  </Button>
                </TableCell>

                {/* Coluna: Cidade */}
                <TableCell className="text-sm text-muted-foreground">
                  {task.cidade || '-'}
                </TableCell>

                {/* Coluna: Responsável */}
                <TableCell className="text-sm">
                  {task.responsible}
                </TableCell>

                {/* Coluna: Status (Select dropdown) */}
                <TableCell>
                  {onStatusChange ? (
                    /**
                     * Select - Componente de dropdown
                     * 
                     * value = valor atual selecionado
                     * onValueChange = callback quando muda
                     * 
                     * A sintaxe (newStatus) => onStatusChange(...) 
                     * passa o novo status para a função pai
                     */
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
                    // Se não tem onStatusChange, mostra badge estático
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
                {/**
                 * Para cada dia do calendário, renderiza uma célula
                 * Se o dia está dentro do range da tarefa, mostra a barra
                 */}
                {dateHeaders.map((day, dayIndex) => {
                  /**
                   * isWithinInterval - Verifica se 'day' está entre start e end
                   * Retorna true/false
                   */
                  const isInRange = isWithinInterval(day, { 
                    start: task.startDate, 
                    end: task.endDate 
                  });
                  
                  // Verifica se é fim de semana (0=Dom, 6=Sáb)
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  // Verifica se é hoje
                  const isTodayMarker = isToday(day);

                  // Escolhe cor da barra baseado no status
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
                        width: '3px', 
                        minWidth: '3px', 
                        maxWidth: '3px',
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

