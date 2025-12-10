
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import type { DevProject, DevProjectItem, DevProjectSubItem, DevProjectStatus } from "@/types";
import { useDevProjects } from "@/contexts/dev-projects-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Trash2, PlusCircle, CornerDownRight, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

const STATUS_OPTIONS: DevProjectStatus[] = ['Pendente', 'Em Andamento', 'Concluído', 'Em Espera', 'Cancelado'];

const subItemSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Título deve ter ao menos 3 caracteres."),
  responsible: z.string().min(2, "Responsável é obrigatório."),
  status: z.enum(STATUS_OPTIONS),
  startDate: z.date({ required_error: "Data de início obrigatória." }),
  deadline: z.date({ required_error: "Prazo obrigatório." }),
});

const itemSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Título deve ter ao menos 3 caracteres."),
  responsible: z.string().min(2, "Responsável é obrigatório."),
  status: z.enum(STATUS_OPTIONS),
  startDate: z.date({ required_error: "Data de início obrigatória." }),
  deadline: z.date({ required_error: "Prazo obrigatório." }),
  subItems: z.array(subItemSchema),
});

const formSchema = z.object({
  name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
  items: z.array(itemSchema),
});

type FormData = z.infer<typeof formSchema>;

interface UpsertProjectModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    project?: DevProject | null;
}

export function UpsertProjectModal({ isOpen, onOpenChange, project }: UpsertProjectModalProps) {
    const { addProject, updateProject, deleteProject, allResponsibles } = useDevProjects();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const isEditing = !!project;

    const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", items: [] },
    });

    const { fields: items, append: appendItem, remove: removeItem } = useFieldArray({
        control,
        name: "items",
    });

    useEffect(() => {
        if (project && isOpen) {
            reset({
                name: project.name,
                items: project.items.map(item => ({
                    ...item,
                    startDate: new Date(item.startDate),
                    deadline: new Date(item.deadline),
                    subItems: item.subItems.map(si => ({
                        ...si,
                        startDate: new Date(si.startDate),
                        deadline: new Date(si.deadline),
                    }))
                }))
            });
            // Expand all items by default on edit
            setExpandedItems(new Set(project.items.map(i => i.id)));
        } else if (!project && isOpen) {
            reset({ name: '', items: [] });
            setExpandedItems(new Set());
        }
    }, [project, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        const projectData = {
            name: data.name,
            items: data.items.map(item => ({
                ...item,
                startDate: item.startDate.toISOString().split('T')[0],
                deadline: item.deadline.toISOString().split('T')[0],
                subItems: item.subItems.map(si => ({
                    ...si,
                    startDate: si.startDate.toISOString().split('T')[0],
                    deadline: si.deadline.toISOString().split('T')[0],
                })),
            })),
        };

        try {
            if (isEditing && project) {
                await updateProject(project.id, projectData);
                toast({ title: "Projeto Atualizado!", description: `O projeto "${data.name}" foi atualizado.` });
            } else {
                await addProject({ name: data.name });
                toast({ title: "Projeto Adicionado!", description: `O projeto "${data.name}" foi criado.` });
            }
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar o projeto." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!project) return;
        setIsDeleting(true);
        try {
            await deleteProject(project.id);
            toast({ title: "Projeto Removido", description: `O projeto "${project.name}" foi removido.`});
            onOpenChange(false);
        } catch(e) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o projeto." });
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleItem = (itemId: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const ItemRow = ({ itemIndex }: { itemIndex: number }) => {
        const { fields: subItems, append: appendSubItem, remove: removeSubItem } = useFieldArray({
            control,
            name: `items.${itemIndex}.subItems`
        });
        const itemId = items[itemIndex].id;
        const isExpanded = expandedItems.has(itemId);

        return (
             <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleItem(itemId)}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <div className="flex-grow">
                        <Input placeholder="Nome do item" {...register(`items.${itemIndex}.title`)} />
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(itemIndex)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                 {isExpanded && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pl-10">
                            <Controller name={`items.${itemIndex}.responsible`} control={control} render={({field}) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Responsável"/></SelectTrigger>
                                    <SelectContent>{allResponsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                </Select>
                            )}/>
                             <Controller name={`items.${itemIndex}.status`} control={control} render={({field}) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Status"/></SelectTrigger>
                                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            )}/>
                            <Controller name={`items.${itemIndex}.startDate`} control={control} render={({field}) => (
                                <Popover><PopoverTrigger asChild><Button variant="outline" className="font-normal w-full justify-start">{field.value ? format(field.value, 'dd/MM/yy') : "Início"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                            )}/>
                            <Controller name={`items.${itemIndex}.deadline`} control={control} render={({field}) => (
                                <Popover><PopoverTrigger asChild><Button variant="outline" className="font-normal w-full justify-start">{field.value ? format(field.value, 'dd/MM/yy') : "Prazo"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                            )}/>
                        </div>
                        <div className="pl-10 space-y-3">
                             <Separator />
                            <Label className="text-xs text-muted-foreground">Sub-itens</Label>
                            {subItems.map((subItem, subItemIndex) => (
                                <div key={subItem.id} className="flex items-center gap-2">
                                     <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                     <Input placeholder="Nome do sub-item" {...register(`items.${itemIndex}.subItems.${subItemIndex}.title`)} />
                                     <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeSubItem(subItemIndex)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                             <Button type="button" variant="outline" size="sm" onClick={() => appendSubItem({ id: `sub-${Date.now()}`, title: '', responsible: allResponsibles[0] || '', status: 'Pendente', startDate: new Date(), deadline: new Date() })}><PlusCircle className="mr-2 h-4 w-4"/> Adicionar Sub-item</Button>
                        </div>
                    </>
                 )}
            </div>
        );
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Projeto' : 'Novo Projeto de Desenvolvimento'}</DialogTitle>
                    <DialogDescription>
                       {isEditing ? 'Atualize os dados e os itens do projeto.' : 'Preencha os dados do novo projeto e adicione seus itens.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-lg font-semibold">Nome do Projeto</Label>
                        <Input id="name" {...register("name")} className="text-base" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    
                    <Separator />

                    <Label className="text-lg font-semibold">Itens do Projeto</Label>
                    <ScrollArea className="h-[40vh] p-1">
                        <div className="space-y-4 pr-4">
                             {items.map((item, index) => <ItemRow key={item.id} itemIndex={index} />)}
                        </div>
                    </ScrollArea>
                    
                    <Button type="button" variant="secondary" onClick={() => appendItem({ id: `item-${Date.now()}`, title: '', responsible: allResponsibles[0] || '', status: 'Pendente', startDate: new Date(), deadline: new Date(), subItems: [] })}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Item ao Projeto
                    </Button>

                    <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between pt-4">
                        <div>
                            {isEditing && (
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={isDeleting}>
                                        {isDeleting ? "Excluindo..." : <><Trash2 className="mr-2 h-4 w-4" /> Excluir Projeto</>}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso irá excluir permanentemente o projeto e todos os seus itens.
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
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                                {isEditing ? 'Salvar Alterações' : 'Adicionar Projeto'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
