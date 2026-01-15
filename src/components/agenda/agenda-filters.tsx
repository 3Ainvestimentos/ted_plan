"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InitiativePriority, InitiativeStatus } from "@/types";
import type { AgendaItem } from "@/lib/agenda-helpers";

interface AgendaFiltersProps {
  items: AgendaItem[];
  projectFilter: string | 'all';
  responsibleFilter: string | 'all';
  priorityFilter: InitiativePriority | 'all';
  statusFilter: InitiativeStatus | 'all';
  onProjectChange: (value: string) => void;
  onResponsibleChange: (value: string) => void;
  onPriorityChange: (value: InitiativePriority | 'all') => void;
  onStatusChange: (value: InitiativeStatus | 'all') => void;
}

/**
 * Componente de filtros para a página Agenda.
 * 
 * Filtros disponíveis:
 * - Projeto: Dropdown com iniciativas da área selecionada
 * - Responsável: Dropdown com responsáveis únicos da área selecionada
 * - Prioridade: Dropdown com opções de prioridade
 * - Status: Dropdown com opções de status
 */
export function AgendaFilters({
  items,
  projectFilter,
  responsibleFilter,
  priorityFilter,
  statusFilter,
  onProjectChange,
  onResponsibleChange,
  onPriorityChange,
  onStatusChange,
}: AgendaFiltersProps) {
  // Extrair projetos únicos (iniciativas)
  const uniqueProjects = Array.from(
    new Set(items.map(item => item.initiativeId))
  ).map(initiativeId => {
    const item = items.find(i => i.initiativeId === initiativeId);
    return {
      id: initiativeId,
      title: item?.initiativeTitle || '',
    };
  });

  // Extrair responsáveis únicos
  const uniqueResponsibles = Array.from(
    new Set(items.map(item => item.responsible).filter(r => r && r !== '-'))
  ).sort();

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Select value={projectFilter} onValueChange={onProjectChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos os Projetos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Projetos</SelectItem>
          {uniqueProjects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={responsibleFilter} onValueChange={onResponsibleChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos os Responsáveis" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Responsáveis</SelectItem>
          {uniqueResponsibles.map((responsible) => (
            <SelectItem key={responsible} value={responsible}>
              {responsible}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todas as Prioridades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Prioridades</SelectItem>
          <SelectItem value="Alta">Alta</SelectItem>
          <SelectItem value="Média">Média</SelectItem>
          <SelectItem value="Baixa">Baixa</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos os Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="Pendente">Pendente</SelectItem>
          <SelectItem value="Em execução">Em execução</SelectItem>
          <SelectItem value="Concluído">Concluído</SelectItem>
          <SelectItem value="Suspenso">Suspenso</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

