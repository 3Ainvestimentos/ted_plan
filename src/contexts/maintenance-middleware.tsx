
"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function MaintenanceMiddleware({ children }: { children: React.ReactNode }) {
    const { maintenanceSettings, isLoading: isSettingsLoading } = useSettings();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isLoading = isSettingsLoading || isAuthLoading;

    useEffect(() => {
        if (isLoading) {
            return; // Wait until all contexts are loaded
        }

        const isMaintenancePage = pathname === '/maintenance';
        const isLoginPage = pathname === '/login';

        // 1. Check for maintenance mode
        if (maintenanceSettings?.isEnabled) {
            const isAdmin = user && maintenanceSettings.adminEmails.includes(user.email || '');
            if (!isAdmin && !isMaintenancePage) {
                router.replace('/maintenance');
                return; 
            }
        }
        
        // 2. Check for authentication
        if (isAuthenticated) {
            // User is authenticated
            if (isLoginPage) {
                // If user is on login page, redirect to the main app
                 router.replace('/strategic-panel');
                 return;
            }
            // Otherwise, they can access the requested page (if not under maintenance for non-admins)
        } else {
            // User is not authenticated
            if (!isLoginPage && !isMaintenancePage) {
                 // If not on login or maintenance page, redirect to login
                router.replace('/login');
                return;
            }
        }

    }, [isLoading, isAuthenticated, maintenanceSettings, user, pathname, router]);

    // Show a global loading spinner while we determine the correct route
    if (isLoading) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <LoadingSpinner className="h-12 w-12" />
            </div>
        );
    }
    
    // If all checks pass, render the requested page
    return <>{children}</>;
}
