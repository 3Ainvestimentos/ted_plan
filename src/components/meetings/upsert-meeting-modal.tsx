

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMeetings } from "@/contexts/meetings-context";
import type { RecurringMeeting } from "@/types";
import { LoadingSpinner } from "../ui/loading-spinner";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "../ui/textarea";

const agendaItemSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "A pauta deve ter pelo menos 3 caracteres."),
    action: z.string().optional(),
    owner: z.string().optional(),
    deadline: z.string().optional(),
    observations: z.string().optional(),
});

const meetingSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    recurrenceValue: z.number().min(1, "O valor deve ser ao menos 1."),
    recurrenceUnit: z.enum(['dias', 'semanas', 'meses']),
    agenda: z.array(agendaItemSchema),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface UpsertMeetingModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  meeting?: RecurringMeeting | null;
}

const recurrenceUnits = ["dias", "semanas", "meses"];

export function UpsertMeetingModal({ isOpen, onOpenChange, meeting }: UpsertMeetingModalProps) {
  const { toast } = useToast();
  const { addMeeting, updateMeeting, deleteMeeting } = useMeetings();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = !!meeting;

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      name: '',
      recurrenceValue: 1,
      recurrenceUnit: 'semanas',
      agenda: [],
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "agenda"
  });

  useEffect(() => {
    if (isOpen && meeting) {
        reset({
            name: meeting.name,
            recurrenceValue: meeting.recurrence.value,
            recurrenceUnit: meeting.recurrence.unit,
            agenda: meeting.agenda || [],
        });
    } else if (isOpen && !meeting) {
        reset({
            name: '',
            recurrenceValue: 1,
            recurrenceUnit: 'semanas',
            agenda: [],
        });
    }
  }, [isOpen, meeting, reset]);


  const onSubmit = async (data: MeetingFormData) => {
    setIsSaving(true);
    const meetingData = {
        name: data.name,
        recurrence: {
            value: data.recurrenceValue,
            unit: data.recurrenceUnit,
        },
        agenda: data.agenda.map(item => ({...item, id: item.id || crypto.randomUUID() })),
    };

    try {
        if (isEditing && meeting) {
            await updateMeeting(meeting.id, meetingData as Partial<RecurringMeeting>);
            toast({ title: "Reunião Atualizada!", description: `A reunião "${data.name}" foi atualizada.` });
        } else {
            await addMeeting(meetingData as any);
            toast({ title: "Reunião Criada!", description: `A reunião "${data.name}" foi criada.` });
        }
        onOpenChange(false);
    } catch(e) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a reunião." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!meeting) return;
    setIsDeleting(true);
    try {
        await deleteMeeting(meeting.id);
        toast({ title: "Reunião Removida", description: `"${meeting.name}" foi removida.`});
        onOpenChange(false);
    } catch(e) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover a reunião." });
    } finally {
        setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Gerenciar Reunião Recorrente' : 'Nova Reunião Recorrente'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite os detalhes, a recorrência e a pauta da sua reunião.' : 'Configure uma nova reunião recorrente para sua equipe.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome da Reunião</Label>
                <Input id="name" {...register("name")} placeholder="Ex: Comitê de Riscos" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
                <Label>Recorrência</Label>
                <div className="flex gap-2">
                    <Input 
                        type="number" 
                        {...register("recurrenceValue", { valueAsNumber: true })}
                        min="1"
                        className="w-1/3"
                    />
                    <Controller
                        name="recurrenceUnit"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {recurrenceUnits.map(unit => (
                                    <SelectItem key={unit} value={unit} className="capitalize">{unit}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                 {errors.recurrenceValue && <p className="text-sm text-destructive">{errors.recurrenceValue.message}</p>}
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-between items-center">
                    <Label>Pauta Padrão</Label>
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ title: "", action: "", owner: "", deadline: "" })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                    </Button>
                </div>
                 {fields.length > 0 ? (
                <div className="space-y-4">
                    {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start p-3 border rounded-md relative">
                        <div className="col-span-12">
                            <Label htmlFor={`agenda.${index}.title`}>Item {index+1}</Label>
                            <Input
                                id={`agenda.${index}.title`}
                                {...register(`agenda.${index}.title`)}
                                placeholder="Título do item da pauta"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-5">
                             <Label htmlFor={`agenda.${index}.action`} className="text-xs">Ação</Label>
                             <Input id={`agenda.${index}.action`} {...register(`agenda.${index}.action`)} placeholder="Ex: Validar proposta"/>
                        </div>
                        <div className="col-span-6 md:col-span-4">
                            <Label htmlFor={`agenda.${index}.owner`} className="text-xs">Responsável</Label>
                            <Input id={`agenda.${index}.owner`} {...register(`agenda.${index}.owner`)} placeholder="Ex: João"/>
                        </div>
                        <div className="col-span-6 md:col-span-3">
                            <Label htmlFor={`agenda.${index}.deadline`} className="text-xs">Prazo</Label>
                            <Input id={`agenda.${index}.deadline`} type="date" {...register(`agenda.${index}.deadline`)} />
                        </div>
                         <div className="col-span-12">
                            <Label htmlFor={`agenda.${index}.observations`} className="text-xs">Observações</Label>
                            <Textarea id={`agenda.${index}.observations`} {...register(`agenda.${index}.observations`)} placeholder="Detalhes, links ou notas adicionais..."/>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive absolute top-1 right-1 h-6 w-6"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhum item na pauta.
                </p>
                )}
            </div>


            <DialogFooter className="flex-col sm:flex-row sm:justify-between pt-4">
                <div>
                {isEditing && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isDeleting}>
                            {isDeleting ? "Excluindo..." : "Excluir Reunião"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso irá excluir permanentemente a reunião recorrente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                )}
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <><LoadingSpinner className="mr-2 h-4 w-4"/> Salvando...</> : "Salvar"}
                    </Button>
                </div>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
