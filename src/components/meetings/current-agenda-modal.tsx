
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMeetings } from "@/contexts/meetings-context";
import type { RecurringMeeting, AgendaItem } from "@/types";
import { cn } from "@/lib/utils";
import { ListChecks } from "lucide-react";
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface CurrentAgendaModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  meeting: RecurringMeeting;
}

export function CurrentAgendaModal({ isOpen, onOpenChange, meeting }: CurrentAgendaModalProps) {
  const { updateAgendaItem } = useMeetings();
  const [localAgenda, setLocalAgenda] = useState<AgendaItem[]>([]);

  useEffect(() => {
      if (meeting) {
        setLocalAgenda(meeting.currentOccurrenceAgenda || []);
      }
  }, [meeting]);

  if (!meeting) return null;

  const handleFieldChange = (itemId: string, field: keyof AgendaItem, value: any) => {
    setLocalAgenda(prev => 
        prev.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
        )
    );
  };

  const handleSaveChanges = () => {
    updateAgendaItem(meeting.id, localAgenda);
    onOpenChange(false);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6" /> Pauta da Reunião
          </DialogTitle>
          <DialogDescription>
            {meeting.name} - {meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Não Agendada'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
             {localAgenda && localAgenda.length > 0 ? (
                localAgenda.map(item => (
                    <div key={item.id} className="flex flex-col gap-2 rounded-md border p-4 hover:bg-muted/50">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id={`agenda-${meeting.id}-${item.id}`}
                                checked={item.completed}
                                onCheckedChange={(checked) => handleFieldChange(item.id, 'completed', !!checked)}
                                className="mt-1"
                            />
                            <label
                                htmlFor={`agenda-${meeting.id}-${item.id}`}
                                className={cn("text-base font-medium w-full cursor-pointer", item.completed && "line-through text-muted-foreground")}
                            >
                                {item.title}
                            </label>
                        </div>
                        <div className="pl-7 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                                <Label htmlFor={`action-${item.id}`} className="text-xs">Ação</Label>
                                <Input 
                                    id={`action-${item.id}`}
                                    value={item.action || ''} 
                                    onChange={(e) => handleFieldChange(item.id, 'action', e.target.value)}
                                    className="h-8"
                                />
                            </div>
                             <div>
                                <Label htmlFor={`owner-${item.id}`} className="text-xs">Responsável</Label>
                                <Input 
                                    id={`owner-${item.id}`}
                                    value={item.owner || ''} 
                                    onChange={(e) => handleFieldChange(item.id, 'owner', e.target.value)}
                                    className="h-8"
                                />
                            </div>
                            <div>
                                <Label htmlFor={`deadline-${item.id}`} className="text-xs">Prazo</Label>
                                <Input 
                                    type="date"
                                    id={`deadline-${item.id}`}
                                    value={item.deadline || ''} 
                                    onChange={(e) => handleFieldChange(item.id, 'deadline', e.target.value)}
                                    className="h-8"
                                />
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma pauta definida para esta reunião.
                </p>
            )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
