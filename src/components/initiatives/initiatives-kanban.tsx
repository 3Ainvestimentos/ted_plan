
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { canEditInitiativeStatus } from "@/lib/permissions-config";
import { isOverdue, getAvailableStatuses } from "@/lib/initiatives-helpers";

/**
 * ============================================
 * COMPONENTE: InitiativesKanban
 * ============================================
 * 
 * Este componente renderiza um quadro Kanban hierárquico para Iniciativas Estratégicas.
 * 
 * NAVEGAÇÃO HIERÁRQUICA:
 * - Nível 1: Iniciativas (raiz)
 * - Nível 2: Itens (ao expandir uma iniciativa)
 * - Nível 3: Subitens (ao expandir um item)
 * 
 * ARQUITETURA MODULAR:
 * - Separação clara entre lógica de agrupamento e renderização
 * - Uso de useMemo para otimização de cálculos
 * - Layout responsivo sem scroll horizontal
 * - Breadcrumb para navegação entre níveis
 * 
 * ESTRUTURA:
 * - Colunas organizadas por status (Pendente, Em execução, Concluído, Suspenso)
 * - Cards arrastáveis entre colunas (drag and drop)
 * - Layout flexível que se adapta à largura da tela
 */

import React, { useMemo, useState } from 'react';
import type { Initiative, InitiativeStatus, InitiativeItem, SubItem } from '@/types';
import { KanbanColumn } from './kanban-column';
import { useInitiatives } from '@/contexts/initiatives-context';
import { KANBAN_COLUMNS_ORDER } from '@/lib/constants';
import { KanbanBreadcrumb } from './kanban-breadcrumb';
import { KanbanItemColumn } from './kanban-item-column';
import { KanbanSubItemColumn } from './kanban-subitem-column';

// ============================================
// INTERFACES E TIPOS
// ============================================

interface InitiativesKanbanProps {
    initiatives: Initiative[];
    onInitiativeClick: (initiative: Initiative) => void;
}

interface Column {
  id: InitiativeStatus;
  title: string;
  tasks: Initiative[];
}

interface ItemColumn {
  id: InitiativeStatus;
  title: string;
  items: InitiativeItem[];
}

interface SubItemColumn {
  id: InitiativeStatus;
  title: string;
  subItems: SubItem[];
}

