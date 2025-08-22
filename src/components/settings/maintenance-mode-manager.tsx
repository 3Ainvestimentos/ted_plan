
"use client";

import { useState } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BadgeAlert, CheckCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '../ui/loading-spinner';

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
    const { maintenanceSettings, isLoading, updateMaintenanceSettings } = useSettings();
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

    return (
        <CardContent className="pt-6">
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
        </CardContent>
    );
}
