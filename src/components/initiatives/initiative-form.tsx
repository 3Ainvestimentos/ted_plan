
"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import type { InitiativePriority } from "@/types";

const subItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "O título do subitem deve ter pelo menos 3 caracteres."),
  completed: z.boolean(),
});

const initiativeSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  owner: z.string().min(2, "O nome do responsável é obrigatório."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  status: z.enum(['Pendente', 'Em execução', 'Concluído', 'Suspenso']),
  deadline: z.date().optional(),
  priority: z.enum(['Baixa', 'Média', 'Alta']),
  subItems: z.array(subItemSchema).optional(),
});

export type InitiativeFormData = z.infer<typeof initiativeSchema>;

interface InitiativeFormProps {
    onSubmit: (data: InitiativeFormData) => void;
    onCancel: () => void;
    initialData?: Partial<InitiativeFormData>;
    isLoading?: boolean;
}

export function InitiativeForm({ onSubmit, onCancel, initialData, isLoading }: InitiativeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: initialData || {
      status: 'Pendente',
      priority: 'Baixa',
      subItems: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subItems",
  });

  const watchSubItems = watch("subItems");
  const hasSubItems = watchSubItems && watchSubItems.length > 0;
  const isProgressDisabled = hasSubItems;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título da Iniciativa</Label>
        <Input id="title" {...register("title")} placeholder="Ex: Otimizar o Funil de Vendas" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <Label>Prazo (Conclusão Alvo)</Label>
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
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                          />
                      </PopoverContent>
                  </Popover>
                  )}
              />
              {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="owner">Responsável</Label>
              <Input id="owner" {...register("owner")} placeholder="Ex: João da Silva" />
              {errors.owner && <p className="text-sm text-destructive">{errors.owner.message}</p>}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <Label htmlFor="status">Execução (Status)</Label>
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
        <Textarea id="description" {...register("description")} placeholder="Descreva o objetivo principal, escopo e os resultados esperados desta iniciativa." rows={5} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex justify-between items-center">
            <Label>Subitens (Checklist)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ title: "", completed: false })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Subitem
            </Button>
        </div>
         {hasSubItems ? (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Controller
                  name={`subItems.${index}.completed`}
                  control={control}
                  render={({ field: checkboxField }) => (
                    <Checkbox
                      checked={checkboxField.value}
                      onCheckedChange={checkboxField.onChange}
                      aria-label={`Completar subitem ${index + 1}`}
                    />
                  )}
                />
                <Input
                  {...register(`subItems.${index}.title`)}
                  placeholder={`Subitem ${index + 1}`}
                  className={cn(errors.subItems?.[index]?.title && "border-destructive")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
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
            Nenhum subitem adicionado. Adicione subitens para um controle detalhado do progresso.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Iniciativa"}
        </Button>
      </div>
    </form>
  );
}
