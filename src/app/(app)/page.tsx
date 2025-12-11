
"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Handshake, Target, CalendarClock, ClipboardList, StickyNote, AppWindow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const dashboardItems: { title: string; href: string; icon: string; description: string; }[] = [
    { title: 'Iniciativas Estratégicas', href: '/strategic-initiatives', icon: 'Target', description: 'Acompanhe e gerencie as iniciativas chave.' },
    { title: 'Desenvolvimento', href: '/development-projects', icon: 'AppWindow', description: 'Gerencie projetos de implementação de ferramentas.' },
    { title: 'M&As', href: '/m-and-as', icon: 'Handshake', description: 'Gerencie o funil de oportunidades de M&A.' },
    { title: 'Agenda de Reuniões', href: '/meeting-agenda', icon: 'CalendarClock', description: 'Visualize e organize seus compromissos.' },
    { title: 'Tarefas', href: '/tasks', icon: 'ClipboardList', description: 'Gerencie sua lista de tarefas diárias.' },
    { title: 'Anotações', href: '/notes', icon: 'StickyNote', description: 'Seu bloco de notas pessoal para acesso rápido.' },
];

const iconMap: Record<string, LucideIcon> = {
    Handshake,
    Target,
    CalendarClock,
    ClipboardList,
    StickyNote,
    AppWindow,
};


export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Estratégico"
        description="Acesso rápido às principais áreas da plataforma."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardItems.map((item) => (
            <DashboardCard
                key={item.title}
                title={item.title}
                description={item.description}
                href={item.href}
                iconName={item.icon}
                iconMap={iconMap}
            />
        ))}
      </div>
    </div>
  );
}
