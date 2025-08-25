
"use client";

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { RecurringMeetingsTable } from '@/components/meetings/recurring-meetings-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeetings } from '@/contexts/meetings-context';
import { UpsertMeetingModal } from '@/components/meetings/upsert-meeting-modal';

export default function MeetingAgendaPage() {
  const calendarUrl = "https://calendar.google.com/calendar/embed?src=primary&ctz=America/Sao_Paulo";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isLoading } = useMeetings();

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
            title="Agenda de Reuniões"
            description="Visualize e gerencie seus compromissos e comitês."
        />
        <div className="flex items-center gap-2">
            <Button variant="outline">
                <LinkIcon className="mr-2 h-4 w-4" /> Integrar Calendário
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Reunião Recorrente
            </Button>
        </div>
      </div>

      <UpsertMeetingModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
      
      {isLoading ? (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-32 w-full" />
            </CardContent>
        </Card>
      ) : (
        <RecurringMeetingsTable />
      )}


      <Card className="flex-grow flex flex-col shadow-lg">
        <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>Sua agenda integrada para visualização e planejamento.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 rounded-b-lg overflow-hidden">
            <iframe
                src={calendarUrl}
                style={{ border: 0 }}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                title="Google Calendar"
            ></iframe>
        </CardContent>
      </Card>
    </div>
  );
}
