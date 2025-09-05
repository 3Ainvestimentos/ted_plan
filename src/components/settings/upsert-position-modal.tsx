
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
import type { Collaborator, PositionHistory } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";

const formSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  position: z.string().min(3, "O nome do cargo é obrigatório."),
});

type FormData = z.infer<typeof formSchema>;

interface UpsertPositionModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    collaborator: Collaborator;
    position?: PositionHistory;
}

export function UpsertPositionModal({ isOpen, onOpenChange, collaborator, position }: UpsertPositionModalProps) {
    const { updateCollaboratorHistory, addHistoryEntry } = useTeamControl();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!position;

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (position) {
            reset({
                date: new Date(position.date),
                position: position.position,
            });
        } else {
            reset({ date: undefined, position: '' });
        }
    }, [position, reset, isOpen]);
    
    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        const entry: PositionHistory = {
            date: data.date.toISOString().split('T')[0],
            position: data.position,
        };

        try {
            if (isEditing && position) {
                const updatedHistory = collaborator.positionHistory?.map(p => 
                    (p.date === position.date && p.position === position.position) ? entry : p
                ) || [];
                await updateCollaboratorHistory(collaborator.id, 'positionHistory', updatedHistory);
            } else {
                await addHistoryEntry(collaborator.id, 'positionHistory', entry);
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
                    <DialogTitle>{isEditing ? 'Editar' : 'Adicionar'} Registro de Cargo</DialogTitle>
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
                        <Label htmlFor="position">Cargo</Label>
                        <Input id="position" {...register("position")} />
                        {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
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
