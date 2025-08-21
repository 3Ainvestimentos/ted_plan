
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Users, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CreateEventSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const meetingTypes = ["1:1", "Comitê", "Reunião Pontual", "Follow-up", "Alinhamento", "Workshop"];
const recurrenceOptions = ["Não se repete", "Diariamente", "Semanalmente", "Mensalmente"];

export function CreateEventSheet({ isOpen, onOpenChange }: CreateEventSheetProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleCreateEvent = () => {
    // Lógica para criar evento será adicionada aqui.
    toast({
      title: "Evento Criado (Simulação)",
      description: "O evento foi adicionado à fila para ser criado no Google Calendar.",
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Criar Novo Evento</SheetTitle>
          <SheetDescription>
            Preencha os detalhes abaixo para agendar um novo evento no Google Calendar.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Evento</Label>
            <Input id="title" placeholder="Ex: Reunião de Sincronização Semanal" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input id="time" type="time" defaultValue="10:00" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="participants">Participantes (E-mails)</Label>
            <Textarea 
                id="participants"
                placeholder="Separe os e-mails por vírgula. ex: usuario1@exemplo.com, usuario2@exemplo.com"
                rows={3}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="type">Tipo de Reunião</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        {meetingTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="recurrence">Recorrência</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a recorrência" />
                    </SelectTrigger>
                    <SelectContent>
                        {recurrenceOptions.map(option => (
                           <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreateEvent}>Criar Evento</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

