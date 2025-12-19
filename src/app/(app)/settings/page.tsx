
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Users, HardHat } from 'lucide-react';
import { MaintenanceModeManager } from '@/components/settings/maintenance-mode-manager';
import { CollaboratorsManager } from '@/components/settings/collaborators-manager';


function CollaboratorsTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <CollaboratorsManager />
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

const adminModules = [
    {
        name: "collaborators",
        title: "Colaboradores",
        icon: Users,
        component: <CollaboratorsTabContent />,
        disabled: false,
    },
    {
        name: "maintenance",
        title: "Configurações",
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
            description="Gerencie colaboradores e o estado da plataforma."
        />

        <Tabs defaultValue="collaborators" className="w-full">
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
