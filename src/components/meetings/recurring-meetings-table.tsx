
"use client";

import React, { useState } from 'react';
import type { RecurringMeeting } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { format, addDays, addMonths, addWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RecurringMeetingsTableProps {
  meetings: RecurringMeeting[];
  setMeetings: React.Dispatch<React.SetStateAction<RecurringMeeting[]>>;
}

export function RecurringMeetingsTable({ meetings, setMeetings }: RecurringMeetingsTableProps) {
  const { toast } = useToast();

  const handleDateChange = (meetingId: string, newDate: Date) => {
    setMeetings(prevMeetings =>
      prevMeetings.map(m =>
        m.id === meetingId ? { ...m, executedDate: newDate.toISOString().split('T')[0] } : m
      )
    );
  };

  const calculateNextDueDate = (meeting: RecurringMeeting): Date => {
    const lastDate = new Date(meeting.executedDate || meeting.lastOccurrence);
    switch (meeting.recurrence.unit) {
      case 'dias':
        return addDays(lastDate, meeting.recurrence.value);
      case 'semanas':
        return addWeeks(lastDate, meeting.recurrence.value);
      case 'meses':
        return addMonths(lastDate, meeting.recurrence.value);
      default:
        return lastDate;
    }
  };

  const handleMarkAsDone = (meetingId: string) => {
    setMeetings(prevMeetings => {
      return prevMeetings.map(m => {
        if (m.id === meetingId) {
          if (!m.executedDate) {
            toast({
              variant: "destructive",
              title: "Data não selecionada",
              description: "Por favor, selecione a data em que a reunião foi realizada.",
            });
            return m; 
          }
          const nextDueDate = calculateNextDueDate(m);
          toast({
            title: "Reunião Concluída!",
            description: `A reunião "${m.name}" foi marcada como feita. Próxima data: ${format(nextDueDate, 'dd/MM/yyyy')}`,
          });
          return {
            ...m,
            lastOccurrence: m.executedDate,
            executedDate: undefined,
            isDone: false, // Reset for the next cycle
          };
        }
        return m;
      });
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
              <TableHead className="text-center">Reunião Feita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => {
              const nextDueDate = calculateNextDueDate(meeting);
              return (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium">{meeting.name}</TableCell>
                  <TableCell>{format(new Date(meeting.lastOccurrence), 'dd/MM/yyyy')}</TableCell>
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
                          {meeting.executedDate ? format(new Date(meeting.executedDate), 'dd/MM/yyyy') : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={meeting.executedDate ? new Date(meeting.executedDate) : undefined}
                          onSelect={(date) => handleDateChange(meeting.id, date as Date)}
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
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
