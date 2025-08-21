

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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { logActivity } = useAuditLog();
  const router = useRouter();
  const loggedActivityRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // This effect handles logging user login/logout activity.
    if (!isLoading && user && !loggedActivityRef.current) {
        // User has just logged in
        logActivity('login', `User ${user.email} logged in.`);
        loggedActivityRef.current = true;
    } else if (!isLoading && !user && loggedActivityRef.current) {
        // User has just logged out
        // Note: We can't get user email here as user is null. The logout function in auth-context should handle this if email is needed.
        logActivity('logout', `A user logged out.`);
        loggedActivityRef.current = false;
    }
  }, [isAuthenticated, isLoading, user, logActivity]);


  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner />
      </div>
    );
  }
  
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
