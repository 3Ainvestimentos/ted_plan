
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { UserNav } from '@/components/layout/user-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Logo } from '@/components/icons/logo';

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
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4 flex items-center justify-between">
           <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
            <Logo className="w-8 h-8 text-sidebar-primary" />
            <h1 className="text-xl font-semibold text-sidebar-primary group-data-[collapsible=icon]:hidden">Ted 1.0</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto">
           <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="p-2 -ml-2 text-foreground" /> 
          {/* Header content can go here if needed, e.g. breadcrumbs or global search */}
          <div className="ml-auto flex items-center gap-2">
            {/* Additional header items */}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
