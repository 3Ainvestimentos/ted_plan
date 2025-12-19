
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
import { ArrowLeft, CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import type { InitiativeStatus, InitiativePriority, InitiativePhase } from "@/types";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";

const subItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "O título do subitem deve ter pelo menos 3 caracteres."),
  completed: z.boolean().default(false),
  deadline: z.date().optional().nullable(),
  status: z.enum(['Pendente', 'Em execução', 'Concluído', 'Suspenso', 'A Fazer', 'Em Dia', 'Em Risco', 'Atrasado']).default('Pendente'),
  responsible: z.string().min(1, "O responsável é obrigatório."),
  priority: z.enum(['Baixa', 'Média', 'Alta']).default('Baixa'),
  description: z.string().min(1, "A observação é obrigatória."),
});

const phaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "O título da fase deve ter pelo menos 3 caracteres."),
  deadline: z.date().optional().nullable(),
  status: z.enum(['Pendente', 'Em execução', 'Concluído', 'Suspenso', 'A Fazer', 'Em Dia', 'Em Risco', 'Atrasado']),
  areaId: z.string().min(1, "A área é obrigatória."),
  priority: z.enum(['Baixa', 'Média', 'Alta']),
  description: z.string().min(1, "A observação é obrigatória."),
  responsible: z.string().optional().nullable(),
  subItems: z.array(subItemSchema).optional(),
}).refine((data) => {
  // Se não tem subitens, responsável é obrigatório
  if (!data.subItems || data.subItems.length === 0) {
    return !!data.responsible && data.responsible.trim().length > 0;
  }
  return true;
}, {
  message: "O responsável é obrigatório quando a fase não tem subitens.",
  path: ["responsible"],
});

const initiativeSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  status: z.enum(['Pendente', 'Em execução', 'Concluído', 'Suspenso']),
  deadline: z.date({
    required_error: "A data de prazo é obrigatória.",
  }).optional().nullable(),
  priority: z.enum(['Baixa', 'Média', 'Alta']),
  areaId: z.string().min(1, "A área é obrigatória."),
  phases: z.array(phaseSchema).min(1, "É necessário pelo menos uma fase."),
});

export type InitiativeFormData = z.infer<typeof initiativeSchema>;

interface InitiativeFormProps {
    onSubmit: (data: InitiativeFormData) => void;
    onCancel: () => void;
    initialData?: Partial<InitiativeFormData>;
    isLoading?: boolean;
}

