
"use client";

import { useState } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BadgeAlert, CheckCircle, Mail, Trash2, PlusCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';

function MaintenanceSkeleton() {
    return (
        <CardContent className="pt-6">
            <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-20 w-full" />
            </div>
        </CardContent>
    )
}

export function MaintenanceModeManager() {
    const { maintenanceSettings, isLoading, updateMaintenanceSettings, addAdminEmail, removeAdminEmail } = useSettings();
    const [isSaving, setIsSaving] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
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
        if (!newAdminEmail || !/\S+@\S+\.\S+/.test(newAdminEmail)) {
            toast({ variant: 'destructive', title: "E-mail Inválido", description: "Por favor, insira um e-mail válido." });
            return;
        }
        setIsSaving(true);
        try {
            await addAdminEmail(newAdminEmail);
            toast({ title: "Administrador Adicionado", description: `${newAdminEmail} foi adicionado com sucesso.` });
            setNewAdminEmail('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Erro", description: error.message || "Não foi possível adicionar o administrador." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveAdmin = async (email: string) => {
        setIsSaving(true);
        try {
            await removeAdminEmail(email);
            toast({ title: "Administrador Removido", description: `${email} foi removido com sucesso.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Erro", description: error.message || "Não foi possível remover o administrador." });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <CardContent className="pt-6 space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Ativar Modo Manutenção</h3>
                <p className="text-sm text-muted-foreground">
                    Quando ativado, apenas os administradores listados poderão acessar a plataforma. Todos os outros usuários serão redirecionados para uma página de aviso.
                </p>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Switch
                        id="maintenance-mode"
                        checked={maintenanceSettings.isEnabled}
                        onCheckedChange={handleToggleMaintenance}
                        disabled={isSaving}
                    />
                    <Label htmlFor="maintenance-mode" className="flex items-center">
                        {isSaving && <LoadingSpinner className="mr-2 h-4 w-4" />}
                        <span>{maintenanceSettings.isEnabled ? "Modo Manutenção Ativado" : "Modo Manutenção Desativado"}</span>
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
            
            <Separator />

            <div className="space-y-4">
                 <h3 className="text-lg font-medium">Administradores Autorizados</h3>
                 <p className="text-sm text-muted-foreground">
                    Gerencie a lista de e-mails que podem acessar o sistema quando o modo manutenção estiver ativo.
                </p>
                <div className="space-y-2">
                    {maintenanceSettings.adminEmails.map(email => (
                        <div key={email} className="flex items-center justify-between p-2 rounded-md border bg-secondary/50">
                            <span className="text-sm font-medium flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> {email}</span>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveAdmin(email)} disabled={isSaving}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <div className="flex items-center gap-2 pt-2">
                    <Input 
                        type="email" 
                        placeholder="novo.admin@email.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        disabled={isSaving}
                    />
                    <Button onClick={handleAddAdmin} disabled={isSaving || !newAdminEmail}>
                        {isSaving ? <LoadingSpinner /> : <PlusCircle />}
                        <span className="ml-2">Adicionar</span>
                    </Button>
                </div>
            </div>
        </CardContent>
    );
}
