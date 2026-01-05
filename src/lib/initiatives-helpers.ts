/**
 * ============================================
 * HELPERS PARA INICIATIVAS ESTRATÉGICAS
 * ============================================
 * 
 * Este arquivo contém funções helper reutilizáveis para trabalhar com iniciativas,
 * itens e subitens, incluindo detecção de atraso e validações de status.
 */

import { startOfDay, isBefore } from 'date-fns';
import type { InitiativeStatus, InitiativeItem, SubItem } from '@/types';

/**
 * Verifica se um item está em atraso baseado em seu deadline e status.
 * 
 * LÓGICA:
 * - Item está atrasado se:
 *   1. Tem deadline definido
 *   2. Deadline já passou (é anterior a hoje)
 *   3. Status não é 'Concluído'
 * 
 * @param deadline - Data de prazo (pode ser string ISO, Date ou null)
 * @param status - Status atual do item
 * @returns true se o item está em atraso, false caso contrário
 * 
 * @example
 * // Item atrasado
 * isOverdue('2024-01-01', 'Em execução');
 * // Retorna: true (se hoje for depois de 2024-01-01)
 * 
 * @example
 * // Item concluído não é considerado atrasado
 * isOverdue('2024-01-01', 'Concluído');
 * // Retorna: false
 * 
 * @example
 * // Item sem deadline não é considerado atrasado
 * isOverdue(null, 'Em execução');
 * // Retorna: false
 */
export function isOverdue(
  deadline: string | Date | null | undefined,
  status?: InitiativeStatus
): boolean {
  // Se não tem deadline, não está atrasado
  if (!deadline) return false;
  
  // Se está concluído, não está atrasado
  if (status === 'Concluído') return false;
  
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
  if (isNaN(deadlineDate.getTime())) return false;
  
  // Compara com hoje (início do dia)
  const today = startOfDay(new Date());
  const deadlineDay = startOfDay(deadlineDate);
  
  return isBefore(deadlineDay, today);
}

/**
 * Retorna os status disponíveis baseado se o item está em atraso.
 * 
 * REGRAS:
 * - Se item está atrasado: apenas "Atrasado" e "Concluído" disponíveis
 * - Se item não está atrasado: todos os status normais disponíveis
 * 
 * @param isOverdue - Se o item está em atraso
 * @returns Array de status disponíveis
 * 
 * @example
 * // Item atrasado
 * getAvailableStatuses(true);
 * // Retorna: ['Atrasado', 'Concluído']
 * 
 * @example
 * // Item não atrasado
 * getAvailableStatuses(false);
 * // Retorna: ['Pendente', 'Em execução', 'Concluído', 'Suspenso', 'A Fazer', 'Em Dia', 'Em Risco', 'Atrasado']
 */
export function getAvailableStatuses(isOverdue: boolean): InitiativeStatus[] {
  const allStatuses: InitiativeStatus[] = [
    'Pendente',
    'Em execução',
    'Concluído',
    'Suspenso',
    'A Fazer',
    'Em Dia',
    'Em Risco',
    'Atrasado'
  ];
  
  if (isOverdue) {
    // Se está atrasado, apenas permite mudar para Atrasado ou Concluído
    return ['Atrasado', 'Concluído'];
  }
  
  // Se não está atrasado, todos os status estão disponíveis
  return allStatuses;
}

/**
 * Verifica se um item está em atraso.
 * 
 * @param item - Item a verificar
 * @returns true se o item está em atraso
 */
export function isItemOverdue(item: InitiativeItem): boolean {
  return isOverdue(item.deadline, item.status);
}

/**
 * Verifica se um subitem está em atraso.
 * 
 * @param subItem - Subitem a verificar
 * @returns true se o subitem está em atraso
 */
export function isSubItemOverdue(subItem: SubItem): boolean {
  return isOverdue(subItem.deadline, subItem.status);
}

