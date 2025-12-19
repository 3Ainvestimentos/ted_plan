
"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DollarSign, Target, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

// Mapeamento de ícones disponíveis
const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Target,
  Briefcase,
};

export default function DashboardPage() {
  const { businessAreas, isLoading: isLoadingAreas } = useStrategicPanel();
  const router = useRouter();

  const handleAreaClick = (areaId: string) => {
    // Navegar para página de iniciativas com filtro de área
    router.push(`/strategic-initiatives?area=${areaId}`);
  };

  if (isLoadingAreas) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Painel Estratégico"
          description="Acesso rápido às principais áreas da plataforma."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Estratégico"
        description="Acesso rápido às principais áreas da plataforma."
      />
      {businessAreas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businessAreas.map((area) => {
            const Icon = iconMap[area.icon] || Target; // Fallback para Target se ícone não encontrado
            return (
              <div
                key={area.id}
                onClick={() => handleAreaClick(area.id)}
                className="cursor-pointer"
              >
                <DashboardCard
                  title={area.name}
                  description={`Acompanhe e gerencie as iniciativas da área ${area.name}.`}
                  href={`/strategic-initiatives?area=${area.id}`}
                  iconName={area.icon}
                  iconMap={iconMap}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma área de negócio cadastrada.</p>
          <p className="text-sm mt-2">Entre em contato com o administrador para configurar as áreas.</p>
        </div>
      )}
    </div>
  );
}
