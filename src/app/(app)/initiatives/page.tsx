
"use client";

import { STATUS_ICONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Filter, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useState, useMemo } from "react";
import type { Initiative, InitiativeStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useInitiatives } from "@/contexts/initiatives-context";
import { CreateInitiativeModal } from "@/components/initiatives/create-initiative-modal";

export default function InitiativesPage() {
  const { initiatives } = useInitiatives();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => 
    new Set(initiatives.filter(i => !i.topicNumber.includes('.')).map(i => i.topicNumber))
  );

  const toggleTopic = (topicNumber: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicNumber)) {
        newSet.delete(topicNumber);
      } else {
        newSet.add(topicNumber);
      }
      return newSet;
    });
  };

  const filteredInitiatives = useMemo(() => {
    const baseFiltered = initiatives.filter(initiative => {
      const matchesSearch = initiative.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            initiative.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            initiative.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || initiative.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Now, filter based on expansion state
    return baseFiltered.filter(initiative => {
        if (!initiative.topicNumber.includes('.')) {
            return true; // Always show parent topics
        }
        const parentTopic = initiative.topicNumber.split('.')[0];
        return expandedTopics.has(parentTopic); // Show sub-topic only if parent is expanded
    });

  }, [searchTerm, statusFilter, expandedTopics, initiatives]);

  const initiativeStatuses = ["all", "A Fazer", "Em Dia", "Em Risco", "Atrasado", "Concluído"] as const;
  
  const parentTopics = useMemo(() => 
      new Set(initiatives.filter(i => i.topicNumber.includes('.')).map(i => i.topicNumber.split('.')[0]))
  , [initiatives]);


  return (
    <div className="space-y-8">
      <CreateInitiativeModal 
        isOpen={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-semibold tracking-tight">Iniciativas Estratégicas</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Nova Iniciativa
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-card shadow-sm">
        <Input 
          placeholder="Buscar iniciativas..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <div className="flex gap-2 items-center">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {initiativeStatuses.map(status => (
                <SelectItem key={status} value={status} className="capitalize">{status === "all" ? "Todos os Status" : status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Tópico</TableHead>
              <TableHead className="w-[35%]">Título da Iniciativa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInitiatives.length > 0 ? (
              filteredInitiatives.map((initiative: Initiative) => {
                const StatusIcon = STATUS_ICONS[initiative.status];
                const isSubTopic = initiative.topicNumber.includes('.');
                const isParent = parentTopics.has(initiative.topicNumber);
                const isExpanded = expandedTopics.has(initiative.topicNumber);

                return (
                  <TableRow key={initiative.id}>
                    <TableCell className={cn("font-medium", isSubTopic && "pl-8")}>
                        <div className="flex items-center gap-1">
                        {isParent && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 -ml-2" onClick={() => toggleTopic(initiative.topicNumber)}>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        )}
                         <span className={cn(isParent && "cursor-pointer")} onClick={() => isParent && toggleTopic(initiative.topicNumber)}>
                            {initiative.topicNumber}
                         </span>
                        </div>
                    </TableCell>
                    <TableCell className="font-medium">{initiative.title}</TableCell>
                    <TableCell>{initiative.owner}</TableCell>
                    <TableCell>
                      <Badge variant={initiative.status === 'Concluído' ? 'default' : initiative.status === 'Em Risco' || initiative.status === 'Atrasado' ? 'destructive' : 'secondary'} className="capitalize flex items-center w-fit">
                        <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                        {initiative.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={initiative.progress} className="w-24 h-2" aria-label={`Progresso de ${initiative.title}`} />
                        <span className="text-sm text-muted-foreground">{initiative.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/initiatives/${initiative.id}`}>
                           Ver Dossiê <ExternalLink className="ml-2 h-4 w-4" />
                         </Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-48">
                  <p className="text-muted-foreground">Nenhuma iniciativa encontrada.</p>
                  <p className="text-sm text-muted-foreground mt-1">Tente ajustar sua busca ou filtros.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
