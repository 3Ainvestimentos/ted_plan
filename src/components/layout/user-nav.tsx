
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { LogOut, Monitor, Moon, Settings, Shield, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from 'next/link';

export function UserNav() {
  const { logout, isAdmin } = useAuth();
  const { setTheme } = useTheme();

  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;
  const buildDate = buildTimestamp 
    ? new Date(parseInt(buildTimestamp, 10)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'})
    : 'N/A';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="mt-auto" aria-label="Configurações">
          <Settings />
          <span>Configurações</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mb-2" align="start" side="top" forceMount>
         <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span>Tema</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Claro</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Escuro</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Shield className="mr-2 h-4 w-4" />
                <span>Sistema</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
         <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <DropdownMenuItem disabled>
            <span className="text-xs text-muted-foreground">
                Última publicação: {buildDate}
            </span>
         </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
