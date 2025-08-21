
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List, Upload, Download } from "lucide-react";
import { useInitiatives } from "@/contexts/initiatives-context";
import { InitiativesTable } from "@/components/initiatives/initiatives-table";
import { InitiativesKanban } from "@/components/initiatives/initiatives-kanban";
import { PageHeader } from "@/components/layout/page-header";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Papa from 'papaparse';
import { useToast } from "@/hooks/use-toast";
import type { Initiative, InitiativePriority, InitiativeStatus } from "@/types";
import { CreateInitiativeModal } from "@/components/initiatives/create-initiative-modal";

type ViewMode = "table" | "kanban";

export default function InitiativesPage() {
  const { initiatives, bulkAddInitiatives } = useInitiatives();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const requiredFields = ['title', 'owner', 'description', 'status', 'priority'];
            const fileFields = results.meta.fields || [];
            
            if (!requiredFields.every(field => fileFields.includes(field))) {
              throw new Error(`O arquivo CSV deve conter as colunas: ${requiredFields.join(', ')}.`);
            }

            const newInitiatives = results.data.map((row: any) => {
               if (!row.title || !row.owner || !row.description || !row.status || !row.priority) {
                  throw new Error(`Linha inválida encontrada no CSV. Todos os campos são obrigatórios. Linha: ${JSON.stringify(row)}`);
                }
              
              return {
                title: row.title,
                owner: row.owner,
                description: row.description,
                status: row.status as InitiativeStatus,
                priority: row.priority as InitiativePriority,
                // Context will handle the rest
              } as Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics'>;
            });
            
            bulkAddInitiatives(newInitiatives as any);
            toast({
              title: "Importação bem-sucedida!",
              description: `${newInitiatives.length} iniciativas foram adicionadas.`,
            });
          } catch (error: any) {
             toast({
              variant: "destructive",
              title: "Erro na Importação",
              description: error.message || "Não foi possível processar o arquivo CSV.",
            });
          }
        },
        error: (error: any) => {
           toast({
            variant: "destructive",
            title: "Erro de Leitura",
            description: `Falha ao ler o arquivo: ${error.message}`,
          });
        }
      });
    }
     // Reset file input
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <CreateInitiativeModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader
            title="Iniciativas Estratégicas"
            description="Acompanhe, gerencie e organize todas as suas iniciativas em um só lugar."
          />
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <div className="p-1 bg-muted rounded-lg flex items-center">
              <Button 
                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Tabela</span>
              </Button>
              <Button 
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Kanban</span>
              </Button>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Criar
            </Button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
             <Button variant="outline" onClick={triggerFileUpload}>
              <Upload className="mr-2 h-4 w-4" /> Importar CSV
            </Button>
            <Button variant="link" size="sm" asChild>
                <a href="/template_iniciativas.csv" download>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Modelo
                </a>
            </Button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <InitiativesTable initiatives={initiatives} />
        ) : (
          <InitiativesKanban initiatives={initiatives} />
        )}
      </div>
    </DndProvider>
  );
}
