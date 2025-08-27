
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Target, Briefcase, ListChecks, TrendingUp } from 'lucide-react';
import { KpiChart } from '@/components/strategic-panel/kpi-chart';
import { useStrategicPanel } from '@/contexts/strategic-panel-context';
import { Skeleton } from '@/components/ui/skeleton';
import type { BusinessArea, KpiSeriesData } from '@/types';
import { eachMonthOfInterval, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Map icon names from Firestore to Lucide components
const iconMap: { [key: string]: React.ElementType } = {
    DollarSign,
    Target,
    Briefcase,
};

function PanelSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-10 w-full sm:w-1/2" />
            <div className="space-y-6">
                 <Skeleton className="h-6 w-1/3 mb-4" />
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                 </div>
                 <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
}

export default function StrategicPanelPage() {
    const { businessAreas, isLoading } = useStrategicPanel();

    if (isLoading) {
        return <PanelSkeleton />;
    }

    if (!businessAreas.length) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Painel Estratégico"
                    description="Visão consolidada dos OKRs e KPIs por área de negócio."
                />
                 <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Nenhuma área de negócio encontrada.</p>
                </div>
            </div>
        )
    }

    const defaultTab = businessAreas[0]?.name || '';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Painel Estratégico"
                description="Visão consolidada dos OKRs e KPIs por área de negócio."
            />
            
            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
                    {businessAreas.map((area: BusinessArea) => {
                        const Icon = area.icon ? iconMap[area.icon] : Briefcase;
                        return (
                            <TabsTrigger key={area.name} value={area.name} className="py-2">
                                <Icon className="w-4 h-4 mr-2" />
                                {area.name}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                {businessAreas.map((area: BusinessArea) => (
                    <TabsContent key={area.name} value={area.name} className="mt-6">
                        <div className="space-y-6">
                            <section>
                                <h2 className="font-headline text-2xl font-semibold mb-4 text-foreground/90">Indicadores Chave de Performance (KPIs)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {area.kpis.map(kpi => {
                                        const chartData = kpi.series.map(seriesItem => ({
                                            ...seriesItem,
                                            Meta: kpi.targetValue,
                                        }));

                                        return (
                                        <Card key={kpi.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="font-headline text-lg flex items-center gap-2">
                                                   <TrendingUp className="w-5 h-5 text-primary" />
                                                    {kpi.name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <KpiChart data={chartData} unit={kpi.unit} />
                                            </CardContent>
                                        </Card>
                                    )})}
                                </div>
                            </section>
                            
                            <section>
                                <Card className="shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <ListChecks className="w-5 h-5 text-primary" />
                                            Resultados-Chave (OKRs)
                                        </CardTitle>
                                        <CardDescription>Progresso dos objetivos estratégicos da área.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {area.okrs.map(okr => (
                                            <div key={okr.id}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-sm font-body font-medium text-foreground/90">{okr.name}</p>
                                                    <div className="flex items-center gap-2">
                                                         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                            okr.status === 'Em Dia' ? 'bg-blue-100 text-blue-800' :
                                                            okr.status === 'Em Risco' ? 'bg-orange-100 text-orange-800' :
                                                            okr.status === 'Concluído' ? 'bg-green-100 text-green-800' : ''
                                                          }`}>{okr.status}</span>
                                                        <p className="text-sm font-semibold font-body">{okr.progress}%</p>
                                                    </div>
                                                </div>
                                                <Progress value={okr.progress} className="h-2" aria-label={okr.name} />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </section>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
