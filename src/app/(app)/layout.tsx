
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
    // Se não estiver autenticado ou estiver em manutenção, redirecionar para login
    // Mas só se não estiver já na página de login (evitar loop)
    if (!isLoading && (!isAuthenticated || isUnderMaintenance)) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    // Verificar permissões de acesso à página atual
    if (isAuthenticated && !isLoading && !isUnderMaintenance) {
      // Todos podem acessar a página inicial (/)
      // A página inicial filtra os cards internamente baseado nas permissões

      // Página de Settings: apenas Administradores
      if (pathname.startsWith('/settings')) {
        if (!isAdmin) {
          router.replace('/');
        }
        return;
      }

      // Verificar permissão para outras páginas (exceto login e página inicial)
      if (pathname !== '/login' && pathname !== '/') {
        const permissionKey = pathname.startsWith('/') ? pathname.substring(1) : pathname;
        if (!hasPermission(permissionKey)) {
          // Redirecionar para página inicial se não tiver permissão
          router.replace('/');
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
                      <div className="flex flex-col flex-1 overflow-hidden text-xs">
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
