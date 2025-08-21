

"use client";

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useAuditLog } from '@/contexts/audit-log-context';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { InitiativesProvider } from '@/contexts/initiatives-context';
import { MeetingsProvider } from '@/contexts/meetings-context';
import { StrategicPanelProvider } from '@/contexts/strategic-panel-context';
import { CollaboratorsProvider } from '@/contexts/collaborators-context';
import { UserNav } from '@/components/layout/user-nav';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SettingsProvider, useSettings } from '@/contexts/settings-context';

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { logActivity } = useAuditLog();
  const router = useRouter();
  const loggedActivityRef = useRef(false);

  // Settings and Maintenance
  const { maintenanceSettings, isLoading: isSettingsLoading } = useSettings();
  
  useEffect(() => {
    if (isAuthLoading || isSettingsLoading) {
      return; // Wait for both auth and settings to load
    }
    
    // 1. Check for maintenance mode first
    if (maintenanceSettings?.isEnabled) {
      const isMaintenanceAdmin = maintenanceSettings.adminEmails.includes(user?.email || '');
      if (!isMaintenanceAdmin) {
        router.replace('/maintenance');
        return;
      }
    }

    // 2. If not in maintenance or user is admin, check auth status
    if (!isAuthenticated) {
      router.replace('/login');
    }

  }, [isAuthenticated, isAuthLoading, user, maintenanceSettings, isSettingsLoading, router]);
  
  // Log user activity
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !loggedActivityRef.current) {
        logActivity('login', `User ${user?.email} logged in.`);
        loggedActivityRef.current = true;
    } else if (!isAuthLoading && !isAuthenticated && loggedActivityRef.current) {
        logActivity('logout', `A user logged out.`);
        loggedActivityRef.current = false;
    }
  }, [isAuthenticated, isAuthLoading, user, logActivity]);


  if (isAuthLoading || isSettingsLoading || !isAuthenticated) {
    // Show spinner if loading or if user is not authenticated yet (to prevent flicker before redirect)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner />
      </div>
    );
  }
  
  // Render layout only if everything is loaded and user is authenticated
  return (
      <CollaboratorsProvider>
        <InitiativesProvider>
          <MeetingsProvider>
            <StrategicPanelProvider>
              <SidebarProvider>
                <div className="flex h-screen bg-background">
                  <Sidebar>
                    <SidebarContent>
                      <SidebarNav />
                    </SidebarContent>
                    <SidebarFooter>
                      <UserNav />
                    </SidebarFooter>
                  </Sidebar>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <header className="flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                      <SidebarTrigger className="sm:hidden" />
                      <div className="ml-auto flex items-center gap-2">
                        {/* Additional header items can go here */}
                      </div>
                    </header>
                    <main className="flex-1 overflow-auto p-4 md:p-6">
                      {children}
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </StrategicPanelProvider>
          </MeetingsProvider>
        </InitiativesProvider>
      </CollaboratorsProvider>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SettingsProvider must wrap the content that uses its context.
  return (
    <SettingsProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SettingsProvider>
  );
}
