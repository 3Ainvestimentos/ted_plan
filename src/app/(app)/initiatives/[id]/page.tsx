
"use client";

import { useParams } from 'next/navigation';
import { STATUS_ICONS, TREND_ICONS } from '@/lib/constants';
import { useInitiatives } from '@/contexts/initiatives-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit3, MessageSquare, Paperclip, Users, CalendarDays, BarChart3 } from 'lucide-react';
import Image from 'next/image';

export default function InitiativeDossierPage() {
  const { id } = useParams() as { id: string };
  const { initiatives } = useInitiatives();

  const initiative = initiatives.find(init => init.id === id);

  if (!initiative) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 className="text-2xl font-semibold">Iniciativa não encontrada</h1>
        <Button asChild variant="link" className="mt-4">
          <Link href="/initiatives">Voltar para iniciativas</Link>
        </Button>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[initiative.status];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/initiatives">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Iniciativas
          </Link>
        </Button>
        <Button size="sm">
          <Edit3 className="mr-2 h-4 w-4" /> Editar Iniciativa
        </Button>
      </div>

      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-48 w-full">
          <Image 
            src={`https://placehold.co/1200x300.png`} 
            alt={`${initiative.title} banner`}
            layout="fill"
            objectFit="cover"
            data-ai-hint="project banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <CardTitle className="text-3xl font-headline text-white">{initiative.title}</CardTitle>
            <div className="mt-1">
              <Badge variant={initiative.status === 'Concluído' ? 'default' : initiative.status === 'Em Risco' || initiative.status === 'Atrasado' ? 'destructive' : 'secondary'} className="capitalize bg-opacity-80 backdrop-blur-sm">
                <StatusIcon className="mr-1 h-4 w-4" />
                {initiative.status}
              </Badge>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-2 text-foreground/90">Descrição</h3>
              <p className="text-foreground/80 whitespace-pre-line">{initiative.description}</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2 text-foreground/90">Progresso</h3>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className="text-sm font-medium">{initiative.progress}%</span>
              </div>
              <Progress value={initiative.progress} aria-label={`${initiative.title} progresso ${initiative.progress}%`} className="h-3"/>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2 text-foreground/90">Métricas Chave</h3>
              {initiative.keyMetrics.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {initiative.keyMetrics.map(metric => {
                    const TrendIcon = TREND_ICONS[metric.trend];
                    return (
                      <Card key={metric.name} className="bg-secondary/50">
                        <CardHeader className="pb-2">
                          <CardDescription className="text-xs">{metric.name}</CardDescription>
                          <CardTitle className="text-2xl">{metric.value}</CardTitle>
                        </CardHeader>
                        <CardFooter>
                           <TrendIcon className={`h-4 w-4 mr-1 ${metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : ''}`} />
                           <p className="text-xs text-muted-foreground">{metric.trend === 'up' ? 'Melhorando' : metric.trend === 'down' ? 'Piorando' : 'Estável'}</p>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground">Nenhuma métrica chave definida para esta iniciativa.</p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <Card className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="text-lg">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong className="text-foreground/80">Responsável:</strong> {initiative.owner}</p>
                <p><strong className="text-foreground/80">Última Atualização:</strong> {new Date(initiative.lastUpdate).toLocaleDateString()}</p>
                 <p><strong className="text-foreground/80">Membros da Equipe:</strong> <span className="text-muted-foreground">John D., Jane S., Mike L.</span></p>
                 <p><strong className="text-foreground/80">Conclusão Alvo:</strong> <span className="text-muted-foreground">31 de Dez, 2024</span></p>
              </CardContent>
            </Card>
            
            <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Equipe e Partes Interessadas</Button>
                <Button variant="outline" className="w-full justify-start"><BarChart3 className="mr-2 h-4 w-4" /> Relatórios Detalhados</Button>
                <Button variant="outline" className="w-full justify-start"><Paperclip className="mr-2 h-4 w-4" /> Documentos (3)</Button>
                <Button variant="outline" className="w-full justify-start"><MessageSquare className="mr-2 h-4 w-4" /> Discussões (12)</Button>
            </div>
          </aside>
        </CardContent>
      </Card>
    </div>
  );
}
