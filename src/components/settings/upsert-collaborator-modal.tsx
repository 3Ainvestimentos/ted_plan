
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
import type { Collaborator, UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const collaboratorSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("Por favor, insira um e-mail válido."),
  cargo: z.string().min(2, "O cargo é obrigatório."),
  area: z.string().optional(),
  userType: z.enum(['Administrador', 'Usuário padrão']),
});

type CollaboratorFormData = z.infer<typeof collaboratorSchema>;

interface UpsertCollaboratorModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    collaborator?: Collaborator | null; // Collaborator data for editing, null for creating
}

export function UpsertCollaboratorModal({ isOpen, onOpenChange, collaborator }: UpsertCollaboratorModalProps) {
    const { addCollaborator, updateCollaborator } = useTeamControl();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!collaborator;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CollaboratorFormData>({
        resolver: zodResolver(collaboratorSchema),
        defaultValues: {
            userType: 'Usuário padrão',
        },
    });

    useEffect(() => {
        if (collaborator) {
            reset({
                name: collaborator.name,
                email: collaborator.email,
                cargo: collaborator.cargo,
                area: collaborator.area || '',
                userType: collaborator.userType || 'Usuário padrão',
            });
        } else {
            reset({
                name: '',
                email: '',
                cargo: '',
                area: '',
                userType: 'Usuário padrão' as UserType,
            });
        }
    }, [collaborator, reset, isOpen]);
    
    const onSubmit = async (data: CollaboratorFormData) => {
        setIsLoading(true);
        try {
            if (isEditing && collaborator) {
                await updateCollaborator(collaborator.id, data);
                toast({
                    title: "Colaborador Atualizado!",
                    description: `Os dados de ${data.name} foram atualizados.`,
                });
            } else {
                await addCollaborator(data as Omit<Collaborator, 'id'>);
                toast({
                    title: "Colaborador Adicionado!",
                    description: `${data.name} foi adicionado à lista.`,
                });
            }
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Erro ao Salvar",
                description: `Não foi possível salvar os dados do colaborador.`,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}</DialogTitle>
                    <DialogDescription>
                       {isEditing ? 'Atualize os dados do colaborador abaixo.' : 'Preencha os dados do novo colaborador.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register("email")} />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="area">Área</Label>
                        <Input id="area" {...register("area")} placeholder="Ex: Comercial, TI, etc." />
                        {errors.area && <p className="text-sm text-destructive">{errors.area.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input id="cargo" {...register("cargo")} />
                        {errors.cargo && <p className="text-sm text-destructive">{errors.cargo.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="userType">Tipo de Usuário</Label>
                        <Select
                            value={watch("userType")}
                            onValueChange={(value) => setValue("userType", value as UserType)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de usuário" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Administrador">Administrador</SelectItem>
                                <SelectItem value="Usuário padrão">Usuário padrão</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.userType && <p className="text-sm text-destructive">{errors.userType.message}</p>}
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                            {isEditing ? 'Salvar Alterações' : 'Adicionar Colaborador'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
