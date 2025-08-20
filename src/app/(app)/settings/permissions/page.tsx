
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { NAV_ITEMS_CONFIG, initialCollaborators, initialPermissions } from '@/lib/constants';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, ArrowLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}


export default function PermissionsPage() {
  const [permissions, setPermissions] = useState(initialPermissions);

  const handlePermissionChange = (userId: number, navHref: string, isEnabled: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [navHref]: isEnabled,
      },
    }));
  };
  
  const navItemsForPermissions = NAV_ITEMS_CONFIG.filter(item => !item.isDivider && !item.isFooter);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <PageHeader
                title="Permissões de Acesso"
                description="Controle quais seções cada colaborador pode visualizar e interagir."
            >
                 <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link href="/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Administração
                    </Link>
                </Button>
            </PageHeader>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Convidar Colaborador
            </Button>
        </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Colaborador</TableHead>
                  {navItemsForPermissions.map((navItem) => (
                    <TableHead key={navItem.href} className="text-center">{navItem.title}</TableHead>
                  ))}
                  <TableHead className="text-right w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialCollaborators.map((user) => (
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
                    {navItemsForPermissions.map((navItem) => (
                      <TableCell key={navItem.href} className="text-center">
                        <Switch
                          checked={permissions[user.id]?.[navItem.href] ?? false}
                          onCheckedChange={(checked) => handlePermissionChange(user.id, navItem.href, checked)}
                          aria-label={`Permissão para ${navItem.title} para ${user.name}`}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
