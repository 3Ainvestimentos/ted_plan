"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";

/**
 * Obtém a área padrão baseada no tipo de usuário quando não há filtro selecionado.
 * Reutiliza a lógica da página strategic-initiatives.
 */
function getDefaultAreaId(
  userType: 'admin' | 'pmo' | 'head',
  userArea: string | undefined,
  businessAreas: Array<{ id: string; name: string }>
): string | null {
  // Head: usa sua própria área como padrão
  if (userType === 'head' && userArea) {
    return userArea;
  }
  
  // PMO: busca área "Estratégia e IA" primeiro por ID, depois por nome
  if (userType === 'pmo' || userType === 'admin') {
    // Primeiro: buscar pelo ID específico
    const estrategiaAreaById = businessAreas.find(
      area => area.id === 'Sg1SSSWI0WMy4U3Dgc3e'
    );
    if (estrategiaAreaById) {
      return estrategiaAreaById.id;
    }
    
    // Fallback: buscar por nome "Estratégia e IA"
    const estrategiaArea = businessAreas.find(
      area => area.name.toLowerCase().includes('estratégia') && 
              (area.name.toLowerCase().includes('ia') || area.name.toLowerCase().includes('ai'))
    );
    
    // Fallback adicional: busca apenas por "Estratégia" se não encontrar com IA
    if (!estrategiaArea) {
      const estrategiaFallback = businessAreas.find(
        area => area.name.toLowerCase().includes('estratégia')
      );
      return estrategiaFallback?.id || null;
    }
    
    return estrategiaArea.id || null;
  }
  
  // Admin sem área específica: retorna null (pode ver todas)
  return null;
}

/**
 * Obtém a área efetiva considerando a área selecionada e os padrões.
 */
function getEffectiveAreaId(
  selectedAreaId: string | null,
  userType: 'admin' | 'pmo' | 'head',
  userArea: string | undefined,
  businessAreas: Array<{ id: string; name: string }>
): string | null {
  // Se há área selecionada na URL, usar ela
  if (selectedAreaId) {
    return selectedAreaId;
  }
  
  // Caso contrário, usar área padrão
  return getDefaultAreaId(userType, userArea, businessAreas);
}

interface AgendaAreaFilterProps {
  onAreaChange?: (areaId: string | null) => void;
}

/**
 * Componente de filtro de área para a página Agenda.
 * 
 * REGRAS:
 * - Head: Não exibe o filtro (filtra automaticamente pela própria área)
 * - PMO e Admin: Exibem o filtro e podem selecionar diferentes áreas
 */
export function AgendaAreaFilter({ onAreaChange }: AgendaAreaFilterProps) {
  const { user, getUserArea } = useAuth();
  const { businessAreas } = useStrategicPanel();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const userType = user?.userType || 'head';
  const userArea = getUserArea();
  
  // Obter área selecionada da URL
  const selectedAreaId = searchParams.get('area') || null;
  
  // Calcular área efetiva (selecionada ou padrão)
  const effectiveAreaId = useMemo(() => {
    return getEffectiveAreaId(selectedAreaId, userType, userArea, businessAreas);
  }, [selectedAreaId, userType, userArea, businessAreas]);
  
  // Head não vê o filtro
  if (userType === 'head') {
    return null;
  }
  
  // PMO e Admin veem o filtro
  const handleAreaChange = (newAreaId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newAreaId === 'all' || !newAreaId) {
      params.delete('area');
    } else {
      params.set('area', newAreaId);
    }
    
    router.push(`/agenda${params.toString() ? `?${params.toString()}` : ''}`);
    
    if (onAreaChange) {
      onAreaChange(newAreaId === 'all' ? null : newAreaId);
    }
  };
  
  return (
    <div className="mb-4">
      <Select
        value={effectiveAreaId || 'all'}
        onValueChange={handleAreaChange}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Selecione uma área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Áreas</SelectItem>
          {businessAreas.map((area) => (
            <SelectItem key={area.id} value={area.id}>
              {area.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

