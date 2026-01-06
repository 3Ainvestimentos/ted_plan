/**
 * ============================================
 * HELPERS PARA PÁGINA AGENDA
 * ============================================
 * 
 * Este arquivo contém funções helper reutilizáveis para trabalhar com a página Agenda,
 * incluindo filtragem de itens da semana vigente, cálculo de dias restantes e formatação.
 */

import { startOfDay, differenceInDays, addDays } from 'date-fns';
import type { Initiative, InitiativeItem, SubItem, InitiativeStatus, InitiativePriority } from '@/types';

/**
 * Interface para item da agenda
 */
export interface AgendaItem {
  id: string;
  type: 'item' | 'subitem';
  initiativeId: string;
  initiativeTitle: string;
  itemId?: string; // Apenas para subitens
  itemTitle?: string; // Apenas para subitens
  title: string; // Título do item ou subitem
  responsible: string;
  priority: InitiativePriority;
  status: InitiativeStatus;
  deadline: string; // ISO date string 'YYYY-MM-DD'
  daysRemaining: number; // Dias até o prazo (negativo se atrasado)
  isOverdue: boolean;
  risk?: string; // Campo de risco (opcional, pode ser "-" se não aplicável)
}

/**
 * Calcula os dias restantes até o deadline.
 * 
 * @param deadline - Data de prazo (string ISO 'YYYY-MM-DD' ou Date)
 * @returns Número de dias restantes (negativo se atrasado, 0 se é hoje, positivo se futuro)
 * 
 * @example
 * // Deadline no passado
 * calculateDaysRemaining('2024-01-01');
 * // Retorna: -5 (se hoje for 2024-01-06)
 * 
 * @example
 * // Deadline hoje
 * calculateDaysRemaining(new Date().toISOString().split('T')[0]);
 * // Retorna: 0
 * 
 * @example
 * // Deadline no futuro
 * calculateDaysRemaining('2024-12-31');
 * // Retorna: 365 (se hoje for 2024-01-01)
 */
export function calculateDaysRemaining(deadline: string | Date | null | undefined): number {
  if (!deadline) return Infinity; // Sem deadline = não tem prazo definido
  
  // Converte deadline para Date se necessário
  let deadlineDate: Date;
  if (typeof deadline === 'string') {
    // Se é string ISO (YYYY-MM-DD), adiciona horário para evitar problemas de timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      deadlineDate = new Date(deadline + 'T00:00:00');
    } else {
      deadlineDate = new Date(deadline);
    }
  } else {
    deadlineDate = deadline;
  }
  
  // Verifica se a data é válida
  if (isNaN(deadlineDate.getTime())) return Infinity;
  
  // Compara com hoje (início do dia)
  const today = startOfDay(new Date());
  const deadlineDay = startOfDay(deadlineDate);
  
  return differenceInDays(deadlineDay, today);
}

/**
 * Formata a exibição de dias restantes.
 * 
 * @param daysRemaining - Número de dias restantes (negativo se atrasado)
 * @returns String formatada para exibição
 * 
 * @example
 * // Atrasado
 * formatDaysRemaining(-3);
 * // Retorna: "3 dias atrasado"
 * 
 * @example
 * // Hoje
 * formatDaysRemaining(0);
 * // Retorna: "Hoje"
 * 
 * @example
 * // Futuro
 * formatDaysRemaining(5);
 * // Retorna: "5 dias"
 */
export function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining === Infinity) return '-';
  
  if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'dia atrasado' : 'dias atrasado'}`;
  }
  
  if (daysRemaining === 0) {
    return 'Hoje';
  }
  
  return `${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
}

/**
 * Retorna o caminho hierárquico completo do item/subitem.
 * 
 * @param initiativeTitle - Título da iniciativa
 * @param itemTitle - Título do item (opcional, apenas para subitens)
 * @param subItemTitle - Título do subitem (opcional)
 * @returns String hierárquica formatada
 * 
 * @example
 * // Item
 * getHierarchyPath('Projeto A', 'Item 1', undefined);
 * // Retorna: "Projeto A / Item 1"
 * 
 * @example
 * // Subitem
 * getHierarchyPath('Projeto A', 'Item 1', 'Subitem 1');
 * // Retorna: "Projeto A / Item 1 / Subitem 1"
 */
