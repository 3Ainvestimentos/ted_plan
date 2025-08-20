

"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Building } from 'lucide-react';

// Mock data for strategic panel
const businessAreas = [
  {
    name: 'Financeiro',
    icon: TrendingUp,
    kpis: [
      { name: 'Receita (YTD)', value: 'R$5.2M', progress: 85, target: 'R$6.1M' },
      { name: 'Margem de Lucro', value: '23%', progress: 92, target: '25%' },
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
        { name: 'Novos Leads (Mês)', value: '1,240', progress: 88, target: '1,400' },
        { name: 'Taxa de Conversão', value: '4.5%', progress: 90, target: '5%' },
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
        { name: 'Satisfação do Colaborador (CSAT)', value: '8.8/10', progress: 88, target: '9/10' },
        { name: 'Turnover (Anual)', value: '12%', progress: 80, target: '< 15%' },
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
                                       {area.kpis.map(kpi => (
                                         <div key={kpi.name}>
                                            <div className="flex justify-between items-baseline">
                                                <p className="text-sm text-foreground/90">{kpi.name}</p>
                                                <p className="text-xl font-bold text-primary">{kpi.value}</p>
                                            </div>
                                            <div className="flex justify-between items-baseline mt-1">
                                                <p className="text-xs text-muted-foreground">Meta: {kpi.target}</p>
                                                <p className="text-xs text-muted-foreground">Progresso: {kpi.progress}%</p>
                                            </div>
                                            <Progress value={kpi.progress} className="h-2 mt-1" aria-label={kpi.name} />
                                         </div>
                                       ))}
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
