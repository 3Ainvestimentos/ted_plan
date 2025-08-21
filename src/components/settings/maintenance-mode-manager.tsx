
"use client";

import { useState } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BadgeAlert, CheckCircle, Mail, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '../ui/loading-spinner';

function MaintenanceSkeleton() {
    return (
        <CardContent className="pt-6 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </CardContent>
    )
}

export function MaintenanceModeManager() {
    const { maintenanceSettings, isLoading, updateMaintenanceSettings } = useSettings();
    const [newEmail, setNewEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    if (isLoading || !maintenanceSettings) {
        return <MaintenanceSkeleton />;
    }

    const handleToggleMaintenance = async (isEnabled: boolean) => {
        setIsSaving(true);
        try {
            await updateMaintenanceSettings({ isEnabled });
            toast({
                title: "Modo Manutenção Atualizado",
                description: `O modo manutenção foi ${isEnabled ? 'ativado' : 'desativado'}.`,
            });
        } catch {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível atualizar o modo manutenção." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAdmin = async () => {
        if (newEmail && !maintenanceSettings.adminEmails.includes(newEmail) && newEmail.includes('@')) {
            setIsSaving(true);
            const updatedEmails = [...maintenanceSettings.adminEmails, newEmail];
            try {
                await updateMaintenanceSettings({ adminEmails: updatedEmails });
                toast({ title: "Administrador Adicionado", description: `${newEmail} foi adicionado à lista.`});
                setNewEmail('');
            } catch {
                 toast({ variant: 'destructive', title: "Erro", description: "Não foi possível adicionar o administrador." });
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleRemoveAdmin = async (emailToRemove: string) => {
        setIsSaving(true);
        const updatedEmails = maintenanceSettings.adminEmails.filter(email => email !== emailToRemove);
        try {
            await updateMaintenanceSettings({ adminEmails: updatedEmails });
            toast({ title: "Administrador Removido", description: `${emailToRemove} foi removido da lista.`});
        } catch {
             toast({ variant: 'destructive', title: "Erro", description: "Não foi possível remover o administrador." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <CardContent className="pt-6 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Ativar Modo Manutenção</h3>
                <p className="text-sm text-muted-foreground">
                    Quando ativado, apenas os administradores listados poderão acessar a plataforma. Todos os outros usuários serão redirecionados para uma página de aviso.
                </p>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="maintenance-mode"
                        checked={maintenanceSettings.isEnabled}
                        onCheckedChange={handleToggleMaintenance}
                        disabled={isSaving}
                    />
                    <Label htmlFor="maintenance-mode">
                        {isSaving ? <LoadingSpinner className="h-4 w-4" /> : maintenanceSettings.isEnabled ? "Modo Manutenção Ativado" : "Modo Manutenção Desativado"}
                    </Label>
                </div>
                {maintenanceSettings.isEnabled ? (
                        <Alert variant="destructive">
                        <BadgeAlert className="h-4 w-4" />
                        <AlertTitle>Plataforma em Manutenção!</AlertTitle>
                        <AlertDescription>
                            O acesso está restrito aos administradores.
                        </AlertDescription>
                    </Alert>
                ) : (
                        <Alert variant="default" className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                        <AlertTitle className="text-green-800 dark:text-green-300">Plataforma Operacional</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
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
                        disabled={isSaving}
                    />
                    <Button onClick={handleAddAdmin} disabled={!newEmail || isSaving}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                </div>
                <div className="space-y-2 rounded-md border p-2 min-h-[10rem]">
                    <h4 className="text-sm font-medium px-2">Lista de Admins</h4>
                    {maintenanceSettings.adminEmails.length > 0 ? (
                        <ul className="divide-y">
                            {maintenanceSettings.adminEmails.map(email => (
                                <li key={email} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{email}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveAdmin(email)} disabled={isSaving}>
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
    );
}
