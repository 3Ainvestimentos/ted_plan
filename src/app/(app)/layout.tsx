
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { InitiativesProvider } from '@/contexts/initiatives-context';
import { MeetingsProvider } from '@/contexts/meetings-context';
import { UserNav } from '@/components/layout/user-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-4 rounded-lg text-foreground">Carregando...</div>
      </div>
    );
  }
  
  return (
    <InitiativesProvider>
      <MeetingsProvider>
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
      </MeetingsProvider>
    </InitiativesProvider>
  );
}
