"use client";

import type { Initiative } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { STATUS_ICONS, TREND_ICONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface InitiativeCardProps {
  initiative: Initiative;
  showDetailsLink?: boolean;
}

export function InitiativeCard({ initiative, showDetailsLink = false }: InitiativeCardProps) {
  const StatusIcon = STATUS_ICONS[initiative.status];

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{initiative.title}</CardTitle>
          <Badge variant={initiative.status === 'Concluído' ? 'default' : initiative.status === 'Em Risco' || initiative.status === 'Atrasado' ? 'destructive' : 'secondary'} className="capitalize">
            <StatusIcon className="mr-1 h-4 w-4" />
            {initiative.status}
          </Badge>
        </div>
        <CardDescription>Responsável: {initiative.owner || 'Não atribuído'}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{initiative.description}</p>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm font-medium">{initiative.progress}%</span>
          </div>
          <Progress value={initiative.progress} aria-label={`${initiative.title} progresso ${initiative.progress}%`} />
        </div>
        {initiative.keyMetrics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Métricas Chave</h4>
            <ul className="space-y-1">
              {initiative.keyMetrics.slice(0,2).map(metric => {
                const TrendIcon = TREND_ICONS[metric.trend];
                return (
                  <li key={metric.name} className="text-xs flex justify-between items-center text-muted-foreground">
                    <span>{metric.name}: {metric.value}</span>
                    <TrendIcon className={`h-4 w-4 ${metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        {showDetailsLink ? (
           <Button variant="outline" size="sm" asChild className="w-full">
             <Link href={`/initiatives/${initiative.id}`}>
               Ver Dossiê <ExternalLink className="ml-2 h-4 w-4" />
             </Link>
           </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Última atualização: {new Date(initiative.lastUpdate).toLocaleDateString()}</p>
        )}
      </CardFooter>
    </Card>
  );
}
