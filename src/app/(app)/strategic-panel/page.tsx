

"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Target, Briefcase, ListChecks, TrendingUp, TrendingDown, Minus, CalendarDays, ArrowRight, History } from 'lucide-react';
import { KpiChart } from '@/components/strategic-panel/kpi-chart';
import { useStrategicPanel } from '@/contexts/strategic-panel-context';
import { Skeleton } from '@/components/ui/skeleton';
import type { BusinessArea, KpiSeriesData, Okr } from '@/types';
import { eachMonthOfInterval, startOfMonth, endOfMonth, format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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

const TrendIndicator = ({ okr }: { okr: Okr }) => {
    if (!okr.previousUpdate) {
         return <Minus className="w-4 h-4 text-gray-500" />;
    }
    const progressChange = okr.progress - (okr.previousProgress || 0);

    if (progressChange > 0) {
        return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    if (progressChange < 0) {
        return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
};


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

    const defaultTab = businessAreas[0]?.id || '';

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
                            <TabsTrigger key={area.id} value={area.id} className="py-2">
                                <Icon className="w-4 h-4 mr-2" />
                                {area.name}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                {businessAreas.map((area: BusinessArea) => (
                    <TabsContent key={area.id} value={area.id} className="mt-6">
                        <div className="space-y-6">
                            <section>
                                <h2 className="font-headline text-2xl font-semibold mb-4 text-foreground/90">Indicadores Chave de Performance (KPIs)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {area.kpis.map(kpi => {
                                        
                                        const startDate = kpi.startDate ? parseISO(kpi.startDate) : null;
                                        const endDate = kpi.endDate ? parseISO(kpi.endDate) : null;
                                        
                                        let chartData = [];
                                        if(startDate && endDate && isValid(startDate) && isValid(endDate)) {
                                            const monthNamesInRange = eachMonthOfInterval({ start: startDate, end: endDate })
                                                .map(d => format(d, 'MMM', { locale: ptBR }));
                                                
                                            const monthDataMap = new Map((kpi.series || []).map(s => [s.month, s.Realizado]));
                                            
                                            chartData = monthNamesInRange.map(monthName => ({
                                                month: monthName,
                                                Realizado: monthDataMap.get(monthName) || null
                                            }));
                                        } else {
                                            chartData = kpi.series || [];
                                        }

                                        const chartDataWithTarget = chartData.map(seriesItem => ({
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
                                                <KpiChart data={chartDataWithTarget} unit={kpi.unit} />
                                            </CardContent>
                                        </Card>
                                    )})}
                                </div>
                            </section>
                            
                            <section>
                                 <TooltipProvider>
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
                                                    <div className="flex items-center gap-3">
                                                         <span className={cn(`text-xs font-semibold px-2 py-0.5 rounded-full`, 
                                                            okr.status === 'Em Dia' ? 'bg-blue-100 text-blue-800' :
                                                            okr.status === 'Em Risco' ? 'bg-orange-100 text-orange-800' :
                                                            okr.status === 'Concluído' ? 'bg-green-100 text-green-800' : ''
                                                          )}>{okr.status}</span>
                                                        <div className="flex items-center gap-1 text-sm font-semibold font-body">
                                                            <TrendIndicator okr={okr} />
                                                            <span>{okr.progress}%</span>
                                                            {okr.previousUpdate && (
                                                                <span className="text-xs text-muted-foreground font-normal">
                                                                    (de {okr.previousProgress}% em {format(new Date(okr.previousUpdate), 'dd/MM/yy')})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Progress value={okr.progress} className="h-2" aria-label={okr.name} />
                                                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                                                    {okr.deadline && (
                                                        <div className="flex items-center gap-1">
                                                            <CalendarDays className="w-3 h-3" />
                                                            <span>Prazo: {format(new Date(okr.deadline), 'dd/MM/yyyy', { timeZone: 'UTC' })}</span>
                                                        </div>
                                                    )}
                                                    {okr.lastUpdate && (
                                                        <div className="flex items-center gap-1">
                                                            <History className="w-3 h-3"/>
                                                            <span>Atualizado em: {format(new Date(okr.lastUpdate), 'dd/MM/yyyy')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                                 </TooltipProvider>
                            </section>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
