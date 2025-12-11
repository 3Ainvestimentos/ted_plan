
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
import { DevProjectsProvider } from '@/contexts/dev-projects-context';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isUnderMaintenance, isAdmin, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || isUnderMaintenance)) {
      router.replace('/login');
      return;
    }

    // Verificar permissões de acesso à página atual
    if (isAuthenticated && !isLoading && !isUnderMaintenance) {
      // Painel Estratégico: apenas Administradores
      if (pathname === '/') {
        if (!isAdmin) {
          // Redirecionar para primeira página permitida
          router.replace('/strategic-initiatives');
        }
        return;
      }

      // Página de Settings: apenas Administradores
      if (pathname.startsWith('/settings')) {
        if (!isAdmin) {
          router.replace('/strategic-initiatives');
        }
        return;
      }

      // Verificar permissão para outras páginas (exceto login)
      if (pathname !== '/login') {
        const permissionKey = pathname.startsWith('/') ? pathname.substring(1) : pathname;
        if (!hasPermission(permissionKey)) {
          // Redirecionar para primeira página permitida ou dashboard se admin
          if (isAdmin) {
            router.replace('/');
          } else {
            router.replace('/strategic-initiatives');
          }
        }
      }
    }
  }, [isLoading, isAuthenticated, isUnderMaintenance, router, pathname, isAdmin, hasPermission]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  if (isAuthenticated && !isUnderMaintenance) {
    return (
      <InitiativesProvider>
        <MnaDealsProvider>
          <MeetingsProvider>
            <TasksProvider>
              <NotesProvider>
                <DevProjectsProvider>
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
                        </header>
                        <main className="flex-1 overflow-auto p-4 md:p-6">
                          {children}
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                </DevProjectsProvider>
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
