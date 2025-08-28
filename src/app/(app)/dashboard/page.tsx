

"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Building } from 'lucide-react';
import { KpiChart } from '@/components/strategic-panel/kpi-chart';
import { eachMonthOfInterval, format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';


// Mock data for strategic panel
const businessAreas = [
  {
    name: 'Financeiro',
    icon: TrendingUp,
    kpis: [
      { id: 'kpi1', name: 'Receita (YTD)', value: 'R$5.2M', progress: 85, target: 'R$6.1M', unit: 'R$', targetValue: 6100000, startDate: '2024-01-01', endDate: '2024-12-31', series: [ { month: 'jan', Realizado: 450000}, { month: 'fev', Realizado: 550000}, { month: 'mar', Realizado: 650000} ] },
      { id: 'kpi2', name: 'Margem de Lucro', value: '23%', progress: 92, target: '25%', unit: '%', targetValue: 25, startDate: '2024-01-01', endDate: '2024-12-31', series: [ { month: 'jan', Realizado: 22}, { month: 'fev', Realizado: 22.5}, { month: 'mar', Realizado: 23} ] },
    ],
    okrs: [
      { name: 'Reduzir custos operacionais em 10%', progress: 60 },
      { name: 'Aumentar eficiência da cobrança', progress: 75 },
    ]
  },
  {
    name: 'Marketing & Vendas',
    icon: Target,
    kpis: [
        { id: 'kpi3', name: 'Novos Leads (Mês)', value: '1,240', progress: 88, target: '1,400', unit: 'unidades', targetValue: 1400, startDate: '2024-01-01', endDate: '2024-12-31', series: [ { month: 'jan', Realizado: 1100}, { month: 'fev', Realizado: 1350}, { month: 'mar', Realizado: 1240} ] },
        { id: 'kpi4', name: 'Taxa de Conversão', value: '4.5%', progress: 90, target: '5%', unit: '%', targetValue: 5, startDate: '2024-01-01', endDate: '2024-12-31', series: [ { month: 'jan', Realizado: 4.2}, { month: 'fev', Realizado: 4.8}, { month: 'mar', Realizado: 4.5} ] },
    ],
    okrs: [
        { name: 'Expandir presença em 2 novos mercados', progress: 45 },
        { name: 'Aumentar o engajamento nas redes sociais em 20%', progress: 65 },
    ]
  },
  {
    name: 'Operações & RH',
    icon: Building,
    kpis: [
        { id: 'kpi5', name: 'Satisfação do Colaborador (CSAT)', value: '8.8/10', progress: 88, target: '9/10', unit: 'unidades', targetValue: 9, startDate: '2024-01-01', endDate: '2024-12-31', series: [ { month: 'jan', Realizado: 8.5}, { month: 'fev', Realizado: 8.6}, { month: 'mar', Realizado: 8.8} ] },
        { id: 'kpi6', name: 'Turnover (Anual)', value: '12%', progress: 80, target: '< 15%', unit: '%', targetValue: 15, startDate: '2024-01-01', endDate: '2024-12-31', series: [ { month: 'jan', Realizado: 12.5}, { month: 'fev', Realizado: 12.2}, { month: 'mar', Realizado: 12} ] },
    ],
    okrs: [
        { name: 'Implementar novo sistema de avaliação de desempenho', progress: 90 },
        { name: 'Digitalizar 100% dos processos de onboarding', progress: 82 },
    ]
  }
];

export default function StrategicPanelPage() {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Painel Estratégico"
                description="Visão geral dos OKRs e KPIs chave agrupados por área de negócio."
            />
            
            <div className="space-y-10">
                {businessAreas.map((area) => {
                    const AreaIcon = area.icon;
                    return (
                        <section key={area.name}>
                            <div className="flex items-center gap-3 mb-4">
                                <AreaIcon className="h-6 w-6 text-primary" />
                                <h2 className="font-headline text-2xl font-semibold">{area.name}</h2>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="shadow-lg">
                                    <CardHeader>
                                        <CardTitle>Resultados-Chave (OKRs)</CardTitle>
                                        <CardDescription>Progresso dos objetivos estratégicos da área.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {area.okrs.map(okr => (
                                            <div key={okr.name}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-sm font-medium text-foreground/90">{okr.name}</p>
                                                    <p className="text-sm font-semibold">{okr.progress}%</p>
                                                </div>
                                                <Progress value={okr.progress} aria-label={okr.name} />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                                <Card className="shadow-lg">
                                    <CardHeader>
                                        <CardTitle>Indicadores (KPIs)</CardTitle>
                                        <CardDescription>Métricas de performance para acompanhamento contínuo.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
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
                                         <div key={kpi.name}>
                                            <p className="text-sm font-semibold text-foreground/90 mb-2">{kpi.name}</p>
                                             <KpiChart data={chartDataWithTarget} unit={kpi.unit} />
                                         </div>
                                       )}
                                       )}
                                    </CardContent>
                                </Card>
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    );
}
