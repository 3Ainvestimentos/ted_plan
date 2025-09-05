

"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GanttChartSquare, BarChart2, HardHat, PlusCircle, Upload, Briefcase } from 'lucide-react';
import { PersonnelDataManager } from '@/components/settings/personnel-data-manager';
import { PermissionsManager } from '@/components/settings/permissions-manager';
import { BusinessAreasManager } from '@/components/settings/business-areas-manager';
import { MaintenanceModeManager } from '@/components/settings/maintenance-mode-manager';
import { UserAuditSummary } from '@/components/settings/user-audit-summary';


function PermissionsTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <PermissionsManager />
        </Card>
    );
}

function MaintenanceModeTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <MaintenanceModeManager />
        </Card>
    );
}

function PersonnelDataTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <PersonnelDataManager />
        </Card>
    );
}

function ContentGoalsTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <CardContent className="pt-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium">Conteúdo e Metas Estratégicas</h3>
                    <p className="text-muted-foreground text-sm">Gerencie as áreas de negócio, OKRs e KPIs que alimentam o Painel Estratégico.</p>
                </div>
                <BusinessAreasManager />
            </CardContent>
        </Card>
    )
}

function AuditLogTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <CardContent className="pt-6 space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Relatório de Auditoria</h3>
                    <p className="text-muted-foreground text-sm">Monitore a atividade e o engajamento dos usuários na plataforma.</p>
                </div>
                <UserAuditSummary />
            </CardContent>
        </Card>
    );
}



const adminModules = [
    {
        name: "content",
        title: "Conteúdo e Metas",
        icon: BarChart2,
        component: <ContentGoalsTabContent />,
        disabled: false,
    },
    {
        name: "permissions",
        title: "Permissões de Acesso",
        icon: GanttChartSquare,
        component: <PermissionsTabContent />,
        disabled: false,
    },
    {
        name: "team",
        title: "Equipe",
        icon: Users,
        component: <PersonnelDataTabContent />,
        disabled: false,
    },
    {
        name: "maintenance",
        title: "Modo Manutenção",
        icon: HardHat,
        component: <MaintenanceModeTabContent />,
        disabled: false,
    }
];

export default function SettingsHubPage() {
  return (
    <div className="space-y-6">
       <PageHeader
            title="Administração do Sistema"
            description="Gerencie os módulos e configurações da plataforma em um local central."
        />

        <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 md:grid-cols-4 h-auto">
                 {adminModules.map((mod) => (
                    <TabsTrigger key={mod.name} value={mod.name} className="py-2 flex-col h-auto" disabled={mod.disabled}>
                        <span>{mod.title}</span>
                    </TabsTrigger>
                 ))}
            </TabsList>

            {adminModules.map((mod) => (
                <TabsContent key={mod.name} value={mod.name}>
                    {mod.component}
                </TabsContent>
            ))}
        </Tabs>
    </div>
  );
}
