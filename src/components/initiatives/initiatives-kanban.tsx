
"use client";

import React, { useMemo } from 'react';
import type { Initiative, InitiativeStatus } from '@/types';
import { KanbanColumn } from './kanban-column';
import { useInitiatives } from '@/contexts/initiatives-context';
import { KANBAN_COLUMNS_ORDER } from '@/lib/constants';

interface InitiativesKanbanProps {
    initiatives: Initiative[];
    onInitiativeClick: (initiative: Initiative) => void;
}

interface Column {
  id: InitiativeStatus;
  title: string;
  tasks: Initiative[];
}

export function InitiativesKanban({ initiatives, onInitiativeClick }: InitiativesKanbanProps) {
    const { updateInitiativeStatus } = useInitiatives();

    const handleDropTask = (taskId: string, newStatus: InitiativeStatus) => {
        updateInitiativeStatus(taskId, newStatus);
    };

    const columns: Column[] = useMemo(() => {
        const groupedTasks: Record<InitiativeStatus, Initiative[]> = {
            'A Fazer': [],
            'Em Dia': [],
            'Em Risco': [],
            'Atrasado': [],
            'Concluído': [],
        };
        
        initiatives.forEach(task => {
            if (groupedTasks[task.status]) {
                groupedTasks[task.status].push(task);
            }
        });
        
        const combinedInProgress = [...groupedTasks['Em Dia'], ...groupedTasks['Em Risco'], ...groupedTasks['Atrasado']];

        const displayColumns: Column[] = [
            { id: 'A Fazer', title: 'A Fazer', tasks: groupedTasks['A Fazer'] },
            { id: 'Em Dia', title: 'Em Progresso', tasks: combinedInProgress },
            { id: 'Concluído', title: 'Concluído', tasks: groupedTasks['Concluído'] }
        ];

        return displayColumns;

    }, [initiatives]);


    return (
        <div className="flex-grow overflow-x-auto pb-4">
            <div className="flex gap-4 h-full">
                {columns.map((column) => (
                    <KanbanColumn key={column.id} column={column} onDropTask={handleDropTask} onInitiativeClick={onInitiativeClick} />
                ))}
            </div>
        </div>
    );
}
