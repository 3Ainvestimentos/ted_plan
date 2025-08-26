

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { useToast } from "@/hooks/use-toast";
import type { Kpi, KpiFormData, KpiSeriesData } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";


const seriesSchema = z.object({
  month: z.string(),
  Realizado: z.number().nullable(),
});

const formSchema = z.object({
  name: z.string().min(5, "O nome do KPI deve ter pelo menos 5 caracteres."),
  unit: z.enum(['R$', '%', 'unidades']),
  targetValue: z.number().min(0, "A meta deve ser um valor positivo."),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  series: z.array(seriesSchema),
});

type UpsertKpiFormData = z.infer<typeof formSchema>;

interface UpsertKpiModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    areaId: string;
    kpi?: Kpi | null;
}

const defaultSeries: KpiSeriesData[] = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString('default', { month: 'short' }),
    Realizado: null,
}));


export function UpsertKpiModal({ isOpen, onOpenChange, areaId, kpi }: UpsertKpiModalProps) {
    const { addKpi, updateKpi } = useStrategicPanel();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!kpi;

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UpsertKpiFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            unit: 'R$',
            targetValue: 0,
            series: defaultSeries,
        }
    });

    const { fields } = useFieldArray({
        control,
        name: "series"
    });

    useEffect(() => {
        if (isOpen) {
            if (kpi) {
                reset({
                    name: kpi.name,
                    unit: kpi.unit as any,
                    targetValue: kpi.targetValue,
                    startDate: kpi.startDate ? new Date(kpi.startDate) : undefined,
                    endDate: kpi.endDate ? new Date(kpi.endDate) : undefined,
                    series: kpi.series && kpi.series.length === 12 ? kpi.series.map(s => ({...s, Realizado: s.Realizado ?? null})) : defaultSeries,
                });
            } else {
                reset({
                    name: '',
                    unit: 'R$',
                    targetValue: 0,
                    startDate: undefined,
                    endDate: undefined,
                    series: defaultSeries,
                });
            }
        }
    }, [kpi, reset, isOpen]);
    
    const onSubmit = async (data: UpsertKpiFormData) => {
        setIsLoading(true);

        const dataToSave: KpiFormData = {
            ...data,
            startDate: data.startDate?.toISOString().split('T')[0],
            endDate: data.endDate?.toISOString().split('T')[0],
            series: data.series.map(s => ({
                ...s,
                Realizado: s.Realizado === null ? null : Number(s.Realizado),
            }))
        };

        try {
            if (isEditing && kpi) {
                await updateKpi(kpi.id, dataToSave);
                toast({ title: "KPI Atualizado!", description: `O KPI "${data.name}" foi atualizado.` });
            } else {
                await addKpi(areaId, dataToSave);
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
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar KPI' : 'Novo KPI'}</DialogTitle>
                    <DialogDescription>
                       {isEditing ? 'Atualize os dados do KPI.' : 'Preencha os dados do novo KPI.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name">Nome do KPI</Label>
                            <Input id="name" {...register("name")} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="unit">Unidade</Label>
                            <Controller
                                name="unit"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a unidade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="R$">R$ (Reais)</SelectItem>
                                            <SelectItem value="%">% (Percentual)</SelectItem>
                                            <SelectItem value="unidades">Unidades</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label>Prazo de Início</Label>
                             <Controller
                                name="startDate"
                                control={control}
                                render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                                </Popover>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Prazo de Fim</Label>
                             <Controller
                                name="endDate"
                                control={control}
                                render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                                </Popover>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetValue">Meta (Valor Final)</Label>
                             <Input id="targetValue" type="number" {...register("targetValue", { valueAsNumber: true })} />
                            {errors.targetValue && <p className="text-sm text-destructive">{errors.targetValue.message}</p>}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Valores Mensais Realizados</Label>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/2">Mês</TableHead>
                                        <TableHead className="w-1/2">Realizado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">{field.month}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    {...register(`series.${index}.Realizado` as const, { valueAsNumber: true })}
                                                    placeholder="-"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
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
