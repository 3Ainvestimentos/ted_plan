
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { BarChart } from 'lucide-react';
import { useInitiatives } from '@/contexts/initiatives-context';
import { ProjectStatusChart } from '@/components/dashboard/project-status-chart';

export default function DashboardPage() {
    const { initiatives } = useInitiatives();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Página de Exemplo"
                description="Esta é uma descrição para a página de exemplo."
            />
            
            <section className="grid grid-cols-1 gap-6">
                <Card className="flex flex-col w-full shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-headline">Card de Exemplo</CardTitle>
                        <CardDescription>Este é um card de exemplo para conteúdo variado.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px]">
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <BarChart className="h-10 w-10 mb-4" />
                            <p>O conteúdo do seu card pode ser inserido aqui.</p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
