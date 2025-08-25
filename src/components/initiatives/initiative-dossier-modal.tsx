
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { STATUS_ICONS, TREND_ICONS } from '@/lib/constants';
import { useInitiatives } from '@/contexts/initiatives-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Edit3, MessageSquare, Paperclip, Users, BarChart3, CheckCircle, ListChecks } from 'lucide-react';
import type { Initiative } from "@/types";
import { EditInitiativeModal } from './edit-initiative-modal';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';


interface InitiativeDossierModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initiative: Initiative;
}

export function InitiativeDossierModal({ isOpen, onOpenChange, initiative }: InitiativeDossierModalProps) {
    const { updateSubItem } = useInitiatives();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    if (!initiative) return null;

    const StatusIcon = STATUS_ICONS[initiative.status];
    const hasSubItems = initiative.subItems && initiative.subItems.length > 0;

    const handleSubItemToggle = (subItemId: string, completed: boolean) => {
        updateSubItem(initiative.id, subItemId, completed);
    };

    return (
        <>
        {isEditModalOpen && (
            <EditInitiativeModal
                isOpen={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                initiative={initiative}
            />
        )}
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-headline text-foreground">{initiative.title}</DialogTitle>
                            <DialogDescription className="mt-1">
                               Dossiê completo da iniciativa.
                            </DialogDescription>
                        </div>
                        <Button size="sm" onClick={() => setIsEditModalOpen(true)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Editar Iniciativa
                        </Button>
                    </div>
                     <div className="mt-2">
                        <Badge variant={initiative.status === 'Concluído' ? 'default' : initiative.status === 'Em Risco' || initiative.status === 'Atrasado' ? 'destructive' : 'secondary'} className="capitalize">
                            <StatusIcon className="mr-1 h-4 w-4" />
                            {initiative.status}
                        </Badge>
                    </div>
                </DialogHeader>
                
                <div className="p-0 grid md:grid-cols-3 gap-6 mt-4">
                  <div className="md:col-span-2 space-y-6">
                    <section>
                      <h3 className="text-xl font-headline mb-2 text-foreground/90">Descrição</h3>
                      <p className="text-foreground/80 whitespace-pre-line">{initiative.description}</p>
                    </section>

                    <section>
                      <h3 className="text-xl font-headline mb-2 text-foreground/90">Progresso</h3>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Progresso Geral</span>
                        <span className="text-sm font-medium">{initiative.progress}%</span>
                      </div>
                      <Progress value={initiative.progress} aria-label={`${initiative.title} progresso ${initiative.progress}%`} className="h-3" />
                    </section>

                    {hasSubItems && (
                        <section>
                            <h3 className="text-xl font-headline mb-2 text-foreground/90 flex items-center gap-2"><ListChecks className="w-5 h-5"/> Checklist</h3>
                            <div className="space-y-2 rounded-md border p-4">
                                {initiative.subItems?.map(subItem => (
                                     <div key={subItem.id} className="flex items-center gap-3">
                                        <Checkbox 
                                            id={`dossier-subitem-${subItem.id}`}
                                            checked={subItem.completed} 
                                            onCheckedChange={(checked) => handleSubItemToggle(subItem.id, !!checked)}
                                        />
                                        <label htmlFor={`dossier-subitem-${subItem.id}`} className={cn("text-sm", subItem.completed && "line-through text-muted-foreground")}>
                                            {subItem.title}
                                        </label>
                                     </div>
                                ))}
                            </div>
                        </section>
                    )}


                    <section>
                      <h3 className="text-xl font-headline mb-2 text-foreground/90">Métricas Chave</h3>
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
                        <h3 className="text-lg font-headline">Detalhes</h3>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <p><strong className="text-foreground/80">Prioridade:</strong> {initiative.priority}</p>
                        <p><strong className="text-foreground/80">Responsável:</strong> {initiative.owner}</p>
                        <p><strong className="text-foreground/80">Última Atualização:</strong> {new Date(initiative.lastUpdate).toLocaleDateString()}</p>
                        <p><strong className="text-foreground/80">Conclusão Alvo:</strong> <span className="text-muted-foreground">{initiative.deadline ? new Date(initiative.deadline).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/D'}</span></p>
                      </CardContent>
                    </Card>
                    
                    <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start"><Paperclip className="mr-2 h-4 w-4" /> Documentos (3)</Button>
                    </div>
                  </aside>
                </div>

            </DialogContent>
        </Dialog>
        </>
    );
}
