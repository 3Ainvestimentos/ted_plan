
"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, CalendarIcon } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import type { InitiativePriority } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";

const subItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "O título do subitem deve ter pelo menos 3 caracteres."),
  completed: z.boolean(),
  deadline: z.date().optional().nullable(),
});

const dealSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  status: z.enum(['Pendente', 'Em execução', 'Concluído', 'Suspenso']),
  priority: z.enum(['Baixa', 'Média', 'Alta']),
  cidade: z.string().min(2, "A cidade é obrigatória."),
  auc: z.coerce.number().min(0, "O valor do AUC deve ser positivo."),
  subItems: z.array(subItemSchema).optional(),
});

export type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
    onSubmit: (data: DealFormData) => void;
    onCancel: () => void;
    initialData?: Partial<DealFormData>;
    isLoading?: boolean;
}

export function DealForm({ onSubmit, onCancel, initialData, isLoading }: DealFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: initialData ? {
        ...initialData,
        subItems: initialData.subItems?.map(si => ({ ...si, deadline: si.deadline ? new Date(si.deadline) : null }))
    } : {
      status: 'Pendente',
      priority: 'Baixa',
      subItems: [],
      auc: 0,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subItems",
  });

  const watchSubItems = watch("subItems");
  const hasSubItems = watchSubItems && watchSubItems.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título do Deal</Label>
        <Input id="title" {...register("title")} placeholder="Ex: Aquisição da Empresa X" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...register("cidade")} placeholder="Ex: São Paulo" />
              {errors.cidade && <p className="text-sm text-destructive">{errors.cidade.message}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="auc">AUC (R$)</Label>
              <Input id="auc" type="number" {...register("auc")} placeholder="Ex: 5000000" />
              {errors.auc && <p className="text-sm text-destructive">{errors.auc.message}</p>}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <Label htmlFor="status">Fase do Funil (Status)</Label>
              <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione o status inicial" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                              <SelectItem value="Em execução">Em execução</SelectItem>
                              <SelectItem value="Concluído">Concluído</SelectItem>
                              <SelectItem value="Suspenso">Suspenso</SelectItem>
                          </SelectContent>
                      </Select>
                  )}
              />
               {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Alta">Alta</SelectItem>
                              <SelectItem value="Média">Média</SelectItem>
                              <SelectItem value="Baixa">Baixa</SelectItem>
                          </SelectContent>
                      </Select>
                  )}
              />
               {errors.priority && <p className="text-sm text-destructive">{errors.priority.message}</p>}
          </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Observações (Descrição)</Label>
        <Textarea id="description" {...register("description")} placeholder="Descreva o objetivo principal, escopo e os resultados esperados deste deal." rows={5} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex justify-between items-center">
            <Label>Checklist de Due Diligence</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ title: "", completed: false, deadline: null })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
        </div>
         {hasSubItems ? (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Controller
                  name={`subItems.${index}.completed`}
                  control={control}
                  render={({ field: checkboxField }) => (
                    <Checkbox
                      className="mt-1"
                      checked={checkboxField.value}
                      onCheckedChange={checkboxField.onChange}
                      aria-label={`Completar subitem ${index + 1}`}
                    />
                  )}
                />
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      {...register(`subItems.${index}.title`)}
                      placeholder={`Item de checklist ${index + 1}`}
                      className={cn("sm:col-span-2", errors.subItems?.[index]?.title && "border-destructive")}
                    />
                     <Controller
                        name={`subItems.${index}.deadline`}
                        control={control}
                        render={({ field: dateField }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal h-10"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateField.value ? format(dateField.value, "dd/MM/yy") : <span className="text-muted-foreground text-xs">Prazo...</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dateField.value}
                                    onSelect={dateField.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        )}
                    />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0 mt-1"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.subItems && <p className="text-sm text-destructive">Verifique os erros na lista de subitens.</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhum item de checklist adicionado.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Deal"}
        </Button>
      </div>
    </form>
  );
}
