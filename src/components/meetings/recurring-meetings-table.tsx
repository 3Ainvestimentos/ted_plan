

"use client";

import React, { useState, useMemo } from 'react';
import type { RecurringMeeting } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, CheckCircle2, ListChecks, Settings, History, ArrowUpDown, Filter } from 'lucide-react';
import { format, addDays, addMonths, addWeeks, isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMeetings } from '@/contexts/meetings-context';
import { UpsertMeetingModal } from './upsert-meeting-modal';
import { CurrentAgendaModal } from './current-agenda-modal';
import { MeetingHistoryModal } from './meeting-history-modal';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import { Input } from '../ui/input';

type SortableKeys = 'name' | 'lastOccurrence' | 'nextDueDate';

export function RecurringMeetingsTable() {
  const { toast } = useToast();
  const { meetings, updateMeeting, markMeetingAsDone } = useMeetings();
  const [editingMeeting, setEditingMeeting] = useState<RecurringMeeting | null>(null);
  const [agendaMeeting, setAgendaMeeting] = useState<RecurringMeeting | null>(null);
  const [historyMeeting, setHistoryMeeting] = useState<RecurringMeeting | null>(null);
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'nextDueDate', direction: 'ascending'});


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
    // Adjust for timezone issues when creating date from string
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
  
  const sortedAndFilteredMeetings = useMemo(() => {
    let filtered = meetings.filter(meeting => meeting.name.toLowerCase().includes(filterText.toLowerCase()));

    if (sortConfig !== null) {
        filtered.sort((a, b) => {
            let aValue: string | number, bValue: string | number;

            if (sortConfig.key === 'nextDueDate') {
                aValue = calculateNextDueDate(a).getTime();
                bValue = calculateNextDueDate(b).getTime();
            } else if (sortConfig.key === 'lastOccurrence') {
                 aValue = new Date(a[sortConfig.key]).getTime();
                 bValue = new Date(b[sortConfig.key]).getTime();
            } else {
                 aValue = a.name;
                 bValue = b.name;
            }

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }

    return filtered;
  }, [meetings, filterText, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
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
    {historyMeeting && (
        <MeetingHistoryModal
            isOpen={!!historyMeeting}
            onOpenChange={() => setHistoryMeeting(null)}
            meeting={historyMeeting}
        />
    )}
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Controle de Reuniões Recorrentes</CardTitle>
        <CardDescription>Gerencie o ciclo de suas reuniões estratégicas para garantir a execução contínua.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 p-4 border rounded-lg bg-card shadow-sm mb-4">
            <div className="relative flex-grow">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                 <Input 
                    placeholder="Filtrar por tipo de reunião..." 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">
                 <Button variant="ghost" onClick={() => requestSort('name')}>
                    Tipo de Reunião
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Recorrência</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('lastOccurrence')}>
                    Última Ocorrência
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('nextDueDate')}>
                    Próxima Data Prevista
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[220px]">Data Agendada</TableHead>
              <TableHead className="text-center w-[180px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredMeetings.length > 0 ? sortedAndFilteredMeetings.map((meeting) => {
              const nextDueDate = calculateNextDueDate(meeting);
              const lastOccurrenceDate = new Date(meeting.lastOccurrence);
              const lastOccurrenceLocal = new Date(lastOccurrenceDate.valueOf() + lastOccurrenceDate.getTimezoneOffset() * 60 * 1000);

              const scheduledDateObj = meeting.scheduledDate ? new Date(meeting.scheduledDate) : undefined;
              if (scheduledDateObj) {
                  scheduledDateObj.setTime(scheduledDateObj.valueOf() + scheduledDateObj.getTimezoneOffset() * 60 * 1000);
              }
              
              const isOverdue = isBefore(nextDueDate, startOfToday()) && !meeting.scheduledDate;

              const hasAgenda = meeting.agenda && meeting.agenda.length > 0;
              const hasHistory = meeting.occurrenceHistory && meeting.occurrenceHistory.length > 0;

              return (
                <React.Fragment key={meeting.id}>
                    <TableRow>
                    <TableCell className="font-medium">
                        {meeting.name}
                    </TableCell>
                    <TableCell>
                        A cada {meeting.recurrence.value} {meeting.recurrence.unit}
                    </TableCell>
                    <TableCell>{format(lastOccurrenceLocal, 'dd/MM/yyyy')}</TableCell>
                    <TableCell className={cn(isOverdue && 'text-destructive font-bold')}>
                        {format(nextDueDate, 'dd/MM/yyyy')}
                    </TableCell>
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
                    <TableCell className="text-center">
                        <div className="flex justify-center space-x-1 whitespace-nowrap">
                            {hasAgenda && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setAgendaMeeting(meeting)}
                                >
                                    <ListChecks className="h-4 w-4" />
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Ver Pauta</p>
                                </TooltipContent>
                            </Tooltip>
                            )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleMarkAsDone(meeting)}
                                        disabled={!meeting.scheduledDate}
                                        className="text-green-600 hover:text-green-700 disabled:text-gray-400"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Reunião Realizada</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => setHistoryMeeting(meeting)} disabled={!hasHistory}>
                                    <History className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Ver Histórico</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setEditingMeeting(meeting)}
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Gerenciar Reunião</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TableCell>
                    </TableRow>
                </React.Fragment>
              );
            }) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                        Nenhuma reunião encontrada com os filtros atuais.
                        </TableCell>
                    </TableRow>
            )}
          </TableBody>
        </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
    </>
  );
}
