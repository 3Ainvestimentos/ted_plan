
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowRight, Handshake, Target, CalendarClock, ClipboardList, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
    Handshake,
    Target,
    CalendarClock,
    ClipboardList,
    StickyNote
};

interface DashboardCardProps {
    title: string;
    description: string;
    href: string;
    iconName: string;
}

export function DashboardCard({ title, description, href, iconName }: DashboardCardProps) {
  const Icon = iconMap[iconName];

  return (
    <Link href={href} className="group">
        <Card className="h-full hover:border-primary transition-colors shadow-sm hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{title}</CardTitle>
                {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
            <div className="flex items-center p-6 pt-0">
                <div className="text-sm font-medium text-primary flex items-center gap-2">
                    Acessar
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Card>
    </Link>
  );
}
