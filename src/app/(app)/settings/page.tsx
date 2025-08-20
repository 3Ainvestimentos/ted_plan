
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NAV_ITEMS_CONFIG, initialCollaborators, initialPermissions } from '@/lib/constants';
import { Textarea } from '@/components/ui/textarea';
import { SlidersHorizontal, UserX } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Label } from '@/components/ui/label';

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

  const pagesForPermissions = NAV_ITEMS_CONFIG.filter(item => !item.isDivider && item.href !== '/dashboard');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Configurações e Acesso"
        description="Gerencie permissões de acesso e o estado da plataforma."
      />

      <Tabs defaultValue="permissions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="permissions">Permissões de Acesso</TabsTrigger>
          <TabsTrigger value="maintenance">Modo de Manutenção</TabsTrigger>
        </TabsList>

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
                            {/* O Dashboard é fixo, não pode ser desabilitado */}
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
        
        {/* Maintenance Mode Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <SlidersHorizontal className="h-6 w-6 text-foreground" />
                    <div>
                        <CardTitle>Modo de Manutenção</CardTitle>
                        <CardDescription>Ative para suspender o acesso, exceto para Super Admins e usuários autorizados.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className={`p-4 rounded-lg flex items-center justify-between ${isMaintenanceMode ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    <div>
                        <h4 className={`font-semibold ${isMaintenanceMode ? 'text-orange-800 dark:text-orange-200' : 'text-green-800 dark:text-green-200'}`}>
                            {isMaintenanceMode ? 'MANUTENÇÃO ATIVA' : 'MANUTENÇÃO INATIVA'}
                        </h4>
                        <p className={`text-sm ${isMaintenanceMode ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'}`}>
                            {isMaintenanceMode ? 'Acesso limitado a usuários autorizados.' : 'Acesso liberado para todos os colaboradores.'}
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

                <div className="space-y-2">
                    <Label htmlFor="authorized-users">Usuários Autorizados na Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                       Estes usuários poderão acessar a plataforma mesmo com o modo de manutenção ativo. Super Admins sempre têm acesso.
                    </p>
                    <div className="border rounded-lg p-4 flex items-center justify-center text-sm text-muted-foreground bg-secondary/30">
                        <UserX className="h-5 w-5 mr-3"/>
                        Nenhum usuário extra autorizado.
                    </div>
                    {/* Placeholder for adding users */}
                    <Button variant="outline" size="sm" className="mt-2">Adicionar Usuário</Button>
                </div>

                <div className="flex justify-end">
                    <Button className="bg-teal-500 hover:bg-teal-600 text-white">Salvar Detalhes da Manutenção</Button>
                </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
