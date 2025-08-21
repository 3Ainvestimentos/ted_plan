

"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GanttChartSquare, BarChart2, History, HardHat, PlusCircle, MoreVertical, ArrowLeft, Mail, X, BadgeAlert, CheckCircle, Upload, CalendarIcon } from 'lucide-react';
import Link from 'next/link';

// Permissions Component (moved from its own page)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { NAV_ITEMS_CONFIG } from '@/lib/constants';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CollaboratorsTable } from '@/components/settings/collaborators-table';
import { UpsertCollaboratorModal } from '@/components/settings/upsert-collaborator-modal';
import { ImportCollaboratorsModal } from '@/components/settings/import-collaborators-modal';
import type { Collaborator } from '@/types';
import { BusinessAreasManager } from '@/components/settings/business-areas-manager';
import { AuditLogTable } from '@/components/settings/audit-log-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';


const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function PermissionsTabContent() {
  const [collaborators, setCollaborators] = useState<any[]>([]); // Will be fetched from Firestore
  const [permissions, setPermissions] = useState<Record<number, Record<string, boolean>>>({}); // Will be fetched from Firestore


  const handlePermissionChange = (userId: number, navHref: string, isEnabled: boolean) => {
    // This will be updated to write to Firestore
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
      <Card className="shadow-lg mt-6">
        <CardContent className="pt-6">
           <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground">Controle quais seções cada colaborador pode visualizar e interagir.</p>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Convidar Colaborador
              </Button>
           </div>
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={navItemsForPermissions.length + 2} className="h-24 text-center">
                      Nenhum colaborador encontrado. Comece convidando um novo colaborador.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
  );
}

