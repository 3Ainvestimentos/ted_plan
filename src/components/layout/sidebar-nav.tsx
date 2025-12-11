
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS_CONFIG } from "@/lib/constants";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types";
import { useAuth } from "@/contexts/auth-context";

export function SidebarNav() {
  const pathname = usePathname();
  const { isAdmin, hasPermission } = useAuth();
  
  const mainNavItems = NAV_ITEMS_CONFIG.filter(item => {
    if (item.isFooter) return false;
    
    // Painel Estratégico é apenas para Administradores
    if (item.href === '/') {
      return isAdmin;
    }
    
    // Demais páginas: verificar permissão específica
    const permissionKey = item.href.startsWith('/') ? item.href.substring(1) : item.href;
    return hasPermission(permissionKey);
  });

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        isActive={item.href !== "/" && pathname.startsWith(item.href)}
        disabled={item.disabled}
        tooltip={{ children: item.title }}
        aria-label={item.title}
      >
       <Link href={item.href}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <div className="flex flex-col h-full">
        <SidebarMenu className="flex-grow">
            {mainNavItems.map(renderNavItem)}
        </SidebarMenu>
    </div>
  );
}
