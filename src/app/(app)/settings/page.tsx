
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart2, GanttChartSquare, HardHat, Users } from 'lucide-react';
import Link from 'next/link';

const adminModules = [
    {
        title: "Gerenciamento de Colaboradores",
        description: "Adicione, edite ou remova usuários e importe em massa.",
        href: "/settings/collaborators",
        icon: Users
    },
    {
        title: "Permissões de Acesso",
        description: "Controle quais seções cada colaborador pode visualizar.",
        href: "/settings/permissions",
        icon: GanttChartSquare
    },
    {
        title: "Conteúdo e Metas",
        description: "Configure áreas de negócio, OKRs e KPIs do painel.",
        href: "/settings/content",
        icon: BarChart2
    },
    {
        title: "Painel de Auditoria",
        description: "Monitore logs de acesso e visualizações de conteúdo.",
        href: "/settings/audit",
        icon: BarChart2
    },
    {
        title: "Modo Manutenção",
        description: "Suspenda o acesso à plataforma durante atualizações.",
        href: "/settings/maintenance",
        icon: HardHat
    }
];

export default function SettingsHubPage() {
  return (
    <div className="space-y-6">
       <PageHeader
            title="Administração do Sistema"
            description="Gerencie os módulos e configurações da plataforma."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminModules.map((mod) => {
                const ModuleIcon = mod.icon;
                return (
                    <Link href={mod.href} key={mod.title} className="group block">
                        <Card className="h-full shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col justify-between">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                     <ModuleIcon className="h-8 w-8 text-primary" />
                                    <CardTitle className="font-headline text-lg">{mod.title}</CardTitle>
                                </div>
                                <CardDescription className="pt-2">{mod.description}</CardDescription>
                            </CardHeader>
                            <div className="p-6 pt-0 mt-auto">
                                <div className="flex items-center text-sm font-medium text-primary group-hover:underline">
                                    Acessar Módulo <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Card>
                    </Link>
                )
            })}
        </div>
    </div>
  );
}
