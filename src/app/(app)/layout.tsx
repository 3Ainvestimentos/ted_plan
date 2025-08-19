
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { NAV_ITEMS_CONFIG } from '@/lib/constants';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { InitiativesProvider } from '@/contexts/initiatives-context';
import { ContentCalendarProvider } from '@/contexts/content-calendar-context';

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

  const settingsItem = NAV_ITEMS_CONFIG.find(item => item.href === '/settings');
  
  return (
    <InitiativesProvider>
      <ContentCalendarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <SidebarProvider defaultOpen>
            <Sidebar>
              <SidebarContent>
                <SidebarNav />
              </SidebarContent>
              <SidebarFooter className="p-2 mt-auto">
                {settingsItem && (
                  <SidebarMenu>
                        <SidebarMenuItem>
                          <Link href={settingsItem.href} passHref>
                              <SidebarMenuButton
                              tooltip={{content: settingsItem.title, hidden: true}}
                              aria-label={settingsItem.title}
                              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary"
                              >
                              <settingsItem.icon className="h-5 w-5" />
                              <span className="truncate group-data-[collapsible=icon]:hidden">{settingsItem.title}</span>
                              </SidebarMenuButton>
                          </Link>
                      </SidebarMenuItem>
                  </SidebarMenu>
                )}
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
        </div>
      </ContentCalendarProvider>
    </InitiativesProvider>
  );
}
