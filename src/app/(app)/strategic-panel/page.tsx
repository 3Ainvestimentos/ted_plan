
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Target, Briefcase, Users, BadgeCheck, ListChecks, TrendingUp } from 'lucide-react';
import { KpiChart } from '@/components/strategic-panel/kpi-chart';

const kpiSeriesData = [
  { month: 'Jan', Previsto: 100, Realizado: 90, Projetado: 95 },
  { month: 'Fev', Previsto: 110, Realizado: 105, Projetado: 108 },
  { month: 'Mar', Previsto: 120, Realizado: 115, Projetado: 118 },
  { month: 'Abr', Previsto: 130, Realizado: 135, Projetado: 132 },
  { month: 'Mai', Previsto: 140, Realizado: 145, Projetado: 142 },
  { month: 'Jun', Previsto: 150, Realizado: 155, Projetado: 158 },
];


const businessAreas = [
  {
    name: 'Financeiro',
    icon: DollarSign,
    kpis: [
      { name: 'Receita (YTD)', series: kpiSeriesData.map(d => ({...d, Previsto: d.Previsto * 50000, Realizado: d.Realizado * 48000, Projetado: d.Projetado * 49000})), unit: 'R$' },
      { name: 'Margem de Lucro', series: kpiSeriesData.map(d => ({...d, Previsto: 25, Realizado: 23 + (d.Realizado - 90)/20, Projetado: 24 + (d.Projetado - 95)/20})), unit: '%' },
      { name: 'Custos Operacionais', series: kpiSeriesData.map(d => ({...d, Previsto: d.Previsto * 15000, Realizado: d.Realizado * 15500, Projetado: d.Projetado * 15200})), unit: 'R$' },
    ],
    okrs: [
      { name: 'Reduzir custos operacionais em 10%', progress: 60, status: 'Em Dia' },
      { name: 'Aumentar eficiência da cobrança em 15%', progress: 75, status: 'Em Dia' },
    ]
  },
  {
    name: 'Marketing & Vendas',
    icon: Target,
    kpis: [
        { name: 'Novos Leads (Mês)', series: kpiSeriesData.map(d => ({...d, Previsto: d.Previsto * 12, Realizado: d.Realizado * 11, Projetado: d.Projetado * 11.5})), unit: '' },
        { name: 'Taxa de Conversão', series: kpiSeriesData.map(d => ({...d, Previsto: 5, Realizado: 4.5 + (d.Realizado - 90)/25, Projetado: 4.8 + (d.Projetado - 95)/25})), unit: '%' },
        { name: 'Custo por Aquisição (CAC)', series: kpiSeriesData.map(d => ({...d, Previsto: 120, Realizado: 125 - (d.Realizado - 90)/5, Projetado: 118 - (d.Projetado - 95)/5})), unit: 'R$' },
    ],
    okrs: [
      { name: 'Expandir presença em 2 novos mercados LATAM', progress: 45, status: 'Em Risco' },
      { name: 'Aumentar o engajamento nas redes sociais em 20%', progress: 65, status: 'Em Dia' },
    ]
  },
  {
    name: 'Operações & RH',
    icon: Briefcase,
    kpis: [
      { name: 'Satisfação do Colaborador (eNPS)', series: kpiSeriesData.map(d => ({...d, Previsto: 50, Realizado: 48 + (d.Realizado - 90)/5, Projetado: 52 + (d.Projetado - 95)/5})), unit: 'pts' },
      { name: 'Turnover (Anual)', series: kpiSeriesData.map(d => ({...d, Previsto: 15, Realizado: 16 - (d.Realizado - 90)/10, Projetado: 14 - (d.Projetado - 95)/10})), unit: '%' },
    ],
    okrs: [
      { name: 'Implementar novo sistema de avaliação de desempenho', progress: 90, status: 'Concluído' },
      { name: 'Digitalizar 100% dos processos de onboarding', progress: 82, status: 'Em Dia' },
    ]
  }
];

export default function StrategicPanelPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Painel Estratégico"
                description="Visão consolidada dos OKRs e KPIs por área de negócio."
            />
            
            <Tabs defaultValue="Financeiro" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
                    {businessAreas.map((area) => (
                        <TabsTrigger key={area.name} value={area.name} className="py-2">
                             <area.icon className="w-4 h-4 mr-2" />
                            {area.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {businessAreas.map((area) => (
                    <TabsContent key={area.name} value={area.name} className="mt-6">
                        <div className="space-y-6">
                            <section>
                                <h2 className="font-headline text-2xl font-semibold mb-4 text-foreground/90">Indicadores Chave de Performance (KPIs)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {area.kpis.map(kpi => (
                                        <Card key={kpi.name} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="font-headline text-lg flex items-center gap-2">
                                                   <TrendingUp className="w-5 h-5 text-primary" />
                                                    {kpi.name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <KpiChart data={kpi.series} unit={kpi.unit} />
                                            </CardContent>
                                        </Card>
                                    ))}
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
                                            <div key={okr.name}>
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