export function InitiativeForm({ onSubmit, onCancel, initialData, isLoading }: InitiativeFormProps) {
  const { businessAreas } = useStrategicPanel();
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: initialData || {
      status: 'Pendente',
      priority: 'Baixa',
      areaId: '',
      phases: [],
    },
    mode: 'onChange' // Para validação em tempo real
  });

  const { fields: phaseFields, append: appendPhase, remove: removePhase } = useFieldArray({
    control,
    name: "phases",
  });

  const watchPhases = watch("phases");
  const hasPhases = watchPhases && watchPhases.length > 0;

  // Função para adicionar subitem a uma fase específica
  const appendSubItem = (phaseIndex: number) => {
    const currentPhases = getValues('phases') || [];
    const currentPhase = currentPhases[phaseIndex] || { subItems: [] };
    const currentSubItems = currentPhase.subItems || [];
    
    const newSubItem = {
      title: "",
      completed: false,
      deadline: null,
      status: 'Pendente' as const,
      responsible: "",
      priority: 'Baixa' as const,
      description: "",
    };
    
    // Atualizar usando setValue do react-hook-form
    const updatedSubItems = [...currentSubItems, newSubItem];
    setValue(`phases.${phaseIndex}.subItems`, updatedSubItems, { shouldValidate: true });
  };

  // Função para remover subitem de uma fase específica
  const removeSubItem = (phaseIndex: number, subItemIndex: number) => {
    const currentPhases = getValues('phases') || [];
    const currentPhase = currentPhases[phaseIndex] || { subItems: [] };
    const currentSubItems = currentPhase.subItems || [];
    
    const updatedSubItems = currentSubItems.filter((_: any, idx: number) => idx !== subItemIndex);
    setValue(`phases.${phaseIndex}.subItems`, updatedSubItems, { shouldValidate: true });
  };

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
                          {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
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
          <div className="space-y-2">
              <Label htmlFor="areaId">Área</Label>
              <Controller
                  name="areaId"
                  control={control}
                  render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                          <SelectContent>
                              {businessAreas.map(area => (
                                  <SelectItem key={area.id} value={area.id}>
                                      {area.name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  )}
              />
              {errors.areaId && <p className="text-sm text-destructive">{errors.areaId.message}</p>}
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
            <Label>Fases (Obrigatório - mínimo 1)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendPhase({ 
                title: "", 
                deadline: null,
                status: 'Pendente',
                areaId: '',
                priority: 'Baixa',
                description: '',
                responsible: null,
                subItems: [] as any[]
              })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fase
            </Button>
        </div>
         {hasPhases ? (
          <div className="space-y-4">
            {phaseFields.map((field, index) => (
              <div key={field.id} className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Fase {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removePhase(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Título da Fase</Label>
                    <Input
                      {...register(`phases.${index}.title`)}
                      placeholder="Ex: Planejamento"
                      className={cn(errors.phases?.[index]?.title && "border-destructive")}
                    />
                    {errors.phases?.[index]?.title && (
                      <p className="text-sm text-destructive">{errors.phases[index]?.title?.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Controller
                      name={`phases.${index}.deadline`}
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione</span>}
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                      name={`phases.${index}.status`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Área</Label>
                    <Controller
                      name={`phases.${index}.areaId`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessAreas.map(area => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.phases?.[index]?.areaId && (
                      <p className="text-sm text-destructive">{errors.phases[index]?.areaId?.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Controller
                      name={`phases.${index}.priority`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>
                      Responsável {(!watchPhases?.[index]?.subItems || watchPhases[index].subItems.length === 0) && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      {...register(`phases.${index}.responsible`)}
                      placeholder="Ex: Maria Silva"
                      className={cn(errors.phases?.[index]?.responsible && "border-destructive")}
                    />
                    {errors.phases?.[index]?.responsible && (
                      <p className="text-sm text-destructive">{errors.phases[index]?.responsible?.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    {...register(`phases.${index}.description`)}
                    placeholder="Descreva a fase..."
                    rows={2}
                    className={cn(errors.phases?.[index]?.description && "border-destructive")}
                  />
                  {errors.phases?.[index]?.description && (
                    <p className="text-sm text-destructive">{errors.phases[index]?.description?.message}</p>
                  )}
                </div>

                {/* Seção de Subitens */}
                <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Subitens (Opcional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendSubItem(index)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Subitem
                    </Button>
                  </div>
                  
                  {watchPhases?.[index]?.subItems && watchPhases[index].subItems.length > 0 ? (
                    <div className="space-y-3">
                      {watchPhases[index].subItems.map((subItem: any, subItemIndex: number) => (
                        <div key={subItemIndex} className="space-y-2 p-2 border rounded bg-background">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Subitem {subItemIndex + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removeSubItem(index, subItemIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Título</Label>
                              <Input
                                {...register(`phases.${index}.subItems.${subItemIndex}.title`)}
                                placeholder="Título do subitem"
                                className="h-8 text-sm"
                              />
                              {errors.phases?.[index]?.subItems?.[subItemIndex]?.title && (
                                <p className="text-xs text-destructive">{errors.phases[index]?.subItems?.[subItemIndex]?.title?.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Responsável *</Label>
                              <Input
                                {...register(`phases.${index}.subItems.${subItemIndex}.responsible`)}
                                placeholder="Responsável"
                                className="h-8 text-sm"
                              />
                              {errors.phases?.[index]?.subItems?.[subItemIndex]?.responsible && (
                                <p className="text-xs text-destructive">{errors.phases[index]?.subItems?.[subItemIndex]?.responsible?.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Prazo</Label>
                              <Controller
                                name={`phases.${index}.subItems.${subItemIndex}.deadline`}
                                control={control}
                                render={({ field }) => (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className="w-full justify-start text-left font-normal h-8 text-sm">
                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione</span>}
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
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Status</Label>
                              <Controller
                                name={`phases.${index}.subItems.${subItemIndex}.status`}
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Status" />
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
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Prioridade</Label>
                              <Controller
                                name={`phases.${index}.subItems.${subItemIndex}.priority`}
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Prioridade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Alta">Alta</SelectItem>
                                      <SelectItem value="Média">Média</SelectItem>
                                      <SelectItem value="Baixa">Baixa</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Observações</Label>
                            <Textarea
                              {...register(`phases.${index}.subItems.${subItemIndex}.description`)}
                              placeholder="Observações do subitem"
                              rows={2}
                              className="text-sm"
                            />
                            {errors.phases?.[index]?.subItems?.[subItemIndex]?.description && (
                              <p className="text-xs text-destructive">{errors.phases[index]?.subItems?.[subItemIndex]?.description?.message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      Nenhum subitem adicionado. Adicione subitens se necessário.
                    </p>
                  )}
                </div>
              </div>
            ))}
            {errors.phases && <p className="text-sm text-destructive">Verifique os erros nas fases.</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhuma fase adicionada. Adicione pelo menos uma fase.
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

    