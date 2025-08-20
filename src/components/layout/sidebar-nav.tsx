
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

export function SidebarNav() {
  const pathname = usePathname();
  
  const mainNavItems = NAV_ITEMS_CONFIG.filter(item => !item.isFooter);

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
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
