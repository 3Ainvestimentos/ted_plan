
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Target, Briefcase, Users, BadgeCheck, ListChecks, TrendingUp } from 'lucide-react';
import { KpiChart } from '@/components/strategic-panel/kpi-chart';

const businessAreas = [
  {
    name: 'Financeiro',
    icon: DollarSign,
    kpis: [
      { 
        name: 'Receita (YTD)', 
        data: [
          { name: 'Previsto', value: 6.1, label: "R$6.1M" },
          { name: 'Realizado', value: 5.2, label: "R$5.2M" },
          { name: 'Projetado', value: 6.3, label: "R$6.3M" }
        ],
      },
      { 
        name: 'Margem de Lucro', 
        data: [
          { name: 'Previsto', value: 25, label: "25%" },
          { name: 'Realizado', value: 23, label: "23%" },
          { name: 'Projetado', value: 24, label: "24%" }
        ],
      },
       { 
        name: 'Custos Operacionais', 
        data: [
          { name: 'Previsto', value: 1.8, label: "R$1.8M" },
          { name: 'Realizado', value: 1.9, label: "R$1.9M" },
          { name: 'Projetado', value: 1.85, label: "R$1.85M" }
        ],
      },
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
      { 
        name: 'Novos Leads (Mês)', 
        data: [
          { name: 'Previsto', value: 1400, label: "1.400" },
          { name: 'Realizado', value: 1240, label: "1.240" },
          { name: 'Projetado', value: 1500, label: "1.500" }
        ],
      },
      { 
        name: 'Taxa de Conversão', 
        data: [
          { name: 'Previsto', value: 5, label: "5.0%" },
          { name: 'Realizado', value: 4.5, label: "4.5%" },
          { name: 'Projetado', value: 5.2, label: "5.2%" }
        ],
      },
      { 
        name: 'Custo por Aquisição (CAC)', 
        data: [
          { name: 'Previsto', value: 120, label: "R$120" },
          { name: 'Realizado', value: 125, label: "R$125" },
          { name: 'Projetado', value: 118, label: "R$118" }
        ],
      },
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
      { 
        name: 'Satisfação do Colaborador (eNPS)', 
        data: [
          { name: 'Previsto', value: 50, label: "50" },
          { name: 'Realizado', value: 58, label: "58" },
          { name: 'Projetado', value: 60, label: "60" }
        ],
      },
      { 
        name: 'Turnover (Anual)', 
        data: [
          { name: 'Previsto', value: 15, label: "< 15%" },
          { name: 'Realizado', value: 12, label: "12%" },
          { name: 'Projetado', value: 11, label: "11%" }
        ],
      },
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
                                        <Card key={kpi.name} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                   <TrendingUp className="w-5 h-5 text-primary" />
                                                    {kpi.name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <KpiChart data={kpi.data} />
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
