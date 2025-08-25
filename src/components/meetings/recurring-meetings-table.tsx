
"use client";

import React, { useState } from 'react';
import type { RecurringMeeting } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, CheckCircle2, ListChecks, Settings, History } from 'lucide-react';
import { format, addDays, addMonths, addWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMeetings } from '@/contexts/meetings-context';
import { UpsertMeetingModal } from './upsert-meeting-modal';
import { CurrentAgendaModal } from './current-agenda-modal';

export function RecurringMeetingsTable() {
  const { toast } = useToast();
  const { meetings, updateMeeting, markMeetingAsDone } = useMeetings();
  const [editingMeeting, setEditingMeeting] = useState<RecurringMeeting | null>(null);
  const [agendaMeeting, setAgendaMeeting] = useState<RecurringMeeting | null>(null);

  const handleDateChange = (meetingId: string, newDate: Date | undefined) => {
    if (!newDate) return;
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    const updatedMeeting = { scheduledDate: newDate.toISOString().split('T')[0] };
    updateMeeting(meetingId, updatedMeeting);
  };

  const handleMarkAsDone = (meeting: RecurringMeeting) => {
    if (!meeting.scheduledDate) {
      toast({
        variant: "destructive",
        title: "Data não selecionada",
        description: "Por favor, selecione a data em que a reunião foi realizada.",
      });
      return;
    }

    markMeetingAsDone(meeting);
    
    const nextDueDate = calculateNextDueDate(meeting);
    toast({
        title: "Reunião Concluída!",
        description: `A reunião "${meeting.name}" foi marcada como feita. Próxima data prevista: ${format(nextDueDate, 'dd/MM/yyyy')}`,
    });
  };
  
  const calculateNextDueDate = (meeting: RecurringMeeting): Date => {
    const lastDate = new Date(meeting.lastOccurrence);
    const lastDateLocal = new Date(lastDate.valueOf() + lastDate.getTimezoneOffset() * 60 * 1000);

    switch (meeting.recurrence.unit) {
      case 'dias':
        return addDays(lastDateLocal, meeting.recurrence.value);
      case 'semanas':
        return addWeeks(lastDateLocal, meeting.recurrence.value);
      case 'meses':
        return addMonths(lastDateLocal, meeting.recurrence.value);
      default:
        return lastDateLocal;
    }
  };


  return (
    <>
    {editingMeeting && (
        <UpsertMeetingModal
            isOpen={!!editingMeeting}
            onOpenChange={() => setEditingMeeting(null)}
            meeting={editingMeeting}
        />
    )}
    {agendaMeeting && (
        <CurrentAgendaModal
            isOpen={!!agendaMeeting}
            onOpenChange={() => setAgendaMeeting(null)}
            meeting={agendaMeeting}
        />
    )}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Controle de Reuniões Recorrentes</CardTitle>
        <CardDescription>Gerencie o ciclo de suas reuniões estratégicas para garantir a execução contínua.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Tipo de Reunião</TableHead>
              <TableHead>Última Ocorrência</TableHead>
              <TableHead>Próxima Data Prevista</TableHead>
              <TableHead>Data Agendada</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.length > 0 ? meetings.map((meeting) => {
              const nextDueDate = calculateNextDueDate(meeting);
              const lastOccurrenceDate = new Date(meeting.lastOccurrence);
              const lastOccurrenceLocal = new Date(lastOccurrenceDate.valueOf() + lastOccurrenceDate.getTimezoneOffset() * 60 * 1000);

              const scheduledDateObj = meeting.scheduledDate ? new Date(meeting.scheduledDate) : undefined;
              if (scheduledDateObj) {
                  scheduledDateObj.setTime(scheduledDateObj.valueOf() + scheduledDateObj.getTimezoneOffset() * 60 * 1000);
              }

              const hasAgenda = meeting.agenda && meeting.agenda.length > 0;

              return (
                <React.Fragment key={meeting.id}>
                    <TableRow>
                    <TableCell className="font-medium">
                        {meeting.name}
                    </TableCell>
                    <TableCell>{format(lastOccurrenceLocal, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{format(nextDueDate, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-[200px] justify-start text-left font-normal",
                                !meeting.scheduledDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDateObj ? format(scheduledDateObj, 'dd/MM/yyyy') : <span>Selecione a data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={scheduledDateObj}
                            onSelect={(date) => handleDateChange(meeting.id, date)}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                        {hasAgenda && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAgendaMeeting(meeting)}
                            >
                                <ListChecks className="mr-2 h-4 w-4" /> Pauta
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={() => handleMarkAsDone(meeting)}
                            disabled={!meeting.scheduledDate}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Reunião Realizada
                        </Button>
                         <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMeeting(meeting)}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Gerenciar
                        </Button>
                    </TableCell>
                    </TableRow>
                </React.Fragment>
              );
            }) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                        Nenhuma reunião recorrente cadastrada.
                        </TableCell>
                    </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
