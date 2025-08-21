
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMeetings } from "@/contexts/meetings-context";
import type { RecurringMeeting } from "@/types";
import { LoadingSpinner } from "../ui/loading-spinner";

interface CreateEventSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const recurrenceUnits = ["dias", "semanas", "meses"];

export function CreateEventSheet({ isOpen, onOpenChange }: CreateEventSheetProps) {
  const { toast } = useToast();
  const { addMeeting } = useMeetings();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [recurrenceValue, setRecurrenceValue] = useState<number>(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<'dias' | 'semanas' | 'meses'>('semanas');

  const handleCreateEvent = async () => {
    if (!name || recurrenceValue <= 0) {
      toast({
        variant: "destructive",
        title: "Campos Inválidos",
        description: "Por favor, preencha o nome e um valor de recorrência válido.",
      });
      return;
    }
    
    setIsLoading(true);

    const newMeetingData = {
        name,
        recurrence: {
            unit: recurrenceUnit,
            value: recurrenceValue
        },
    };

    await addMeeting(newMeetingData as Omit<RecurringMeeting, 'id' | 'lastOccurrence'>);

    toast({
      title: "Comitê Recorrente Criado!",
      description: `O comitê "${name}" foi adicionado ao controle de recorrência.`,
    });
    
    // Reset form and close
    setName('');
    setRecurrenceValue(1);
    setRecurrenceUnit('semanas');
    onOpenChange(false);
    setIsLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Criar Novo Comitê Recorrente</SheetTitle>
          <SheetDescription>
            Configure um novo tipo de reunião para aparecer na sua tabela de controle de recorrência.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="title">Nome do Comitê/Reunião</Label>
            <Input id="title" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Comitê de Riscos" />
          </div>
          
          <div className="space-y-2">
            <Label>Recorrência</Label>
            <div className="flex gap-2">
                <Input 
                    type="number" 
                    value={recurrenceValue}
                    onChange={(e) => setRecurrenceValue(Number(e.target.value))}
                    min="1"
                    className="w-1/3"
                />
                <Select value={recurrenceUnit} onValueChange={(value) => setRecurrenceUnit(value as any)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                        {recurrenceUnits.map(unit => (
                           <SelectItem key={unit} value={unit} className="capitalize">{unit}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreateEvent} disabled={isLoading}>
             {isLoading ? <><LoadingSpinner className="mr-2 h-4 w-4"/> Salvando...</> : "Criar Comitê"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
