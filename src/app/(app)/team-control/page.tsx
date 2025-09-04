
"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useTeamControl } from '@/contexts/team-control-context';
import { CollaboratorSelectionTable } from '@/components/team-control/collaborator-selection-table';
import { RemunerationChart } from '@/components/team-control/remuneration-chart';
import { CareerTimeline } from '@/components/team-control/career-timeline';
import type { Collaborator } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function TeamControlPage() {
    const { collaborators, isLoading } = useTeamControl();
    const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Controle de Equipe"
                    description="Visualize a evolução de cargos e remunerações."
                />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Controle de Equipe"
                description="Selecione um ou mais colaboradores para visualizar a evolução de cargos e remunerações."
            />
            
            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Seleção de Colaboradores</h3>
                    <CollaboratorSelectionTable 
                        collaborators={collaborators}
                        onSelectionChange={setSelectedCollaborators}
                    />
                </CardContent>
            </Card>

            {selectedCollaborators.length > 0 && (
                <div className="space-y-8">
                    <Card>
                        <CardContent className="pt-6">
                             <h3 className="text-lg font-medium mb-4">Gráfico de Remuneração</h3>
                             <RemunerationChart collaborators={selectedCollaborators} />
                        </CardContent>
                    </Card>

                     <Card>
                        <CardContent className="pt-6">
                            <h3 className="text-lg font-medium mb-4">Linha do Tempo de Carreira</h3>
                             <div className="space-y-6">
                                {selectedCollaborators.map((collab, index) => (
                                    <div key={collab.id}>
                                        <h4 className="font-semibold">{collab.name}</h4>
                                        <CareerTimeline collaborator={collab} />
                                        {index < selectedCollaborators.length - 1 && <Separator className="mt-6"/>}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