function MaintenanceModeTabContent() {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [adminEmails, setAdminEmails] = useState<string[]>(['admin@tedapp.com', 'pmo@tedapp.com']);
    const [newEmail, setNewEmail] = useState('');

    const handleAddAdmin = () => {
        if (newEmail && !adminEmails.includes(newEmail) && newEmail.includes('@')) {
            setAdminEmails([...adminEmails, newEmail]);
            setNewEmail('');
        }
    };

    const handleRemoveAdmin = (emailToRemove: string) => {
        setAdminEmails(adminEmails.filter(email => email !== emailToRemove));
    };

    return (
        <Card className="shadow-lg mt-6">
            <CardContent className="pt-6 grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Ativar Modo Manutenção</h3>
                    <p className="text-sm text-muted-foreground">
                        Quando ativado, apenas os administradores listados poderão acessar a plataforma. Todos os outros usuários serão redirecionados para uma página de aviso.
                    </p>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="maintenance-mode"
                            checked={isMaintenanceMode}
                            onCheckedChange={setIsMaintenanceMode}
                        />
                        <Label htmlFor="maintenance-mode">
                           {isMaintenanceMode ? "Modo Manutenção Ativado" : "Modo Manutenção Desativado"}
                        </Label>
                    </div>
                    {isMaintenanceMode ? (
                         <Alert>
                            <BadgeAlert className="h-4 w-4" />
                            <AlertTitle>Plataforma em Manutenção!</AlertTitle>
                            <AlertDescription>
                                O acesso está restrito aos administradores.
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <Alert variant="default" className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Plataforma Operacional</AlertTitle>
                            <AlertDescription className="text-green-700">
                                O acesso está liberado para todos os usuários.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Gerenciar Administradores</h3>
                    <p className="text-sm text-muted-foreground">
                        Adicione ou remova os e-mails dos usuários que terão acesso durante o modo de manutenção.
                    </p>
                    <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="exemplo@empresa.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <Button onClick={handleAddAdmin} disabled={!newEmail}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                        </Button>
                    </div>
                    <div className="space-y-2 rounded-md border p-2">
                        <h4 className="text-sm font-medium px-2">Lista de Admins</h4>
                        {adminEmails.length > 0 ? (
                            <ul className="divide-y">
                                {adminEmails.map(email => (
                                    <li key={email} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                                        <div className="flex items-center gap-2">
                                           <Mail className="h-4 w-4 text-muted-foreground" />
                                           <span className="text-sm">{email}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveAdmin(email)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-sm text-muted-foreground p-2 text-center">Nenhum administrador adicionado.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Placeholder for other tabs
function PlaceholderTabContent({ title, description, icon: Icon }: {title: string, description: string, icon: React.ElementType}) {
    return (
        <Card className="mt-6">
            <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
                <Icon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Em Breve</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                    {description}
                </p>
            </div>
            </CardContent>
      </Card>
    )
}

function CollaboratorsTabContent() {
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
            <Card className="shadow-lg mt-6">
                <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-medium">Lista de Colaboradores</h3>
                        <p className="text-muted-foreground text-sm">Adicione, edite ou importe a lista de colaboradores da plataforma.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" /> Importar CSV
                        </Button>
                        <Button onClick={handleOpenCreateModal}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Colaborador
                        </Button>
                    </div>
                </div>
                <CollaboratorsTable onEdit={handleOpenEditModal} />
                </CardContent>
            </Card>
        </>
    )
}

function ContentGoalsTabContent() {
    return (
        <Card className="shadow-lg mt-6">
            <CardContent className="pt-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium">Conteúdo e Metas Estratégicas</h3>
                    <p className="text-muted-foreground text-sm">Gerencie as áreas de negócio, OKRs e KPIs que alimentam o Painel Estratégico.</p>
                </div>
                <BusinessAreasManager />
            </CardContent>
        </Card>
    )
}

function AuditLogTabContent() {
    const [filterType, setFilterType] = useState('all');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    return (
        <Card className="shadow-lg mt-6">
            <CardContent className="pt-6 space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Relatório de Auditoria</h3>
                    <p className="text-muted-foreground text-sm">Monitore as atividades dos usuários na plataforma.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-card-foreground/5">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="eventType">Tipo de Evento</Label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger id="eventType">
                                <SelectValue placeholder="Filtrar por evento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Eventos</SelectItem>
                                <SelectItem value="login">Login</SelectItem>
                                <SelectItem value="logout">Logout</SelectItem>
                                <SelectItem value="view_page">Visualização</SelectItem>
                                <SelectItem value="create_initiative">Criação</SelectItem>
                                <SelectItem value="update_initiative">Atualização</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                         <Label>Data de Início</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "dd/MM/yyyy") : <span>Selecione</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate ?? undefined} onSelect={(d) => setStartDate(d ?? null)} /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex-1 space-y-2">
                         <Label>Data de Fim</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "dd/MM/yyyy") : <span>Selecione</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate ?? undefined} onSelect={(d) => setEndDate(d ?? null)} /></PopoverContent>
                        </Popover>
                    </div>
                </div>
                <AuditLogTable filterType={filterType} filterStartDate={startDate} filterEndDate={endDate} />
            </CardContent>
        </Card>
    );
}



const adminModules = [
    {
        name: "permissions",
        title: "Permissões de Acesso",
        description: "Controle quais seções cada colaborador pode visualizar.",
        icon: GanttChartSquare,
        component: <PermissionsTabContent />
    },
    {
        name: "collaborators",
        title: "Colaboradores",
        description: "Adicione, edite ou importe a lista de colaboradores da plataforma.",
        icon: Users,
        component: <CollaboratorsTabContent />
    },
    {
        name: "content",
        title: "Conteúdo e Metas",
        description: "O painel para gerenciar áreas de negócio, OKRs e KPIs que alimentam o Painel Estratégico será implementado aqui.",
        icon: BarChart2,
        component: <ContentGoalsTabContent />
    },
    {
        name: "audit",
        title: "Painel de Auditoria",
        description: "Os relatórios de auditoria, com análise de logins e visualização de conteúdos, estarão disponíveis nesta seção.",
        icon: History,
        component: <AuditLogTabContent />
    },
    {
        name: "maintenance",
        title: "Modo Manutenção",
        description: "A ferramenta para ativar o modo de manutenção e gerenciar o acesso de usuários autorizados será implementada aqui.",
        icon: HardHat,
        component: <MaintenanceModeTabContent />

    }
];

export default function SettingsHubPage() {
  return (
    <div className="space-y-6">
       <PageHeader
            title="Administração do Sistema"
            description="Gerencie os módulos e configurações da plataforma em um local central."
        />

        <Tabs defaultValue="collaborators" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto">
                 {adminModules.map((mod) => (
                    <TabsTrigger key={mod.name} value={mod.name} className="py-2 flex-col h-auto">
                        <span>{mod.title}</span>
                    </TabsTrigger>
                 ))}
            </TabsList>

            {adminModules.map((mod) => (
                <TabsContent key={mod.name} value={mod.name}>
                    {mod.component}
                </TabsContent>
            ))}
        </Tabs>
    </div>
  );
}
