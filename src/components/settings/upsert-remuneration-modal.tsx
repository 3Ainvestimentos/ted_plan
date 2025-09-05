
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useTeamControl } from "@/contexts/team-control-context";
import { useToast } from "@/hooks/use-toast";
import type { Collaborator, RemunerationHistory } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";

const formSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  value: z.number().min(1, "O valor da remuneração é obrigatório."),
});

type FormData = z.infer<typeof formSchema>;

interface UpsertRemunerationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    collaborator: Collaborator;
    remuneration?: RemunerationHistory;
}

export function UpsertRemunerationModal({ isOpen, onOpenChange, collaborator, remuneration }: UpsertRemunerationModalProps) {
    const { updateCollaboratorHistory, addHistoryEntry } = useTeamControl();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!remuneration;

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (remuneration) {
            reset({
                date: new Date(remuneration.date),
                value: remuneration.value,
            });
        } else {
            reset({ date: undefined, value: 0 });
        }
    }, [remuneration, reset, isOpen]);
    
    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        const entry: RemunerationHistory = {
            date: data.date.toISOString().split('T')[0],
            value: data.value,
        };

        try {
            if (isEditing && remuneration) {
                const updatedHistory = collaborator.remunerationHistory?.map(r => 
                    (r.date === remuneration.date && r.value === remuneration.value) ? entry : r
                ) || [];
                await updateCollaboratorHistory(collaborator.id, 'remunerationHistory', updatedHistory);
            } else {
                await addHistoryEntry(collaborator.id, 'remunerationHistory', entry);
            }
            toast({ title: `Registro ${isEditing ? 'Atualizado' : 'Adicionado'}!`, description: `O histórico de ${collaborator.name} foi atualizado.` });
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar o registro." });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar' : 'Adicionar'} Registro de Remuneração</DialogTitle>
                    <DialogDescription>
                       Para {collaborator.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal"
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {control.getValues('date') ? format(control.getValues('date'), "dd/MM/yyyy") : <span>Selecione uma data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={control.getValues('date')}
                                    onSelect={(d) => d && control.setValue('date', d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="value">Valor da Remuneração (sem pontos)</Label>
                        <Input id="value" type="number" {...register("value", { valueAsNumber: true })} />
                        {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
