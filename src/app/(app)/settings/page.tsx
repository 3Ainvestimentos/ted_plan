
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Users, HardHat } from 'lucide-react';
import { MaintenanceModeManager } from '@/components/settings/maintenance-mode-manager';
import { PermissionsManager } from '@/components/settings/permissions-manager';


function MaintenanceModeTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <MaintenanceModeManager />
        </Card>
    );
}

function PermissionsTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <PermissionsManager />
        </Card>
    )
}

const adminModules = [
    {
        name: "permissions",
        title: "Usuários e Permissões",
        icon: Users,
        component: <PermissionsTabContent />,
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

        <Tabs defaultValue="permissions" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
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
