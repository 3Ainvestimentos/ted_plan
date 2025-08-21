
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
import type { Kpi, KpiFormData } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  name: z.string().min(5, "O nome do KPI deve ter pelo menos 5 caracteres."),
  unit: z.enum(['R$', '%', 'unidades']),
});

interface UpsertKpiModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    areaId: string;
    kpi?: Kpi | null;
}

export function UpsertKpiModal({ isOpen, onOpenChange, areaId, kpi }: UpsertKpiModalProps) {
    const { addKpi, updateKpi } = useStrategicPanel();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!kpi;

    const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<KpiFormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (kpi) {
            reset(kpi);
        } else {
            reset({ name: '', unit: 'R$' });
        }
    }, [kpi, reset, isOpen]);
    
    const onSubmit = async (data: KpiFormData) => {
        setIsLoading(true);
        try {
            if (isEditing && kpi) {
                await updateKpi(kpi.id, data);
                toast({ title: "KPI Atualizado!", description: `O KPI "${data.name}" foi atualizado.` });
            } else {
                await addKpi(areaId, data);
                toast({ title: "KPI Adicionado!", description: `O KPI "${data.name}" foi criado.` });
            }
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar o KPI." });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar KPI' : 'Novo KPI'}</DialogTitle>
                    <DialogDescription>
                       {isEditing ? 'Atualize os dados do KPI.' : 'Preencha os dados do novo KPI.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do KPI</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit">Unidade de Medida</Label>
                        <z.input {...register("unit")} />
                        <Select onValueChange={(value) => setValue('unit', value as any)} defaultValue={kpi?.unit}>
                             <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="R$">R$ (Reais)</SelectItem>
                                <SelectItem value="%">% (Percentual)</SelectItem>
                                <SelectItem value="unidades">Unidades</SelectItem>
                             </SelectContent>
                        </Select>
                        {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                            {isEditing ? 'Salvar Alterações' : 'Adicionar KPI'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
