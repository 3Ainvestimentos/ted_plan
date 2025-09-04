
"use client";

import type { Collaborator } from '@/types';
import { Building2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CareerTimelineProps {
    collaborator: Collaborator;
}

export function CareerTimeline({ collaborator }: CareerTimelineProps) {
    const combinedHistory = [
        ...(collaborator.positionHistory?.map(p => ({ ...p, type: 'position' })) || []),
        ...(collaborator.remunerationHistory?.map(r => ({ ...r, type: 'remuneration' })) || []),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (combinedHistory.length === 0) {
        return <p className="text-muted-foreground text-center py-4">Nenhum histórico de carreira para este colaborador.</p>;
    }

    return (
        <div className="relative pl-6 after:absolute after:inset-y-0 after:w-px after:bg-border after:left-0">
            {combinedHistory.map((event, index) => (
                <div key={index} className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 relative mb-4">
                    <div className="flex items-center justify-center -translate-x-[calc(50%+1px)] bg-background">
                         <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-4 ring-background">
                            {event.type === 'position' ? <Building2 className="w-4 h-4"/> : <TrendingUp className="w-4 h-4"/>}
                         </div>
                    </div>
                    <div className="pt-1.5">
                        <p className="font-semibold text-foreground">
                            {event.type === 'position' ? `Promoção: ${event.position}` : `Ajuste Salarial: R$ ${event.value.toLocaleString('pt-BR')}`}
                        </p>
                        <time className="text-sm text-muted-foreground">
                            {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR, timeZone: 'UTC' })}
                        </time>
                    </div>
                </div>
            ))}
        </div>
    );
}
