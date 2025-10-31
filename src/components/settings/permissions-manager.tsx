

"use client";

import { useState } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { NAV_ITEMS_CONFIG } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamControl } from '@/contexts/team-control-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Collaborator } from '@/types';
import { UpsertCollaboratorModal } from './upsert-collaborator-modal';
import { Button } from '../ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const getInitials = (name: string) => {
  if (!name) return '??'
  const parts = name.split(' ');
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PermissionsManager() {
  const { collaborators, isLoading, updateCollaboratorPermissions, deleteCollaborator } = useTeamControl();
  const { toast } = useToast();
  const [isUpsertModalOpen, setIsUpsertModalOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<Collaborator | null>(null);


  const navItemsForPermissions = NAV_ITEMS_CONFIG.filter(item => !item.isDivider && !item.isFooter);

  const handleOpenCreateModal = () => {
    setSelectedCollaborator(null);
    setIsUpsertModalOpen(true);
  };

  const handleOpenEditModal = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setIsUpsertModalOpen(true);
  };
  
  const openDeleteDialog = (collaborator: Collaborator) => {
    setCollaboratorToDelete(collaborator);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
      if (!collaboratorToDelete) return;
      try {
          await deleteCollaborator(collaboratorToDelete.id, collaboratorToDelete.email);
          toast({
              title: "Usuário Removido",
              description: `${collaboratorToDelete.name} foi removido com sucesso.`,
          });
      } catch (error) {
            toast({
              variant: 'destructive',
              title: "Erro ao Remover",
              description: `Não foi possível remover ${collaboratorToDelete.name}.`,
          });
      } finally {
          setIsAlertOpen(false);
          setCollaboratorToDelete(null);
      }
  };


  return (
    <>
      <UpsertCollaboratorModal 
          isOpen={isUpsertModalOpen}
          onOpenChange={setIsUpsertModalOpen}
          collaborator={selectedCollaborator}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso removerá permanentemente o usuário e seu acesso ao sistema.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                  Remover
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

       <CardHeader>
        <CardTitle>Usuários Cadastrados</CardTitle>
        <CardDescription>Adicione ou remova usuários com acesso à plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end gap-2 mb-4">
            <Button onClick={handleOpenCreateModal}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário
            </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[40%]">Nome</TableHead>
                <TableHead className="w-[30%]">Email</TableHead>
                <TableHead>Cargo Atual</TableHead>
                <TableHead className="text-right w-[50px]">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <TableRow key={`skel-collab-${i}`}><TableCell colSpan={4}><Skeleton className="h-10"/></TableCell></TableRow>
                    ))
                ) : collaborators.length > 0 ? (
                collaborators.map((user) => (
                    <TableRow key={user.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user.name}</p>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{user.cargo}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleOpenEditModal(user)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openDeleteDialog(user)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Remover
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum usuário encontrado.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </>
  );
}
