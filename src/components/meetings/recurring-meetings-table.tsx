
"use client";

import React from 'react';
import type { RecurringMeeting } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { format, addDays, addMonths, addWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMeetings } from '@/contexts/meetings-context';

export function RecurringMeetingsTable() {
  const { toast } = useToast();
  const { meetings, updateMeeting } = useMeetings();

  const handleDateChange = (meetingId: string, newDate: Date | undefined) => {
    if (!newDate) return;
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    const updatedMeeting = { ...meeting, executedDate: newDate.toISOString().split('T')[0] };
    updateMeeting(meetingId, updatedMeeting);
  };

  const calculateNextDueDate = (meeting: RecurringMeeting): Date => {
    const lastDate = new Date(meeting.lastOccurrence);
    // As `new Date` might interpret YYYY-MM-DD as UTC, adjust for timezone
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

  const handleMarkAsDone = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    if (!meeting.executedDate) {
      toast({
        variant: "destructive",
        title: "Data não selecionada",
        description: "Por favor, selecione a data em que a reunião foi realizada.",
      });
      return;
    }

    const nextDueDate = calculateNextDueDate(meeting);
    const updatedMeeting = {
      ...meeting,
      lastOccurrence: meeting.executedDate,
      executedDate: undefined,
    };
    updateMeeting(meetingId, updatedMeeting);

    toast({
        title: "Reunião Concluída!",
        description: `A reunião "${meeting.name}" foi marcada como feita. Próxima data: ${format(nextDueDate, 'dd/MM/yyyy')}`,
    });
  };

  return (
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
              <TableHead>Data Executada</TableHead>
              <TableHead className="text-center">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.length > 0 ? meetings.map((meeting) => {
              const nextDueDate = calculateNextDueDate(meeting);
              const lastOccurrenceDate = new Date(meeting.lastOccurrence);
              const lastOccurrenceLocal = new Date(lastOccurrenceDate.valueOf() + lastOccurrenceDate.getTimezoneOffset() * 60 * 1000);

              const executedDateObj = meeting.executedDate ? new Date(meeting.executedDate) : undefined;
              if (executedDateObj) {
                  executedDateObj.setTime(executedDateObj.valueOf() + executedDateObj.getTimezoneOffset() * 60 * 1000);
              }

              return (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium">{meeting.name}</TableCell>
                  <TableCell>{format(lastOccurrenceLocal, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(nextDueDate, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !meeting.executedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {executedDateObj ? format(executedDateObj, 'dd/MM/yyyy') : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={executedDateObj}
                          onSelect={(date) => handleDateChange(meeting.id, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsDone(meeting.id)}
                      disabled={!meeting.executedDate}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como Feita
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                       Nenhum comitê recorrente cadastrado.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
