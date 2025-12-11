
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useDevProjects } from '@/contexts/dev-projects-context';
import type { DevProject, DevProjectStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { GanttView } from '@/components/dev-projects/gantt-view';
import { PlusCircle } from 'lucide-react';
import { UpsertProjectModal } from '@/components/dev-projects/upsert-project-modal';

export default function DevelopmentProjectsPage() {
    const { projects, allResponsibles, isLoading, updateItemStatus } = useDevProjects();
    
    // Filters
    const [projectFilter, setProjectFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<DevProjectStatus | 'all'>('all');
    const [responsibleFilter, setResponsibleFilter] = useState('all');
    const [deadlineFilter, setDeadlineFilter] = useState<Date | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<DevProject | null>(null);


    const handleOpenModal = (project: DevProject | null) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const filteredProjects = useMemo(() => {
        let tempProjects = [...projects];

        if (projectFilter !== 'all') {
            tempProjects = tempProjects.filter(p => p.id === projectFilter);
        }

        return tempProjects.map(project => {
            const filteredItems = project.items.map(item => {
                const subItemsMatch = item.subItems.filter(subItem =>
                    (statusFilter === 'all' || subItem.status === statusFilter) &&
                    (responsibleFilter === 'all' || subItem.responsible === responsibleFilter) &&
                    (!deadlineFilter || new Date(subItem.deadline) <= deadlineFilter)
                );

                const itemMatches = (statusFilter === 'all' || item.status === statusFilter) &&
                                    (responsibleFilter === 'all' || item.responsible === responsibleFilter) &&
                                    (!deadlineFilter || new Date(item.deadline) <= deadlineFilter);

                if (itemMatches || subItemsMatch.length > 0) {
                    return { ...item, subItems: subItemsMatch };
                }
                return null;
            }).filter((item): item is NonNullable<typeof item> => item !== null);

            if (filteredItems.length > 0 || projectFilter === 'all') {
                return { ...project, items: filteredItems };
            }
            return null;
        }).filter((p): p is NonNullable<typeof p> => p !== null);
    }, [projects, projectFilter, statusFilter, responsibleFilter, deadlineFilter]);

    const STATUS_OPTIONS: DevProjectStatus[] = ['Pendente', 'Em Andamento', 'Concluído', 'Em Espera', 'Cancelado'];

    return (
        <div className="space-y-6 h-full flex flex-col">
             <UpsertProjectModal 
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                project={editingProject}
             />
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title="Desenvolvimento"
                    description="Gerencie projetos de implementação de ferramentas da área de desenvolvimento."
                />
                <Button onClick={() => handleOpenModal(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Projeto
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-card shadow-sm">
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por projeto..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Projetos</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por status..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por responsável..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Responsáveis</SelectItem>
                        {allResponsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {deadlineFilter ? `Prazo até ${format(deadlineFilter, "dd/MM/yyyy")}`: "Filtrar por prazo..."}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={deadlineFilter || undefined} onSelect={setDeadlineFilter} />
                    </PopoverContent>
                </Popover>
            </div>

            {isLoading ? (
                <div className="space-y-4 flex-grow">
                    <Skeleton className="h-full w-full" />
                </div>
            ) : (
                <div className="flex-grow overflow-hidden">
                    <GanttView 
                        projects={filteredProjects} 
                        onProjectClick={(project) => handleOpenModal(project)}
                        onStatusChange={updateItemStatus}
                    />
                </div>
            )}
        </div>
    );
}
