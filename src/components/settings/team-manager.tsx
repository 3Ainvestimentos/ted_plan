
"use client";

import { useState } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from "lucide-react";
import type { Collaborator } from '@/types';
import { UpsertCollaboratorModal } from './upsert-collaborator-modal';
import { ImportCollaboratorsModal } from './import-collaborators-modal';
import { CollaboratorsTable } from './collaborators-table';

export function TeamManager() {
  const [isUpsertModalOpen, setIsUpsertModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);

  const handleOpenCreateModal = () => {
    setSelectedCollaborator(null);
    setIsUpsertModalOpen(true);
  };

  const handleOpenEditModal = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setIsUpsertModalOpen(true);
  };

  return (
    <>
      <UpsertCollaboratorModal 
          isOpen={isUpsertModalOpen}
          onOpenChange={setIsUpsertModalOpen}
          collaborator={selectedCollaborator}
      />
      <ImportCollaboratorsModal
          isOpen={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
      />

      <CardHeader>
        <CardTitle>Gerenciamento de Equipe</CardTitle>
        <CardDescription>Adicione, edite ou importe a lista de colaboradores da plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Importar CSV
            </Button>
            <Button onClick={handleOpenCreateModal}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Colaborador
            </Button>
        </div>
        <CollaboratorsTable onEdit={handleOpenEditModal} />
      </CardContent>
    </>
  );
}