type KanbanLevel = 'initiatives' | 'items' | 'subitems';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function InitiativesKanban({ initiatives, onInitiativeClick }: InitiativesKanbanProps) {
    const { updateInitiativeStatus, updateItem, updateSubItem } = useInitiatives();
    const { user, getUserArea } = useAuth();
    const { toast } = useToast();

    // Estados de navegação hierárquica
    const [currentLevel, setCurrentLevel] = useState<KanbanLevel>('initiatives');
    const [expandedInitiativeId, setExpandedInitiativeId] = useState<string | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    /**
     * Funções de navegação hierárquica
     */
    const expandInitiative = (initiativeId: string) => {
        setExpandedInitiativeId(initiativeId);
        setCurrentLevel('items');
        setExpandedItemId(null);
    };

    const expandItem = (itemId: string) => {
        setExpandedItemId(itemId);
        setCurrentLevel('subitems');
    };

    const goBack = () => {
        if (currentLevel === 'subitems') {
            setCurrentLevel('items');
            setExpandedItemId(null);
        } else if (currentLevel === 'items') {
            setCurrentLevel('initiatives');
            setExpandedInitiativeId(null);
        }
    };

    const goHome = () => {
        setCurrentLevel('initiatives');
        setExpandedInitiativeId(null);
        setExpandedItemId(null);
    };

    /**
     * Handler para quando uma iniciativa é arrastada e solta em outra coluna
     * 
     * @param taskId - ID da iniciativa que foi movida
     * @param newStatus - Novo status (coluna de destino)
     */
    const handleDropInitiative = (taskId: string, newStatus: InitiativeStatus) => {
        const initiative = initiatives.find(i => i.id === taskId);
        if (!initiative) return;

        // Se o status não mudou, não fazer nada
        if (initiative.status === newStatus) {
            return;
        }

        // Verificar permissão para editar status
        const userType = user?.userType || 'head';
        const userArea = getUserArea();
        const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId);

        if (!canEdit) {
            toast({
                variant: 'destructive',
                title: "Acesso Negado",
                description: "Você não tem permissão para alterar o status desta iniciativa.",
            });
            return;
        }

        // Verificar se está em atraso e validar status permitido
        // IMPORTANTE: Só limita status se realmente estiver em atraso
        const initiativeIsOverdue = isOverdue(initiative.endDate, initiative.status);
        if (initiativeIsOverdue) {
            const availableStatuses = getAvailableStatuses(true);
            if (!availableStatuses.includes(newStatus)) {
                toast({
                    variant: 'destructive',
                    title: "Status não permitido",
                    description: "Iniciativas em atraso só podem ser movidas para 'Atrasado' ou 'Concluído'.",
                });
                return;
            }
        }
        // Se não está em atraso, permite qualquer mudança de status (exceto validações específicas de conclusão)

        updateInitiativeStatus(taskId, newStatus);
    };

    /**
     * Handler para quando um item é arrastado e solto em outra coluna
     * 
     * @param itemId - ID do item que foi movido
     * @param initiativeId - ID da iniciativa pai (vem do item arrastado)
     * @param newStatus - Novo status (coluna de destino)
     */
    const handleDropItem = (itemId: string, initiativeId: string, newStatus: InitiativeStatus) => {
        const initiative = initiatives.find(i => i.id === initiativeId);
        if (!initiative) return;

        // Buscar o item
        const item = initiative.items?.find(p => p.id === itemId);
        if (!item) return;

        // Se o status não mudou, não fazer nada
        if (item.status === newStatus) {
            return;
        }

        // Verificar permissão para editar status (mesma regra da iniciativa)
        const userType = user?.userType || 'head';
        const userArea = getUserArea();
        const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId);

        if (!canEdit) {
            toast({
                variant: 'destructive',
                title: "Acesso Negado",
                description: "Você não tem permissão para alterar o status deste item.",
            });
            return;
        }

        // Verificar se está em atraso e validar status permitido
        // IMPORTANTE: Só limita status se realmente estiver em atraso
        const itemIsOverdue = isOverdue(item.endDate, item.status);
        if (itemIsOverdue) {
            const availableStatuses = getAvailableStatuses(true);
            if (!availableStatuses.includes(newStatus)) {
                toast({
                    variant: 'destructive',
                    title: "Status não permitido",
                    description: "Itens em atraso só podem ser movidos para 'Atrasado' ou 'Concluído'.",
                });
                return;
            }
        }
        // Se não está em atraso, permite qualquer mudança de status (exceto validações específicas de conclusão)

        // Validação: não pode concluir item se nem todos os subitens estão concluídos
        if (newStatus === 'Concluído') {
            if (item.subItems && item.subItems.length > 0) {
                const allSubItemsCompleted = item.subItems.every(subItem => subItem.status === 'Concluído');
                if (!allSubItemsCompleted) {
                    toast({
                        variant: 'destructive',
                        title: "Não é possível concluir",
                        description: "Todos os subitens devem estar concluídos antes de concluir o item.",
                    });
                    return;
                }
            }
        }

        updateItem(initiativeId, itemId, { status: newStatus });
    };

    /**
     * Handler para quando um subitem é arrastado e solto em outra coluna
     * 
     * @param subItemId - ID do subitem que foi movido
     * @param initiativeId - ID da iniciativa pai (vem do item arrastado)
     * @param itemId - ID do item pai (vem do item arrastado)
     * @param newStatus - Novo status (coluna de destino)
     */
    const handleDropSubItem = (subItemId: string, initiativeId: string, itemId: string, newStatus: InitiativeStatus) => {
        const initiative = initiatives.find(i => i.id === initiativeId);
        if (!initiative) return;

        // Buscar o subitem
        const item = initiative.items?.find(p => p.id === itemId);
        if (!item || !item.subItems) return;

        const subItem = item.subItems.find(si => si.id === subItemId);
        if (!subItem) return;

        // Se o status não mudou, não fazer nada
        if (subItem.status === newStatus) {
            return;
        }

        // Verificar permissão para editar status (mesma regra da iniciativa)
        const userType = user?.userType || 'head';
        const userArea = getUserArea();
        const canEdit = canEditInitiativeStatus(userType, userArea, initiative.areaId);

        if (!canEdit) {
            toast({
                variant: 'destructive',
                title: "Acesso Negado",
                description: "Você não tem permissão para alterar o status deste subitem.",
            });
            return;
        }

        // Verificar se está em atraso e validar status permitido
        // IMPORTANTE: Só limita status se realmente estiver em atraso
        const subItemIsOverdue = isOverdue(subItem.endDate, subItem.status);
        if (subItemIsOverdue) {
            const availableStatuses = getAvailableStatuses(true);
            if (!availableStatuses.includes(newStatus)) {
                toast({
                    variant: 'destructive',
                    title: "Status não permitido",
                    description: "Subitens em atraso só podem ser movidos para 'Atrasado' ou 'Concluído'.",
                });
                return;
            }
        }
        // Se não está em atraso, permite qualquer mudança de status

        // Atualizar subitem: passar o novo status diretamente
        // completed será true apenas se status for "Concluído", senão false
        const completed = newStatus === 'Concluído';
        updateSubItem(initiativeId, itemId, subItemId, completed, newStatus);
    };

    /**
     * Agrupa iniciativas por status e cria colunas do Kanban
     * 
     * useMemo otimiza este cálculo para não recalcular a cada render
     * 
     * LÓGICA:
     * 1. Cria um objeto vazio para cada status em KANBAN_COLUMNS_ORDER
     * 2. Itera sobre todas as iniciativas e agrupa por status
     * 3. Retorna array de colunas na ordem definida em KANBAN_COLUMNS_ORDER
     */
    const initiativeColumns: Column[] = useMemo(() => {
        // Inicializa objeto com arrays vazios para cada status
        const groupedTasks = KANBAN_COLUMNS_ORDER.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<InitiativeStatus, Initiative[]>);
        
        // Agrupa iniciativas por status
        initiatives.forEach(task => {
            if (groupedTasks[task.status]) {
                groupedTasks[task.status].push(task);
            }
        });

        // Retorna colunas na ordem definida
        return KANBAN_COLUMNS_ORDER.map(status => ({
            id: status,
            title: status,
            tasks: groupedTasks[status] || [],
        }));

    }, [initiatives]);

    /**
     * Agrupa itens por status e cria colunas do Kanban
     * 
     * @returns Array de colunas com itens agrupados por status
     */
    const itemColumns: ItemColumn[] = useMemo(() => {
        if (!expandedInitiativeId) return [];

        const initiative = initiatives.find(i => i.id === expandedInitiativeId);
        if (!initiative || !initiative.items) return [];

        // Inicializa objeto com arrays vazios para cada status
        const groupedItems = KANBAN_COLUMNS_ORDER.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<InitiativeStatus, InitiativeItem[]>);
        
        // Agrupa itens por status
        initiative.items.forEach(item => {
            if (groupedItems[item.status]) {
                groupedItems[item.status].push(item);
            }
        });

        // Retorna colunas na ordem definida
        return KANBAN_COLUMNS_ORDER.map(status => ({
            id: status,
            title: status,
            items: groupedItems[status] || [],
        }));

    }, [initiatives, expandedInitiativeId]);

    /**
     * Agrupa subitens por status e cria colunas do Kanban
     * 
     * @returns Array de colunas com subitens agrupados por status
     */
    const subItemColumns: SubItemColumn[] = useMemo(() => {
        if (!expandedInitiativeId || !expandedItemId) return [];

        const initiative = initiatives.find(i => i.id === expandedInitiativeId);
        if (!initiative || !initiative.items) return [];

        const item = initiative.items.find(p => p.id === expandedItemId);
        if (!item || !item.subItems) return [];

        // Inicializa objeto com arrays vazios para cada status
        const groupedSubItems = KANBAN_COLUMNS_ORDER.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<InitiativeStatus, SubItem[]>);
        
        // Agrupa subitens por status
        item.subItems.forEach(subItem => {
            if (groupedSubItems[subItem.status]) {
                groupedSubItems[subItem.status].push(subItem);
            }
        });

        // Retorna colunas na ordem definida
        return KANBAN_COLUMNS_ORDER.map(status => ({
            id: status,
            title: status,
            subItems: groupedSubItems[status] || [],
        }));

    }, [initiatives, expandedInitiativeId, expandedItemId]);

    // Obter dados para breadcrumb
    const currentInitiative = expandedInitiativeId 
        ? initiatives.find(i => i.id === expandedInitiativeId)
        : null;
    
    const currentItem = expandedInitiativeId && expandedItemId && currentInitiative
        ? currentInitiative.items?.find(p => p.id === expandedItemId)
        : null;

    /**
     * Renderiza colunas para itens
     */
    const renderItemColumns = () => {
        if (!expandedInitiativeId) return null;
        
        return (
            <div className="flex gap-4 h-full w-full">
                {itemColumns.map((column) => (
                    <KanbanItemColumn
                        key={column.id}
                        column={column}
                        initiativeId={expandedInitiativeId}
                        onDropItem={handleDropItem}
                        onItemClick={() => onInitiativeClick(currentInitiative!)}
                        onItemExpand={expandItem}
                    />
                ))}
            </div>
        );
    };

    /**
     * Renderiza colunas para subitens
     */
    const renderSubItemColumns = () => {
        if (!expandedInitiativeId || !expandedItemId) return null;
        
        return (
            <div className="flex gap-4 h-full w-full">
                {subItemColumns.map((column) => (
                    <KanbanSubItemColumn
                        key={column.id}
                        column={column}
                        initiativeId={expandedInitiativeId}
                        itemId={expandedItemId}
                        onDropSubItem={handleDropSubItem}
                        onSubItemClick={() => onInitiativeClick(currentInitiative!)}
                    />
                ))}
            </div>
        );
    };

    return (
        /**
         * Container principal sem overflow-x-auto
         * 
         * ESTRATÉGIA PARA SEM SCROLL HORIZONTAL:
         * 1. Removido overflow-x-auto
         * 2. Usado flex-grow para ocupar espaço disponível
         * 3. Colunas internas usam flex-1 para distribuição igual
         */
        <div className="flex-grow w-full pb-4">
            {/* Breadcrumb de navegação */}
            <KanbanBreadcrumb
                currentLevel={currentLevel}
                initiativeTitle={currentInitiative?.title}
                itemTitle={currentItem?.title}
                onGoBack={goBack}
                onGoHome={goHome}
            />

            {/* Renderização condicional por nível */}
            {currentLevel === 'initiatives' && (
                <div className="flex gap-4 h-full w-full">
                    {initiativeColumns.map((column) => (
                        <KanbanColumn 
                            key={column.id} 
                            column={column} 
                            onDropTask={handleDropInitiative} 
                            onInitiativeClick={onInitiativeClick}
                            onInitiativeExpand={expandInitiative}
                        />
                    ))}
                </div>
            )}

            {currentLevel === 'items' && renderItemColumns()}
            {currentLevel === 'subitems' && renderSubItemColumns()}
        </div>
    );
}
