
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


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isUnderMaintenance } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || isUnderMaintenance)) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isUnderMaintenance, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  const isDashboardPage = pathname === '/dashboard';

  if (isAuthenticated && !isUnderMaintenance) {
    return (
      <InitiativesProvider>
        <MnaDealsProvider>
          <MeetingsProvider>
            <TasksProvider>
              <NotesProvider>
                <SidebarProvider>
                  <div className="flex h-screen bg-background">
                    {!isDashboardPage && (
                      <Sidebar>
                        <SidebarContent>
                          <SidebarNav />
                        </SidebarContent>
                        <SidebarFooter>
                          <UserNav />
                        </SidebarFooter>
                      </Sidebar>
                    )}
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <header className="flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                        {!isDashboardPage && <SidebarTrigger className="sm:hidden" />}
                      </header>
                      <main className="flex-1 overflow-auto p-4 md:p-6">
                        {children}
                      </main>
                       {isDashboardPage && (
                        <footer className="fixed bottom-0 left-0 p-3">
                          <UserNav />
                        </footer>
                      )}
                    </div>
                  </div>
                </SidebarProvider>
              </NotesProvider>
            </TasksProvider>
          </MeetingsProvider>
        </MnaDealsProvider>
      </InitiativesProvider>
    );
  }

  return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
  );
}
