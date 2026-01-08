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
  endDate: string; // ISO date string 'YYYY-MM-DD' (prazo/deadline)
  daysRemaining: number; // Dias até o prazo (negativo se atrasado)
  isOverdue: boolean;
  risk?: string; // Campo de risco (opcional, pode ser "-" se não aplicável)
}

/**
 * Calcula os dias restantes até a data de fim (endDate).
 * 
 * @param endDate - Data de fim/prazo (string ISO 'YYYY-MM-DD' ou Date)
 * @returns Número de dias restantes (negativo se atrasado, 0 se é hoje, positivo se futuro)
 * 
 * @example
 * // EndDate no passado
 * calculateDaysRemaining('2024-01-01');
 * // Retorna: -5 (se hoje for 2024-01-06)
 * 
 * @example
 * // EndDate hoje
 * calculateDaysRemaining(new Date().toISOString().split('T')[0]);
 * // Retorna: 0
 * 
 * @example
 * // EndDate no futuro
 * calculateDaysRemaining('2024-12-31');
 * // Retorna: 365 (se hoje for 2024-01-01)
 */
export function calculateDaysRemaining(endDate: string | Date | null | undefined): number {
  if (!endDate) return Infinity; // Sem endDate = não tem prazo definido
  
  // Converte endDate para Date se necessário
  let endDateObj: Date;
  if (typeof endDate === 'string') {
    // Se é string ISO (YYYY-MM-DD), adiciona horário para evitar problemas de timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      endDateObj = new Date(endDate + 'T00:00:00');
    } else {
      endDateObj = new Date(endDate);
    }
  } else {
    endDateObj = endDate;
  }
  
  // Verifica se a data é válida
  if (isNaN(endDateObj.getTime())) return Infinity;
  
  // Compara com hoje (início do dia)
  const today = startOfDay(new Date());
  const endDateDay = startOfDay(endDateObj);
  
  return differenceInDays(endDateDay, today);
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
 * Verifica se uma data de fim (endDate) está dentro da semana vigente (7 dias).
 * 
 * @param endDate - Data de fim/prazo (string ISO 'YYYY-MM-DD' ou Date)
 * @returns true se o endDate está dentro de 7 dias (inclui atrasados)
 * 
 * @example
 * // EndDate em 5 dias
 * isWithinWeek('2024-01-06'); // Se hoje for 2024-01-01
 * // Retorna: true
 * 
 * @example
 * // EndDate em 10 dias
 * isWithinWeek('2024-01-11'); // Se hoje for 2024-01-01
 * // Retorna: false
 * 
 * @example
 * // EndDate atrasado
 * isWithinWeek('2023-12-25'); // Se hoje for 2024-01-01
 * // Retorna: true (inclui atrasados)
 */
export function isWithinWeek(endDate: string | Date | null | undefined): boolean {
  if (!endDate) return false;
  
  const daysRemaining = calculateDaysRemaining(endDate);
  
  // Inclui itens atrasados e itens até 7 dias no futuro
  return daysRemaining <= 7;
}

/**
 * Extrai todos os itens e subitens da semana vigente de um array de iniciativas.
 * 
 * REGRAS:
 * - Apenas itens/subitens não concluídos
 * - EndDate dentro de 7 dias (inclui atrasados)
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
        // Verificar se item não está concluído e tem endDate
        if (item.status !== 'Concluído' && item.endDate) {
          const endDateObj = new Date(item.endDate + 'T00:00:00');
          
          // Verificar se está dentro da semana vigente (inclui atrasados)
          if (endDateObj <= weekEnd) {
            const daysRemaining = calculateDaysRemaining(item.endDate);
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
              endDate: item.endDate,
              daysRemaining,
              isOverdue,
              risk: '-',
            });
          }
        }
        
        // Processar subitens do item
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.forEach(subItem => {
            // Verificar se subitem não está concluído e tem endDate
            if (subItem.status !== 'Concluído' && subItem.endDate) {
              const endDateObj = new Date(subItem.endDate + 'T00:00:00');
              
              // Verificar se está dentro da semana vigente (inclui atrasados)
              if (endDateObj <= weekEnd) {
                const daysRemaining = calculateDaysRemaining(subItem.endDate);
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
                  endDate: subItem.endDate,
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

