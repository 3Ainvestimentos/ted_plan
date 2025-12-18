
"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Target, CalendarClock, ClipboardList, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const dashboardItems: { title: string; href: string; icon: string; description: string; permissionKey: string; }[] = [
    { title: 'Iniciativas Estratégicas', href: '/strategic-initiatives', icon: 'Target', description: 'Acompanhe e gerencie as iniciativas chave.', permissionKey: 'strategic-initiatives' },
    { title: 'Agenda de Reuniões', href: '/meeting-agenda', icon: 'CalendarClock', description: 'Visualize e organize seus compromissos.', permissionKey: 'meeting-agenda' },
    { title: 'Tarefas', href: '/tasks', icon: 'ClipboardList', description: 'Gerencie sua lista de tarefas diárias.', permissionKey: 'tasks' },
    { title: 'Anotações', href: '/notes', icon: 'StickyNote', description: 'Seu bloco de notas pessoal para acesso rápido.', permissionKey: 'notes' },
];

const iconMap: Record<string, LucideIcon> = {
    Target,
    CalendarClock,
    ClipboardList,
    StickyNote,
};

export default function DashboardPage() {
  const { isAdmin, hasPermission } = useAuth();
  
  // Filtrar cards baseado nas permissões do usuário
  const allowedItems = dashboardItems.filter(item => {
    // Administradores veem todos os cards
    if (isAdmin) return true;
    // Usuários padrão veem apenas os cards das páginas que têm permissão
    return hasPermission(item.permissionKey);
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Estratégico"
        description="Acesso rápido às principais áreas da plataforma."
      />
      {allowedItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allowedItems.map((item) => (
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
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Você não tem permissão para acessar nenhuma área da plataforma.</p>
          <p className="text-sm mt-2">Entre em contato com o administrador para solicitar acesso.</p>
        </div>
      )}
    </div>
  );
}
