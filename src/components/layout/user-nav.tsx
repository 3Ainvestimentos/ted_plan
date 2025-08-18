"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { USER_ROLES } from "@/lib/constants";
import type { UserRole } from "@/types";
import { LogOut, Settings, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function UserNav() {
  const { userRole, setUserRole, logout, isAuthenticated } = useAuth();
  const { open } = useSidebar();

  if (!isAuthenticated) {
    return null; 
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Mock user data based on role
  const userName = userRole === "PMO" ? "Patricia M. Oliveira" : userRole === "Líder" ? "Leo Dirigente" : "Carlos Contribuidor";
  const userEmail = userRole.toLowerCase().replace('ç', 'c').replace('í', 'i') + "@tedapp.com";


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start items-center text-left p-2 h-auto text-sidebar-foreground hover:bg-sidebar-accent">
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(userName)}`} alt={userName} data-ai-hint="profile avatar" />
              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
            </Avatar>
            <div className={cn("flex-col items-start", open ? "flex" : "hidden")}>
              <span className="text-sm font-medium leading-none">{userName}</span>
              <span className="text-xs text-sidebar-foreground/70 leading-none mt-1">{userRole}</span>
            </div>
            <ChevronUp className={cn("h-4 w-4 text-sidebar-foreground/70 ml-auto", open ? "block" : "hidden")} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mb-2" align="start" side="top" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Mudar Papel (Demo)</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={userRole} onValueChange={(value) => setUserRole(value as UserRole)}>
          {USER_ROLES.map((role) => (
            <DropdownMenuRadioItem key={role} value={role}>
              {role}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
