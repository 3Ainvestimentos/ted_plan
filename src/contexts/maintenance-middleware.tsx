
"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function MaintenanceMiddleware({ children }: { children: React.ReactNode }) {
    const { maintenanceSettings, isLoading: isSettingsLoading } = useSettings();
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isSettingsLoading || isAuthLoading) {
            return; // Wait for both contexts to load
        }

        const isMaintenancePage = pathname === '/maintenance';
        const isLoginPage = pathname === '/login';

        if (maintenanceSettings?.isEnabled) {
            const isAdmin = user && maintenanceSettings.adminEmails.includes(user.email || '');

            if (!isAdmin && !isMaintenancePage) {
                router.replace('/maintenance');
            }
        }
    }, [
        maintenanceSettings, 
        isSettingsLoading, 
        user, 
        isAuthLoading, 
        pathname, 
        router
    ]);

    if (isSettingsLoading || isAuthLoading) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <LoadingSpinner />
            </div>
        );
    }
    
    return <>{children}</>;
}
