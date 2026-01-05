/**
 * ============================================
 * CONFIGURAÇÃO DE PERMISSÕES POR ROLE
 * ============================================
 * 
 * Este arquivo define as regras de acesso por tipo de usuário (userType).
 * 
 * ABORDAGEM:
 * - Regras fixas no código (não no banco) para facilitar manutenção
 * - Permite override via banco se necessário (campo permissions)
 * - Estrutura clara e fácil de entender
 * 
 * REGRAS:
 * - admin: Acesso total a todas as páginas
 * - pmo: Acesso a todas as páginas
 * - head: Acesso apenas a "Painel Estratégico" e "Iniciativas Estratégicas"
 */

import type { UserType } from '@/types';

/**
 * Mapeamento de páginas e suas chaves de permissão
 * 
 * IMPORTANTE: As chaves devem corresponder aos paths das rotas
 * (sem a barra inicial)
 */
export const PAGE_KEYS = {
  DASHBOARD: '', // Página inicial (/)
  STRATEGIC_INITIATIVES: 'strategic-initiatives',
  MEETING_AGENDA: 'meeting-agenda',
  TASKS: 'tasks',
  NOTES: 'notes',
  SETTINGS: 'settings',
} as const;

/**
 * Lista de todas as páginas que requerem permissão
 */
export const ALL_PAGES = Object.values(PAGE_KEYS).filter(key => key !== '');

/**
 * Permissões padrão por tipo de usuário
 * 
 * ESTRUTURA:
 * - Cada userType tem um array de páginas permitidas
 * - Se a página estiver no array, o usuário tem acesso
 * - Se não estiver, não tem acesso
 */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<UserType, string[]> = {
  /**
   * ADMIN: Acesso total
   * Pode acessar todas as páginas
   */
  admin: [
    PAGE_KEYS.DASHBOARD,
    PAGE_KEYS.STRATEGIC_INITIATIVES,
    PAGE_KEYS.MEETING_AGENDA,
    PAGE_KEYS.TASKS,
    PAGE_KEYS.NOTES,
    PAGE_KEYS.SETTINGS,
  ],

  /**
   * PMO: Acesso a todas as páginas
   * Pode acessar todas as páginas (exceto Settings que é só admin)
   */
  pmo: [
    PAGE_KEYS.DASHBOARD,
    PAGE_KEYS.STRATEGIC_INITIATIVES,
    PAGE_KEYS.MEETING_AGENDA,
    PAGE_KEYS.TASKS,
    PAGE_KEYS.NOTES,
  ],

  /**
   * HEAD: Acesso limitado
   * Pode acessar apenas:
   * - Painel Estratégico (Dashboard)
   * - Iniciativas Estratégicas
   */
  head: [
    PAGE_KEYS.DASHBOARD,
    PAGE_KEYS.STRATEGIC_INITIATIVES,
  ],
};

/**
 * Verifica se um userType tem permissão padrão para uma página
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param pageKey - Chave da página (ex: 'strategic-initiatives')
 * @returns true se o usuário tem permissão padrão
 */
export function hasDefaultPermission(userType: UserType, pageKey: string): boolean {
  const allowedPages = DEFAULT_PERMISSIONS_BY_ROLE[userType] || [];
  return allowedPages.includes(pageKey);
}

/**
 * Verifica se um userType pode acessar uma página específica
 * 
 * LÓGICA:
 * 1. Admin sempre tem acesso (exceto se explicitamente negado)
 * 2. Verifica permissão padrão do role baseada no userType
 * 
 * @param userType - Tipo de usuário
 * @param pageKey - Chave da página
 * @returns true se o usuário tem acesso
 */
export function canAccessPage(
  userType: UserType,
  pageKey: string
): boolean {
  // Admin sempre tem acesso (exceto Settings que é verificado separadamente)
  if (userType === 'admin') {
    return true;
  }

  // Usar permissão padrão do role
  return hasDefaultPermission(userType, pageKey);
}