export function getHierarchyPath(
  initiativeTitle: string,
  itemTitle?: string,
  subItemTitle?: string
): string {
  const parts = [initiativeTitle];
  
  if (itemTitle) {
    parts.push(itemTitle);
  }
  
  if (subItemTitle) {
    parts.push(subItemTitle);
  }
  
  return parts.join(' / ');
}

/**
 * Verifica se um deadline está dentro da semana vigente (7 dias).
 * 
 * @param deadline - Data de prazo (string ISO 'YYYY-MM-DD' ou Date)
 * @returns true se o deadline está dentro de 7 dias (inclui atrasados)
 * 
 * @example
 * // Deadline em 5 dias
 * isWithinWeek('2024-01-06'); // Se hoje for 2024-01-01
 * // Retorna: true
 * 
 * @example
 * // Deadline em 10 dias
 * isWithinWeek('2024-01-11'); // Se hoje for 2024-01-01
 * // Retorna: false
 * 
 * @example
 * // Deadline atrasado
 * isWithinWeek('2023-12-25'); // Se hoje for 2024-01-01
 * // Retorna: true (inclui atrasados)
 */
export function isWithinWeek(deadline: string | Date | null | undefined): boolean {
  if (!deadline) return false;
  
  const daysRemaining = calculateDaysRemaining(deadline);
  
  // Inclui itens atrasados e itens até 7 dias no futuro
  return daysRemaining <= 7;
}

/**
 * Extrai todos os itens e subitens da semana vigente de um array de iniciativas.
 * 
 * REGRAS:
 * - Apenas itens/subitens não concluídos
 * - Deadline dentro de 7 dias (inclui atrasados)
 * - Retorna array de AgendaItem com todas as informações necessárias
 * 
 * @param initiatives - Array de iniciativas
 * @returns Array de AgendaItem
 * 
 * @example
 * const items = getWeekItems(initiatives);
 * // Retorna: Array de itens/subitens da semana vigente
 */
export function getWeekItems(initiatives: Initiative[]): AgendaItem[] {
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const items: AgendaItem[] = [];
  
  initiatives.forEach(initiative => {
    // Processar itens
    if (initiative.items && initiative.items.length > 0) {
      initiative.items.forEach(item => {
        // Verificar se item não está concluído e tem deadline
        if (item.status !== 'Concluído' && item.deadline) {
          const deadlineDate = new Date(item.deadline + 'T00:00:00');
          
          // Verificar se está dentro da semana vigente (inclui atrasados)
          if (deadlineDate <= weekEnd) {
            const daysRemaining = calculateDaysRemaining(item.deadline);
            const isOverdue = daysRemaining < 0;
            
            items.push({
              id: item.id,
              type: 'item',
              initiativeId: initiative.id,
              initiativeTitle: initiative.title,
              title: item.title,
              responsible: item.responsible || '-',
              priority: item.priority,
              status: item.status,
              deadline: item.deadline,
              daysRemaining,
              isOverdue,
              risk: '-',
            });
          }
        }
        
        // Processar subitens do item
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.forEach(subItem => {
            // Verificar se subitem não está concluído e tem deadline
            if (subItem.status !== 'Concluído' && subItem.deadline) {
              const deadlineDate = new Date(subItem.deadline + 'T00:00:00');
              
              // Verificar se está dentro da semana vigente (inclui atrasados)
              if (deadlineDate <= weekEnd) {
                const daysRemaining = calculateDaysRemaining(subItem.deadline);
                const isOverdue = daysRemaining < 0;
                
                items.push({
                  id: subItem.id,
                  type: 'subitem',
                  initiativeId: initiative.id,
                  initiativeTitle: initiative.title,
                  itemId: item.id,
                  itemTitle: item.title,
                  title: subItem.title,
                  responsible: subItem.responsible || '-',
                  priority: subItem.priority,
                  status: subItem.status,
                  deadline: subItem.deadline,
                  daysRemaining,
                  isOverdue,
                  risk: '-',
                });
              }
            }
          });
        }
      });
    }
  });
  
  // Ordenar por dias restantes (mais urgentes primeiro)
  return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

