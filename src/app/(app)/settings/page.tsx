
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NAV_ITEMS_CONFIG, initialCollaborators, initialPermissions } from '@/lib/constants';
import { Textarea } from '@/components/ui/textarea';
import { SlidersHorizontal, UserX, Users, GanttChartSquare, ShieldCheck, BarChartHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("A plataforma está temporariamente indisponível para manutenção. Voltaremos em breve!");

  const handlePermissionChange = (userId: number, pageHref: string, isEnabled: boolean) => {
      setPermissions(prev => ({
          ...prev,
          [userId]: {
              ...prev[userId],
              [pageHref]: isEnabled
          }
      }));
  };

  const pagesForPermissions = NAV_ITEMS_CONFIG.filter(item => !item.isFooter);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="Configurações e Administração"
        description="Gerencie usuários, permissões, metas e o estado da plataforma."
      />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="goals">
             <GanttChartSquare className="w-4 h-4 mr-2" />
             Metas
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="system">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Users Management Tab */}
        <TabsContent value="users">
           <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>Adicione, edite ou remova usuários da plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Input placeholder="Buscar colaborador..." className="max-w-sm" />
                    <div className="flex gap-2">
                        <Button variant="outline">Exportar CSV</Button>
                        <Button>Adicionar Colaborador</Button>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Área</TableHead>
                             <TableHead>Cargo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {initialCollaborators.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.area}</TableCell>
                                <TableCell>{user.cargo}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Editar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
           </Card>
        </TabsContent>

        {/* Goals Management Tab */}
        <TabsContent value="goals">
             <Card>
                <CardHeader>
                    <CardTitle>Gerenciamento de Metas (OKRs e KPIs)</CardTitle>
                    <CardDescription>Defina as áreas de negócio e as metas que aparecem no Painel Estratégico.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground bg-secondary/20 rounded-lg">
                    <div>
                        <GanttChartSquare className="w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">Funcionalidade em Desenvolvimento</h3>
                        <p>Aqui você poderá gerenciar as áreas de negócio e as metas da sua organização.</p>
                    </div>
                </CardContent>
             </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissões de Acesso</CardTitle>
              <CardDescription>Controle o acesso de cada colaborador às diferentes seções da aplicação.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Colaborador</TableHead>
                            {pagesForPermissions.map(page => (
                                <TableHead key={page.href} className="text-center">{page.title}</TableHead>
                            ))}
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {initialCollaborators.map(user => (
                            <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            {pagesForPermissions.map(page => (
                                <TableCell key={page.href} className="text-center">
                                    <Switch
                                        checked={permissions[user.id]?.[page.href] ?? false}
                                        onCheckedChange={(checked) => handlePermissionChange(user.id, page.href, checked)}
                                        aria-label={`Permissão para ${user.name} em ${page.title}`}
                                    />
                                </TableCell>
                            ))}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button>Salvar Permissões</Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Tab (Maintenance Mode & Audit) */}
        <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Modo de Manutenção</CardTitle>
                        <CardDescription>Ative para suspender o acesso, exceto para Admins.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className={`p-4 rounded-lg flex items-center justify-between ${isMaintenanceMode ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            <div className="space-y-1">
                                <h4 className={`font-semibold ${isMaintenanceMode ? 'text-orange-800 dark:text-orange-200' : 'text-green-800 dark:text-green-200'}`}>
                                    {isMaintenanceMode ? 'MANUTENÇÃO ATIVA' : 'SISTEMA OPERACIONAL'}
                                </h4>
                                <p className={`text-sm ${isMaintenanceMode ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'}`}>
                                    {isMaintenanceMode ? 'Acesso limitado.' : 'Acesso liberado.'}
                                </p>
                            </div>
                            <Switch
                                checked={isMaintenanceMode}
                                onCheckedChange={setIsMaintenanceMode}
                                aria-label="Ativar modo de manutenção"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maintenance-message">Mensagem de Manutenção</Label>
                            <Textarea 
                                id="maintenance-message"
                                value={maintenanceMessage}
                                onChange={(e) => setMaintenanceMessage(e.target.value)}
                                placeholder="A plataforma está temporariamente indisponível..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button>Salvar</Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Painel de Auditoria</CardTitle>
                        <CardDescription>Monitore a atividade e o uso da plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground bg-secondary/20 rounded-lg">
                        <div>
                            <BarChartHorizontal className="w-12 h-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">Funcionalidade em Desenvolvimento</h3>
                            <p>Aqui você poderá visualizar logs de login e outras atividades.</p>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
