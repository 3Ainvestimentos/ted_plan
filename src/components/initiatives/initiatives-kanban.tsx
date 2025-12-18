
"use client";

/**
 * ============================================
 * COMPONENTE: InitiativesKanban
 * ============================================
 * 
 * Este componente renderiza um quadro Kanban para Iniciativas Estratégicas.
 * 
 * ARQUITETURA MODULAR:
 * - Separação clara entre lógica de agrupamento e renderização
 * - Uso de useMemo para otimização de cálculos
 * - Layout responsivo sem scroll horizontal
 * 
 * ESTRUTURA:
 * - Colunas organizadas por status (Pendente, Em execução, Concluído, Suspenso)
 * - Cards arrastáveis entre colunas (drag and drop)
 * - Layout flexível que se adapta à largura da tela
 */

import React, { useMemo } from 'react';
import type { Initiative, InitiativeStatus } from '@/types';
import { KanbanColumn } from './kanban-column';
import { useInitiatives } from '@/contexts/initiatives-context';
import { KANBAN_COLUMNS_ORDER } from '@/lib/constants';

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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function InitiativesKanban({ initiatives, onInitiativeClick }: InitiativesKanbanProps) {
    const { updateInitiativeStatus } = useInitiatives();

    /**
     * Handler para quando uma tarefa é arrastada e solta em outra coluna
     * 
     * @param taskId - ID da iniciativa que foi movida
     * @param newStatus - Novo status (coluna de destino)
     */
    const handleDropTask = (taskId: string, newStatus: InitiativeStatus) => {
        updateInitiativeStatus(taskId, newStatus);
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
    const columns: Column[] = useMemo(() => {
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
            <div className="flex gap-4 h-full w-full">
                {columns.map((column) => (
                    <KanbanColumn 
                        key={column.id} 
                        column={column} 
                        onDropTask={handleDropTask} 
                        onInitiativeClick={onInitiativeClick}
                    />
                ))}
            </div>
        </div>
    );
}
