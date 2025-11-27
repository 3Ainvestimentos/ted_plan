
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface DashboardCardProps {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
}

export function DashboardCard({ title, description, href, icon: Icon }: DashboardCardProps) {
  return (
    <Link href={href} className="group">
        <Card className="h-full hover:border-primary transition-colors shadow-sm hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
                <Icon className="w-6 h-6 text-muted-foreground" />
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
