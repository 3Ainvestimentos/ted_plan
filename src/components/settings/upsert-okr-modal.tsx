

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { useToast } from "@/hooks/use-toast";
import type { Okr } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  name: z.string().min(5, "O nome do OKR deve ter pelo menos 5 caracteres."),
  progress: z.number().min(0).max(100),
  status: z.enum(['Em Dia', 'Em Risco', 'Concluído']),
  deadline: z.date().optional().nullable(),
  observations: z.string().optional(),
});

type OkrFormData = z.infer<typeof formSchema>;

interface UpsertOkrModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    areaId: string;
    okr?: Okr | null;
}

export function UpsertOkrModal({ isOpen, onOpenChange, areaId, okr }: UpsertOkrModalProps) {
    const { addOkr, updateOkr } = useStrategicPanel();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!okr;

    const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<OkrFormData>({
        resolver: zodResolver(formSchema),
    });

    const progressValue = watch('progress', isEditing && okr ? okr.progress : 0);

    useEffect(() => {
        if (!isOpen) return; // Só executar quando o modal estiver aberto
        
        if (okr) {
            reset({
                ...okr,
                deadline: okr.deadline ? new Date(okr.deadline) : null,
            });
        } else {
            reset({ name: '', progress: 0, status: 'Em Dia', deadline: null, observations: '' });
        }
    }, [okr, reset, isOpen]);
    
    const onSubmit = async (data: OkrFormData) => {
        setIsLoading(true);
        try {
            const dataToSave = {
                ...data,
                deadline: data.deadline ? data.deadline.toISOString().split('T')[0] : null,
            };

            if (isEditing && okr) {
                await updateOkr(okr.id, dataToSave as any);
                toast({ title: "OKR Atualizado!", description: `O OKR "${data.name}" foi atualizado.` });
            } else {
                await addOkr(areaId, dataToSave as any);
                toast({ title: "OKR Adicionado!", description: `O OKR "${data.name}" foi criado.` });
            }
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar o OKR." });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar OKR' : 'Novo OKR'}</DialogTitle>
                    <DialogDescription>
                       {isEditing ? 'Atualize os dados do OKR.' : 'Preencha os dados do novo OKR.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do OKR</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Em Dia">Em Dia</SelectItem>
                                            <SelectItem value="Em Risco">Em Risco</SelectItem>
                                            <SelectItem value="Concluído">Concluído</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Prazo</Label>
                            <Controller
                                name="deadline"
                                control={control}
                                render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(new Date(field.value), "dd/MM/yyyy") : <span>Selecione uma data</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value || undefined}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                )}
                            />
                            {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                         <div className="flex justify-between">
                            <Label htmlFor="progress">Progresso</Label>
                            <span>{progressValue}%</span>
                         </div>
                        <Slider
                            defaultValue={[progressValue]}
                            max={100}
                            step={1}
                            onValueChange={(value) => setValue('progress', value[0])}
                        />
                        {errors.progress && <p className="text-sm text-destructive">{errors.progress.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observations">Observações</Label>
                        <Textarea id="observations" {...register("observations")} placeholder="Adicione notas, contexto ou justificativas sobre o OKR." />
                        {errors.observations && <p className="text-sm text-destructive">{errors.observations.message}</p>}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                            {isEditing ? 'Salvar Alterações' : 'Adicionar OKR'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