/**
 * Páginas que são exclusivas de admin
 * Mesmo com permissão customizada, apenas admins podem acessar
 */
export const ADMIN_ONLY_PAGES: readonly string[] = [
  PAGE_KEYS.SETTINGS,
] as const;

/**
 * Verifica se uma página é exclusiva de admin
 * 
 * @param pageKey - Chave da página
 * @returns true se a página é exclusiva de admin
 */
export function isAdminOnlyPage(pageKey: string): boolean {
  return ADMIN_ONLY_PAGES.includes(pageKey);
}

/**
 * ============================================
 * PERMISSÕES BASEADAS EM ÁREA
 * ============================================
 * 
 * Funções para verificar permissões específicas de iniciativas
 * baseadas na área do usuário e da iniciativa
 */

/**
 * Verifica se o usuário pode visualizar iniciativas de uma área específica
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param userArea - Área do usuário (ID da BusinessArea)
 * @param initiativeAreaId - ID da área da iniciativa
 * @returns true se o usuário pode visualizar iniciativas da área
 */
export function canViewInitiativeArea(
  userType: UserType,
  userArea: string | undefined,
  initiativeAreaId: string
): boolean {
  // Admin e PMO sempre podem ver todas as áreas
  if (userType === 'admin' || userType === 'pmo') {
    return true;
  }
  
  // Head precisa verificar se é da mesma área (comparar IDs)
  if (userType === 'head') {
    return userArea === initiativeAreaId;
  }
  
  return false;
}

/**
 * Verifica se o usuário pode criar iniciativas
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @returns true se o usuário pode criar iniciativas
 */
export function canCreateInitiative(userType: UserType): boolean {
  // Apenas admin e PMO podem criar iniciativas
  return userType === 'admin' || userType === 'pmo';
}

/**
 * Verifica se o usuário pode editar o campo responsible dos itens
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param userArea - Área do usuário (ID da BusinessArea)
 * @param initiativeAreaId - ID da área da iniciativa
 * @returns true se o usuário pode editar o responsible
 */
export function canEditInitiativeResponsible(
  userType: UserType,
  userArea: string | undefined,
  initiativeAreaId: string
): boolean {
  // Admin e PMO sempre podem editar
  if (userType === 'admin' || userType === 'pmo') {
    return true;
  }
  
  // Head só pode editar da própria área (comparar IDs)
  if (userType === 'head') {
    return userArea === initiativeAreaId;
  }
  
  return false;
}

/**
 * Verifica se o usuário pode editar o status de execução (projeto, item ou subitem)
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param userArea - Área do usuário (ID da BusinessArea)
 * @param initiativeAreaId - ID da área da iniciativa
 * @returns true se o usuário pode editar o status
 */
export function canEditInitiativeStatus(
  userType: UserType,
  userArea: string | undefined,
  initiativeAreaId: string
): boolean {
  // Admin e PMO sempre podem editar
  if (userType === 'admin' || userType === 'pmo') {
    return true;
  }
  
  // Head só pode editar status da própria área (comparar IDs)
  if (userType === 'head') {
    return userArea === initiativeAreaId;
  }
  
  return false;
}

/**
 * Verifica se o usuário pode deletar iniciativas
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @returns true se o usuário pode deletar iniciativas
 */
export function canDeleteInitiative(userType: UserType): boolean {
  // Apenas admin e PMO podem deletar iniciativas
  return userType === 'admin' || userType === 'pmo';
}

/**
 * Verifica se o usuário pode editar o prazo (deadline) de iniciativas, itens ou subitens.
 * 
 * REGRAS:
 * - Admin e PMO: Sempre podem editar prazo
 * - Head: NUNCA pode editar prazo (mesmo da própria área)
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @returns true se o usuário pode editar o prazo, false caso contrário
 * 
 * @example
 * // PMO pode editar
 * canEditDeadline('pmo');
 * // Retorna: true
 * 
 * @example
 * // Head não pode editar
 * canEditDeadline('head');
 * // Retorna: false
 */
