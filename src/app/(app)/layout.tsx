
"use client";

import React, { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { InitiativesProvider } from '@/contexts/initiatives-context';
import { MeetingsProvider } from '@/contexts/meetings-context';
import { UserNav } from '@/components/layout/user-nav';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NotesProvider } from '@/contexts/notes-context';
import { TasksProvider } from '@/contexts/tasks-context';
import { MnaDealsProvider } from '@/contexts/m-and-as-context';

function AppWithSidebar({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

function AppWithoutSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex h-14 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-lg">
        <div className="ml-auto flex items-center gap-2">
          <UserNav />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isUnderMaintenance } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If loading is finished and the user is not authenticated, or if site is under maintenance, redirect to login.
    if (!isLoading && (!isAuthenticated || isUnderMaintenance)) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isUnderMaintenance, router]);

  // While loading, show a spinner to prevent flicker or showing the login page incorrectly.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  const isDashboardPage = pathname === '/dashboard';

  // If authenticated and not under maintenance, render the app content.
  if (isAuthenticated && !isUnderMaintenance) {
    return (
      <InitiativesProvider>
        <MnaDealsProvider>
          <MeetingsProvider>
            <TasksProvider>
              <NotesProvider>
                  {isDashboardPage ? (
                    <AppWithoutSidebar>{children}</AppWithoutSidebar>
                  ) : (
                    <AppWithSidebar>{children}</AppWithSidebar>
                  )}
              </NotesProvider>
            </TasksProvider>
          </MeetingsProvider>
        </MnaDealsProvider>
      </InitiativesProvider>
    );
  }

  // This will be shown briefly while the redirect happens.
  // Can also be a spinner.
  return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
  );
}
