
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
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { useToast } from "@/hooks/use-toast";
import type { Okr, OkrFormData } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";

const formSchema = z.object({
  name: z.string().min(5, "O nome do OKR deve ter pelo menos 5 caracteres."),
  progress: z.number().min(0).max(100),
  status: z.enum(['Em Dia', 'Em Risco', 'Concluído']),
});

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

    const progressValue = watch('progress', isEditing ? okr.progress : 0);

    useEffect(() => {
        if (okr) {
            reset(okr);
        } else {
            reset({ name: '', progress: 0, status: 'Em Dia' });
        }
    }, [okr, reset, isOpen]);
    
    const onSubmit = async (data: OkrFormData) => {
        setIsLoading(true);
        try {
            if (isEditing && okr) {
                await updateOkr(okr.id, data);
                toast({ title: "OKR Atualizado!", description: `O OKR "${data.name}" foi atualizado.` });
            } else {
                await addOkr(areaId, data);
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
            <DialogContent className="sm:max-w-lg">
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
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <z.input {...register("status")} />
                        <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={okr?.status}>
                             <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="Em Dia">Em Dia</SelectItem>
                                <SelectItem value="Em Risco">Em Risco</SelectItem>
                                <SelectItem value="Concluído">Concluído</SelectItem>
                             </SelectContent>
                        </Select>
                        {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                    </div>
                    <div className="space-y-2">
                         <div className="flex justify-between">
                            <Label htmlFor="progress">Progresso</Label>
                            <span>{progressValue}%</span>
                         </div>
                        <z.input {...register("progress", { valueAsNumber: true })} />
                        <Slider
                            defaultValue={[progressValue]}
                            max={100}
                            step={1}
                            onValueChange={(value) => setValue('progress', value[0])}
                        />
                        {errors.progress && <p className="text-sm text-destructive">{errors.progress.message}</p>}
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