export function canEditDeadline(userType: UserType): boolean {
  // Admin e PMO sempre podem editar prazo
  if (userType === 'admin' || userType === 'pmo') {
    return true;
  }
  
  // Head nunca pode editar prazo
  return false;
}

/**
 * Verifica se o usuário pode visualizar um modo específico de visualização.
 * 
 * Esta função verifica permissões baseadas na área efetiva (effectiveAreaId),
 * que pode ser a área selecionada na URL ou a área padrão do usuário.
 * 
 * REGRAS:
 * - Admin e PMO: Sempre podem ver todas as visualizações
 * - Head com effectiveAreaId === userArea: Pode ver todas as visualizações (Dashboard, Tabela/Gantt, Kanban)
 * - Head com effectiveAreaId !== userArea: Apenas Dashboard (limitado)
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param userArea - Área do usuário (ID da BusinessArea)
 * @param effectiveAreaId - ID da área efetiva (selecionada ou padrão)
 * @param viewMode - Modo de visualização (dashboard, table-gantt, kanban)
 * @returns true se o usuário pode visualizar no modo especificado
 * 
 * @example
 * // Head vendo sua própria área (sem filtro ou com filtro de sua área)
 * canViewMode('head', 'area-123', 'area-123', 'table-gantt');
 * // Retorna: true
 * 
 * @example
 * // Head vendo área alheia
 * canViewMode('head', 'area-123', 'area-456', 'table-gantt');
 * // Retorna: false (apenas dashboard permitido)
 * 
 * @example
 * // PMO sempre pode ver tudo
 * canViewMode('pmo', undefined, 'area-456', 'kanban');
 * // Retorna: true
 */
export function canViewMode(
  userType: UserType,
  userArea: string | undefined,
  effectiveAreaId: string | null,
  viewMode: 'dashboard' | 'table-gantt' | 'kanban'
): boolean {
  // Admin e PMO sempre podem ver todas as visualizações
  if (userType === 'admin' || userType === 'pmo') {
    return true;
  }
  
  // Head precisa verificar se a área efetiva é sua própria área
  if (userType === 'head') {
    // Se não há área efetiva, não pode ver (não deveria acontecer)
    if (!effectiveAreaId) {
      return false;
    }
    
    const isOwnArea = userArea === effectiveAreaId;
    
    if (isOwnArea) {
      // Head da própria área: pode ver todas as visualizações
      return true;
    } else {
      // Head de área alheia: apenas Dashboard (limitado)
      return viewMode === 'dashboard';
    }
  }
  
  return false;
}

/**
 * Verifica se o usuário pode visualizar um modo específico de visualização.
 * 
 * @deprecated Use canViewMode() em vez desta função. Esta função mantém compatibilidade
 * mas usa initiativeAreaId em vez de effectiveAreaId, o que não considera área padrão.
 * 
 * @param userType - Tipo de usuário (admin, pmo, head)
 * @param userArea - Área do usuário (ID da BusinessArea)
 * @param initiativeAreaId - ID da área da iniciativa
 * @param viewMode - Modo de visualização (dashboard, table-gantt, kanban)
 * @returns true se o usuário pode visualizar no modo especificado
 */
export function canViewInitiativeViewMode(
  userType: UserType,
  userArea: string | undefined,
  initiativeAreaId: string,
  viewMode: 'dashboard' | 'table-gantt' | 'kanban'
): boolean {
  // Admin e PMO sempre podem ver tudo
  if (userType === 'admin' || userType === 'pmo') {
    return true;
  }
  
  // Head precisa verificar área (comparar IDs)
  if (userType === 'head') {
    const isOwnArea = userArea === initiativeAreaId;
    
    if (isOwnArea) {
      // Head da própria área: pode ver todas as visualizações
      return true;
    } else {
      // Head de outra área: só pode ver dashboard
      return viewMode === 'dashboard';
    }
  }
  
  return false;
}

