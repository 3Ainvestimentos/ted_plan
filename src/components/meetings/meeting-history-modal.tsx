
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RecurringMeeting } from "@/types";
import { cn } from "@/lib/utils";
import { History, Check, X } from "lucide-react";
import { format } from 'date-fns';

interface MeetingHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  meeting: RecurringMeeting;
}

export function MeetingHistoryModal({ isOpen, onOpenChange, meeting }: MeetingHistoryModalProps) {
  if (!meeting) return null;

  const sortedHistory = meeting.occurrenceHistory?.sort((a, b) => new Date(b.executedDate).getTime() - new Date(a.executedDate).getTime()) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-6 w-6" /> Histórico da Reunião
          </DialogTitle>
          <DialogDescription>
            {meeting.name}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
            {sortedHistory.length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                    {sortedHistory.map((occurrence, index) => (
                         <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>
                                Reunião de {format(new Date(occurrence.executedDate), 'dd/MM/yyyy')}
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2">
                                {occurrence.agenda.length > 0 ? occurrence.agenda.map(item => (
                                    <div key={item.id} className="p-3 border rounded-md bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            {item.completed ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500"/>}
                                            <p className={cn("font-medium", item.completed && "line-through text-muted-foreground")}>{item.title}</p>
                                        </div>
                                        <div className="pl-6 text-sm text-muted-foreground space-y-1 mt-1">
                                            {item.action && <p><strong>Ação:</strong> {item.action}</p>}
                                            {item.owner && <p><strong>Responsável:</strong> {item.owner}</p>}
                                            {item.deadline && <p><strong>Prazo:</strong> {format(new Date(item.deadline), 'dd/MM/yyyy')}</p>}
                                            {item.observations && <p className="whitespace-pre-wrap"><strong>Obs:</strong> {item.observations}</p>}
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground">Nenhuma pauta registrada para esta data.</p>}
                                </div>
                            </AccordionContent>
                         </AccordionItem>
                    ))}
                 </Accordion>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nenhum histórico encontrado para esta reunião.</p>
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
