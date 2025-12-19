
"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Collaborator } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { useTeamControl } from '@/contexts/team-control-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface CollaboratorsTableProps {
    onEdit: (collaborator: Collaborator) => void;
}

export function CollaboratorsTable({ onEdit }: CollaboratorsTableProps) {
    const { collaborators, isLoading, deleteCollaborator } = useTeamControl();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
    const { toast } = useToast();

    const openDeleteDialog = (collaborator: Collaborator) => {
        setSelectedCollaborator(collaborator);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCollaborator) return;
        try {
            await deleteCollaborator(selectedCollaborator.id);
            toast({
                title: "Colaborador Removido",
                description: `${selectedCollaborator.name} foi removido com sucesso.`,
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Erro ao Remover",
                description: `Não foi possível remover ${selectedCollaborator.name}.`,
            });
        } finally {
            setIsAlertOpen(false);
            setSelectedCollaborator(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2 mt-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        )
    }

    return (
        <>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso removerá permanentemente o colaborador e todo o seu histórico.
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

            <div className="overflow-x-auto rounded-lg border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[40%]">Nome</TableHead>
                    <TableHead className="w-[30%]">Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right w-[50px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {collaborators.length > 0 ? (
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
                        <TableCell className="text-muted-foreground">{user.userType}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(user)}>
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
                        Nenhum colaborador encontrado.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
        </>
    );
}
