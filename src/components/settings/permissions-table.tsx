"use client";

import { useState, useMemo } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamControl } from '@/contexts/team-control-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Collaborator } from '@/types';
import { PERMISSIONABLE_PAGES } from '@/lib/constants';
import { Search } from 'lucide-react';

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export function PermissionsTable() {
  const { collaborators, isLoading, updateCollaboratorPermissions } = useTeamControl();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollaborators = useMemo(() => {
    if (!searchQuery.trim()) return collaborators;
    const query = searchQuery.toLowerCase();
    return collaborators.filter(
      (collab) =>
        collab.name.toLowerCase().includes(query) ||
        collab.email.toLowerCase().includes(query)
    );
  }, [collaborators, searchQuery]);

  const handleTogglePermission = async (
    collaborator: Collaborator,
    permissionKey: string,
    isEnabled: boolean
  ) => {
    // Administradores não podem ter permissões alteradas
    const userType = collaborator.userType || 'Usuário padrão';
    if (userType === 'Administrador') {
      return;
    }

    try {
      await updateCollaboratorPermissions(collaborator.id, permissionKey, isEnabled);
      toast({
        title: "Permissão Atualizada",
        description: `Acesso de ${collaborator.name} à página foi ${isEnabled ? 'habilitado' : 'desabilitado'}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro ao Atualizar",
        description: "Não foi possível atualizar a permissão.",
      });
    }
  };

  const getPermissionValue = (collaborator: Collaborator, permissionKey: string): boolean => {
    const userType = collaborator.userType || 'Usuário padrão';
    if (userType === 'Administrador') {
      return true; // Administradores sempre têm acesso
    }
    return collaborator.permissions?.[permissionKey] === true;
  };

  const isPermissionDisabled = (collaborator: Collaborator): boolean => {
    const userType = collaborator.userType || 'Usuário padrão';
    return userType === 'Administrador';
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Permissões de Administrador</CardTitle>
            <CardDescription className="mt-1">
              Ative ou desative o acesso aos painéis de controle para cada colaborador
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Colaborador</TableHead>
                <TableHead className="min-w-[120px]">Área</TableHead>
                <TableHead className="min-w-[120px]">Cargo</TableHead>
                {PERMISSIONABLE_PAGES.map((page) => (
                  <TableHead key={page.key} className="text-center min-w-[120px]">
                    {page.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={`skel-perm-${i}`}>
                    <TableCell colSpan={3 + PERMISSIONABLE_PAGES.length}>
                      <Skeleton className="h-10" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCollaborators.length > 0 ? (
                filteredCollaborators.map((collaborator) => (
                  <TableRow key={collaborator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={`https://placehold.co/40x40.png?text=${getInitials(collaborator.name)}`}
                            alt={collaborator.name}
                          />
                          <AvatarFallback>{getInitials(collaborator.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{collaborator.name}</p>
                          <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {collaborator.area || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{collaborator.cargo}</TableCell>
                    {PERMISSIONABLE_PAGES.map((page) => (
                      <TableCell key={page.key} className="text-center">
                        <Switch
                          checked={getPermissionValue(collaborator, page.key)}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(collaborator, page.key, checked)
                          }
                          disabled={isPermissionDisabled(collaborator)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3 + PERMISSIONABLE_PAGES.length}
                    className="h-24 text-center"
                  >
                    {searchQuery
                      ? 'Nenhum colaborador encontrado com essa busca.'
                      : 'Nenhum colaborador cadastrado.'}
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

