
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
import type { BusinessArea, BusinessAreaFormData } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DollarSign, Target, Briefcase } from "lucide-react";

const ICON_LIST = [
    { name: 'DollarSign', component: <DollarSign/> },
    { name: 'Target', component: <Target /> },
    { name: 'Briefcase', component: <Briefcase /> },
];

const formSchema = z.object({
  name: z.string().min(3, "O nome da área deve ter pelo menos 3 caracteres."),
  icon: z.string().min(1, "A seleção de um ícone é obrigatória."),
});

interface UpsertBusinessAreaModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    area?: BusinessArea;
}

export function UpsertBusinessAreaModal({ isOpen, onOpenChange, area }: UpsertBusinessAreaModalProps) {
    const { addBusinessArea, updateBusinessArea } = useStrategicPanel();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!area;

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<BusinessAreaFormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (area) {
            reset(area);
        } else {
            reset({ name: '', icon: '' });
        }
    }, [area, reset, isOpen]);
    
    const onSubmit = async (data: BusinessAreaFormData) => {
        setIsLoading(true);
        try {
            if (isEditing && area) {
                await updateBusinessArea(area.id, data);
                toast({ title: "Área Atualizada!", description: `A área "${data.name}" foi atualizada.` });
            } else {
                await addBusinessArea(data);
                toast({ title: "Área Adicionada!", description: `A área "${data.name}" foi criada.` });
            }
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar a área de negócio." });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Área de Negócio' : 'Nova Área de Negócio'}</DialogTitle>
                    <DialogDescription>
                       {isEditing ? 'Atualize os dados da área de negócio.' : 'Preencha os dados da nova área.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Área</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="icon">Ícone</Label>
                        <z.input {...register("icon")} />
                        <Select onValueChange={(value) => control._fields.icon._f.onChange(value)} defaultValue={area?.icon}>
                             <SelectTrigger>
                                <SelectValue placeholder="Selecione um ícone" />
                             </SelectTrigger>
                             <SelectContent>
                                {ICON_LIST.map(iconItem => (
                                    <SelectItem key={iconItem.name} value={iconItem.name}>
                                        <div className="flex items-center gap-2">
                                            {iconItem.component}
                                            <span>{iconItem.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                             </SelectContent>
                        </Select>
                        {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                            {isEditing ? 'Salvar Alterações' : 'Adicionar Área'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
