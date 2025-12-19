

"use client";

import { useState, useEffect, useRef } from "react";
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
import { format, eachMonthOfInterval, startOfMonth, endOfMonth, isValid } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ptBR } from 'date-fns/locale';


const seriesSchema = z.object({
  month: z.string(),
  Realizado: z.number().nullable(),
});

const formSchema = z.object({
  name: z.string().min(5, "O nome do KPI deve ter pelo menos 5 caracteres."),
  unit: z.enum(['R$', '%', 'unidades']),
  targetValue: z.number().min(0, "A meta deve ser um valor positivo."),
  startDate: z.date({ required_error: "A data de início é obrigatória."}),
  endDate: z.date({ required_error: "A data de fim é obrigatória."}),
  series: z.array(seriesSchema),
}).refine(data => data.endDate >= data.startDate, {
    message: "A data de fim deve ser posterior à data de início.",
    path: ["endDate"],
});

type UpsertKpiFormData = z.infer<typeof formSchema>;

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

    const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<UpsertKpiFormData>({
        resolver: zodResolver(formSchema),
    });
    
    const { fields, replace } = useFieldArray({
        control,
        name: "series"
    });
    
    const startDate = watch('startDate');
    const endDate = watch('endDate');
    const currentSeries = watch('series');
    
    // Usar ref para rastrear as datas anteriores e evitar loops
    const prevDatesRef = useRef<{ startDate?: Date; endDate?: Date }>({});

    useEffect(() => {
        if (isOpen) {
             if (kpi) {
                reset({
                    name: kpi.name,
                    unit: kpi.unit as any,
                    targetValue: kpi.targetValue,
                    startDate: kpi.startDate ? new Date(kpi.startDate) : undefined,
                    endDate: kpi.endDate ? new Date(kpi.endDate) : undefined,
                    series: kpi.series,
                });
                // Atualizar ref quando resetar com dados do KPI
                prevDatesRef.current = {
                    startDate: kpi.startDate ? new Date(kpi.startDate) : undefined,
                    endDate: kpi.endDate ? new Date(kpi.endDate) : undefined,
                };
            } else {
                reset({
                    name: '',
                    unit: 'R$',
                    targetValue: 0,
                    startDate: undefined,
                    endDate: undefined,
                    series: [],
                });
                prevDatesRef.current = {};
            }
        }
    }, [kpi, reset, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            prevDatesRef.current = {};
            return;
        }
        
        // Verificar se as datas realmente mudaram
        const prevStart = prevDatesRef.current.startDate;
        const prevEnd = prevDatesRef.current.endDate;
        const datesChanged = 
            prevStart?.getTime() !== startDate?.getTime() || 
            prevEnd?.getTime() !== endDate?.getTime();
        
        if (!datesChanged && prevStart && prevEnd) {
            return; // Datas não mudaram, não precisa atualizar
        }
        
        if (startDate && endDate && isValid(startDate) && isValid(endDate) && endDate >= startDate) {
            const intervalMonths = eachMonthOfInterval({
                start: startOfMonth(startDate),
                end: endOfMonth(endDate)
            });

            // Usar currentSeries apenas para preservar valores existentes
            const seriesSnapshot = currentSeries || [];
            const newSeries = intervalMonths.map(monthDate => {
                const monthStr = format(monthDate, 'MMM', { locale: ptBR });
                const existingMonth = seriesSnapshot.find(s => s.month === monthStr);
                return {
                    month: monthStr,
                    Realizado: existingMonth ? existingMonth.Realizado : null
                };
            });
            
            // Atualizar ref antes de chamar replace
            prevDatesRef.current = { startDate, endDate };
            replace(newSeries);
        } else if (currentSeries && currentSeries.length > 0) {
            // Limpar séries se não houver datas válidas
            prevDatesRef.current = {};
            replace([]);
        }
    }, [startDate, endDate, replace, isOpen]); // currentSeries removido das dependências
    
    const onSubmit = async (data: UpsertKpiFormData) => {
        setIsLoading(true);

        const dataToSave: KpiFormData = {
            ...data,
            startDate: data.startDate?.toISOString().split('T')[0],
            endDate: data.endDate?.toISOString().split('T')[0],
            series: data.series.map(s => ({
                ...s,
                Realizado: s.Realizado === null || s.Realizado === undefined ? null : Number(s.Realizado),
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
                             {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
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
                            {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetValue">Meta (Valor Final)</Label>
                             <Input id="targetValue" type="number" {...register("targetValue", { valueAsNumber: true })} />
                            {errors.targetValue && <p className="text-sm text-destructive">{errors.targetValue.message}</p>}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Valores Mensais Realizados</Label>
                        {fields.length > 0 ? (
                        <div className="rounded-md border max-h-60 overflow-y-auto">
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
                                            <TableCell className="font-medium capitalize">{field.month}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    step="any"
                                                    {...register(`series.${index}.Realizado` as const, { setValueAs: v => (v === '' || v === null) ? null : Number(v) })}
                                                    placeholder="-"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                                Selecione um período de início e fim para inserir os valores.
                            </div>
                        )}
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
