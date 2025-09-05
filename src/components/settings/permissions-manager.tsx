
"use client";

import { useState } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { NAV_ITEMS_CONFIG } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollaborators } from '@/contexts/collaborators-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PermissionsManager() {
  const { collaborators, isLoading, updateCollaboratorPermissions } = useCollaborators();
  const { toast } = useToast();

  const handlePermissionChange = async (userId: string, navHref: string, isEnabled: boolean) => {
    try {
      await updateCollaboratorPermissions(userId, navHref, isEnabled);
      toast({
        title: "Permissão Atualizada",
        description: "A permissão do colaborador foi salva.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar a permissão.",
      });
    }
  };
  
  const navItemsForPermissions = NAV_ITEMS_CONFIG.filter(item => !item.isDivider && !item.isFooter);

  return (
    <>
      <CardHeader>
        <CardTitle>Matriz de Permissões de Acesso</CardTitle>
        <CardDescription>Controle quais seções cada colaborador pode visualizar e interagir na barra lateral.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Colaborador</TableHead>
                {navItemsForPermissions.map((navItem) => (
                  <TableHead key={navItem.href} className="text-center">{navItem.title}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 [...Array(3)].map((_, i) => (
                  <TableRow key={`skel-perm-${i}`}>
                      <TableCell>
                          <div className="flex items-center gap-3">
                              <Skeleton className="h-9 w-9 rounded-full" />
                              <div className="space-y-1">
                                  <Skeleton className="h-4 w-24" />
                                  <Skeleton className="h-3 w-16" />
                              </div>
                          </div>
                      </TableCell>
                      {navItemsForPermissions.map(item => (
                          <TableCell key={item.href} className="text-center">
                              <Skeleton className="h-6 w-11 mx-auto" />
                          </TableCell>
                      ))}
                  </TableRow>
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
                          <p className="text-xs text-muted-foreground">{user.cargo}</p>
                        </div>
                      </div>
                    </TableCell>
                    {navItemsForPermissions.map((navItem) => {
                      const permissionKey = navItem.href.startsWith('/') ? navItem.href.substring(1) : navItem.href;
                      return (
                      <TableCell key={navItem.href} className="text-center">
                        <Switch
                          checked={user.permissions?.[permissionKey] ?? false}
                          onCheckedChange={(checked) => handlePermissionChange(user.id, navItem.href, checked)}
                          aria-label={`Permissão para ${navItem.title} para ${user.name}`}
                        />
                      </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={navItemsForPermissions.length + 1} className="h-24 text-center">
                    Nenhum colaborador encontrado. Adicione um na aba "Equipe".
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
