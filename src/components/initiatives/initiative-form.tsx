
"use client";

import React, { useEffect } from "react";
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
import type { InitiativeStatus, InitiativePriority, InitiativeItem } from "@/types";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { useStrategicPanel } from "@/contexts/strategic-panel-context";
import { isOverdue, getAvailableStatuses } from "@/lib/initiatives-helpers";

/**
 * Schema Zod para converter string de data para Date.
 * Aceita strings no formato ISO 'YYYY-MM-DD' ou objetos Date.
 */
const dateSchema = z.preprocess((val) => {
  // Se já é um Date, retornar como está
  if (val instanceof Date) {
    return val;
  }
  
  // Se é string, converter para Date
  if (typeof val === 'string') {
    // Formato ISO 'YYYY-MM-DD'
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [year, month, day] = val.split('-').map(Number);
      // Usar horário local do meio-dia para evitar problemas de timezone
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    
    // Tentar parsear como ISO string completa ou timestamp
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Se é null ou undefined, retornar como está (será tratado pelo required_error)
  return val;
}, z.date({
  required_error: "A data de prazo é obrigatória.",
}));

const subItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "O título do subitem deve ter pelo menos 3 caracteres."),
  completed: z.boolean().optional().default(false),
  startDate: dateSchema.optional(), // Obrigatório se linkedToPrevious === false, calculado se linkedToPrevious === true
  endDate: dateSchema, // Sempre obrigatório
  linkedToPrevious: z.boolean().optional().default(false),
  status: z.enum(['Pendente', 'Em execução', 'Concluído', 'Suspenso']).optional().default('Pendente'),
  responsible: z.string().min(1, "O responsável é obrigatório."),
  priority: z.enum(['Baixa', 'Média', 'Alta']).optional().default('Baixa'),
  description: z.string().optional(),
}).refine((data) => {
  // Se não está vinculado, startDate é obrigatório
  if (!data.linkedToPrevious && !data.startDate) {
    return false;
  }
  return true;
}, {
  message: "A data de início é obrigatória quando o subitem não está vinculado ao anterior.",
  path: ["startDate"],
}).refine((data) => {
  // Validar que endDate >= startDate (se ambos existirem)
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "A data de fim deve ser maior ou igual à data de início.",
  path: ["endDate"],
});

const itemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "O título do item deve ter pelo menos 3 caracteres."),
  startDate: dateSchema.optional(), // Obrigatório se linkedToPrevious === false, calculado se linkedToPrevious === true
  endDate: dateSchema, // Sempre obrigatório
  linkedToPrevious: z.boolean().optional().default(false),
  status: z.enum(['Pendente', 'Em execução', 'Concluído', 'Suspenso']),
  areaId: z.string().min(1, "A área é obrigatória."), // Será sempre igual à área do projeto
  priority: z.enum(['Baixa', 'Média', 'Alta']),
  description: z.string().optional(),
  responsible: z.string().min(1, "O responsável é obrigatório."),
  subItems: z.array(subItemSchema).optional(),
}).refine((data) => {
  // Se não está vinculado, startDate é obrigatório
  if (!data.linkedToPrevious && !data.startDate) {
    return false;
  }
  return true;
}, {
  message: "A data de início é obrigatória quando o item não está vinculado ao anterior.",
  path: ["startDate"],
}).refine((data) => {
  // Validar que endDate >= startDate (se ambos existirem)
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "A data de fim deve ser maior ou igual à data de início.",
  path: ["endDate"],
}).refine((data) => {
  // Validar que todos os subitens têm endDate <= item.endDate
  if (data.subItems && data.subItems.length > 0 && data.endDate) {
    return data.subItems.every(subItem => {
      if (!subItem.endDate) return true; // Se não tem endDate, skip (será validado pelo schema do subitem)
      // Comparar datas: subItem.endDate <= item.endDate
      return subItem.endDate <= data.endDate;
    });
  }
  return true;
}, {
  message: "A data de fim do subitem não pode ser maior que a data de fim do item.",
  path: ["subItems"],
});

const initiativeSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  owner: z.string().min(1, "O responsável é obrigatório."),
  description: z.string().optional(),
  status: z.enum(['Pendente', 'Em execução', 'Concluído', 'Suspenso']),
  startDate: dateSchema, // Obrigatório
  endDate: dateSchema, // Obrigatório
  priority: z.enum(['Baixa', 'Média', 'Alta']),
  areaId: z.string().min(1, "A área é obrigatória."),
  items: z.array(itemSchema).min(1, "É necessário pelo menos um item."),
}).refine((data) => {
  // Validar que endDate >= startDate
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "A data de fim deve ser maior ou igual à data de início.",
  path: ["endDate"],
}).refine((data) => {
  // Validar que todos os itens têm endDate <= initiative.endDate
  if (data.items && data.items.length > 0 && data.endDate) {
    return data.items.every(item => {
      if (!item.endDate) return true; // Se não tem endDate, skip (será validado pelo schema do item)
      // Comparar datas: item.endDate <= initiative.endDate
      return item.endDate <= data.endDate;
    });
  }
  return true;
}, {
  message: "A data de fim do item não pode ser maior que a data de fim da iniciativa.",
  path: ["items"],
});

export type InitiativeFormData = z.infer<typeof initiativeSchema>;

interface InitiativeFormProps {
    onSubmit: (data: InitiativeFormData) => void;
    onCancel: () => void;
    initialData?: Partial<InitiativeFormData>;
    isLoading?: boolean;
    isLimitedMode?: boolean; // Modo limitado para heads (só pode editar responsible e status)
    canEditStatus?: boolean; // Se pode editar status de execução
    canEditDeadline?: boolean; // Se pode editar prazo (endDate) - PMO pode, Head não pode
    preselectedAreaId?: string | null; // Área pré-selecionada (quando há filtro explícito na URL)
}

export function InitiativeForm({ onSubmit, onCancel, initialData, isLoading, isLimitedMode = false, canEditStatus = true, canEditDeadline = true, preselectedAreaId }: InitiativeFormProps) {
  const { businessAreas } = useStrategicPanel();
  
  // Validar se preselectedAreaId existe em businessAreas
  const isValidArea = preselectedAreaId 
    ? businessAreas.some(area => area.id === preselectedAreaId)
    : false;
  
  const finalPreselectedAreaId = isValidArea ? preselectedAreaId : undefined;
  
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
      areaId: finalPreselectedAreaId || '',
      owner: '',
      startDate: undefined as any,
      endDate: undefined as any,
      items: [],
    },
    mode: 'onChange' // Para validação em tempo real
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchAreaId = watch("areaId");
  const hasItems = watchItems && watchItems.length > 0;

  // Quando a área do projeto mudar, atualizar todas as items
  useEffect(() => {
    if (watchAreaId && watchItems && watchItems.length > 0) {
      watchItems.forEach((_, index) => {
        const currentItemAreaId = getValues(`items.${index}.areaId`);
        // Só atualizar se for diferente para evitar loops
        if (currentItemAreaId !== watchAreaId) {
          setValue(`items.${index}.areaId`, watchAreaId, { shouldValidate: false });
        }
      });
    }
  }, [watchAreaId, watchItems, setValue, getValues]);

  // Quando items forem adicionadas, aplicar a área do projeto
  useEffect(() => {
    if (watchAreaId && watchItems) {
      watchItems.forEach((item, index) => {
        if (!item.areaId || item.areaId !== watchAreaId) {
          setValue(`items.${index}.areaId`, watchAreaId, { shouldValidate: false });
        }
      });
    }
  }, [watchItems?.length, watchAreaId, setValue, getValues]);

  // Calcular startDate automaticamente quando item está vinculado ao anterior
  useEffect(() => {
    if (watchItems && watchItems.length > 0) {
      watchItems.forEach((item, index) => {
        // Se não é o primeiro item e está vinculado
        if (index > 0 && item.linkedToPrevious) {
          const previousItem = watchItems[index - 1];
          // Se o item anterior tem endDate, usar como startDate do atual
          if (previousItem?.endDate) {
            const currentStartDate = getValues(`items.${index}.startDate`);
            const previousEndDate = previousItem.endDate;
            
            // Só atualizar se for diferente para evitar loops infinitos
            if (currentStartDate !== previousEndDate) {
              setValue(`items.${index}.startDate`, previousEndDate, { shouldValidate: true });
            }
          }
        }

        // Calcular startDate para subitens vinculados
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.forEach((subItem: any, subItemIndex: number) => {
            // Se não é o primeiro subitem e está vinculado
            if (subItemIndex > 0 && subItem.linkedToPrevious) {
              const previousSubItem = item.subItems?.[subItemIndex - 1];
              // Se o subitem anterior tem endDate, usar como startDate do atual
              if (previousSubItem?.endDate) {
                const currentStartDate = getValues(`items.${index}.subItems.${subItemIndex}.startDate`);
                const previousEndDate = previousSubItem.endDate;
                
                // Só atualizar se for diferente para evitar loops infinitos
                if (currentStartDate !== previousEndDate) {
                  setValue(`items.${index}.subItems.${subItemIndex}.startDate`, previousEndDate, { shouldValidate: true });
                }
              }
            }
          });
        }
      });
    }
  }, [watchItems, setValue, getValues]);

  // Garantir que preselectedAreaId seja setado quando o modal abrir ou quando a área pré-selecionada mudar
  // Útil quando o modal é reaberto com uma área diferente (caso o componente não seja desmontado)
  useEffect(() => {
    if (finalPreselectedAreaId) {
      const currentAreaId = getValues('areaId');
      // Só atualizar se o valor atual for diferente (evita atualizações desnecessárias)
      if (currentAreaId !== finalPreselectedAreaId) {
        setValue('areaId', finalPreselectedAreaId, { shouldValidate: false });
      }
    }
  }, [finalPreselectedAreaId, setValue, getValues]);

  // Função para adicionar subitem a uma item específica
  const appendSubItem = (itemIndex: number) => {
    const currentItems = getValues('items') || [];
    const currentItem = currentItems[itemIndex] || { subItems: [] };
    const currentSubItems = currentItem.subItems || [];
    
    const newSubItem = {
      title: "",
      completed: false,
      startDate: undefined as any, // Obrigatório se não vinculado, calculado se vinculado
      endDate: undefined as any, // Obrigatório, usuário deve preencher antes de salvar
      linkedToPrevious: false,
      status: 'Pendente' as const,
      responsible: "",
      priority: 'Baixa' as const,
      description: "",
    };
    
    // Atualizar usando setValue do react-hook-form
    const updatedSubItems = [...currentSubItems, newSubItem];
    setValue(`items.${itemIndex}.subItems`, updatedSubItems, { shouldValidate: false });
  };

  // Função para remover subitem de um item específico
  const removeSubItem = (itemIndex: number, subItemIndex: number) => {
    const currentItems = getValues('items') || [];
    const currentItem = currentItems[itemIndex] || { subItems: [] };
    const currentSubItems = currentItem.subItems || [];
    
    const updatedSubItems = currentSubItems.filter((_: any, idx: number) => idx !== subItemIndex);
    // Não validar ao remover, apenas atualizar o valor
    setValue(`items.${itemIndex}.subItems`, updatedSubItems, { shouldValidate: false });
  };

  /**
   * Verifica recursivamente se há mensagens de erro reais no objeto de erros
   * 
   * @param errorObj - Objeto de erro a verificar
   * @returns true se houver pelo menos uma mensagem de erro real
   */
  const hasRealErrorMessage = (errorObj: any): boolean => {
    if (!errorObj || typeof errorObj !== 'object') {
      return false;
    }
    
    // Verificar se tem mensagem direta
    if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.trim().length > 0) {
      return true;
    }
    
    // Verificar recursivamente em todas as propriedades
    for (const key in errorObj) {
      if (hasRealErrorMessage(errorObj[key])) {
        return true;
      }
    }
    
    return false;
  };

  /**
   * Handler de erros de validação do formulário
   * 
   * @param errors - Objeto de erros do react-hook-form
   */
  const onError = (errors: any) => {
    // Ignorar completamente se não houver erros reais
    if (!hasRealErrorMessage(errors)) {
      return; // Objeto vazio ou sem mensagens de erro reais
    }
    
    console.error("Erros de validação:", errors);
    
    // Função recursiva para encontrar o primeiro campo com erro
    const findFirstErrorField = (errorObj: any, path: string = ''): string | null => {
      for (const key in errorObj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (errorObj[key]?.message) {
          return currentPath;
        }
        
        if (typeof errorObj[key] === 'object' && errorObj[key] !== null) {
          const nestedError = findFirstErrorField(errorObj[key], currentPath);
          if (nestedError) return nestedError;
        }
      }
      return null;
    };
    
    const firstErrorField = findFirstErrorField(errors);
    if (firstErrorField) {
      // Tentar encontrar o elemento pelo name ou id
      const fieldName = firstErrorField.split('.').pop();
      const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                     document.querySelector(`[name="${fieldName}"]`) ||
                     document.querySelector(`#${fieldName}`);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título da Iniciativa</Label>
        <Input id="title" {...register("title")} placeholder="Ex: Otimizar o Funil de Vendas" disabled={isLimitedMode} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <Label>Data de Início <span className="text-destructive">*</span></Label>
              <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", errors.startDate && "border-destructive")}
                          disabled={!canEditDeadline || isLimitedMode}
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
                              disabled={!canEditDeadline || isLimitedMode}
                          />
                      </PopoverContent>
                  </Popover>
                  )}
              />
              {!canEditDeadline && (
                <p className="text-xs text-muted-foreground">
                  Você não tem permissão para editar as datas. Apenas PMO pode alterar datas.
                </p>
              )}
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
          </div>
          <div className="space-y-2">
              <Label>Data de Fim <span className="text-destructive">*</span></Label>
              <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", errors.endDate && "border-destructive")}
                          disabled={!canEditDeadline || isLimitedMode}
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
                              disabled={!canEditDeadline || isLimitedMode}
                          />
                      </PopoverContent>
                  </Popover>
                  )}
              />
              {!canEditDeadline && (
                <p className="text-xs text-muted-foreground">
                  Você não tem permissão para editar as datas. Apenas PMO pode alterar datas.
                </p>
              )}
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="areaId">Área</Label>
              <Controller
                  name="areaId"
                  control={control}
                  render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLimitedMode || !!finalPreselectedAreaId}>
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
              {finalPreselectedAreaId && (
                <p className="text-xs text-muted-foreground">
                  A área está bloqueada porque você está criando dentro de uma área específica.
                </p>
              )}
              {errors.areaId && <p className="text-sm text-destructive">{errors.areaId.message}</p>}
          </div>
      </div>

      <div className="space-y-2">
          <Label htmlFor="owner">Responsável <span className="text-destructive">*</span></Label>
          <Input 
              id="owner" 
              {...register("owner")} 
              placeholder="Ex: João da Silva" 
              className={cn(errors.owner && "border-destructive")}
              disabled={isLimitedMode}
          />
          {errors.owner && <p className="text-sm text-destructive">{errors.owner.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
              <Label htmlFor="status">Execução (Status)</Label>
              <Controller
                  name="status"
                  control={control}
                  render={({ field }) => {
                    // Verificar se todas as items estão concluídas
                    const allItemsCompleted = watchItems && watchItems.length > 0
                      ? watchItems.every((item: any) => item.status === 'Concluído')
                      : false;
                    
                    // Status disponíveis - remover "Concluído" se nem todas items estão concluídas
                    let availableStatuses = ['Pendente', 'Em execução', 'Concluído', 'Suspenso'] as const;
                    if (!allItemsCompleted && watchItems && watchItems.length > 0) {
                      availableStatuses = availableStatuses.filter(s => s !== 'Concluído') as any;
                    }
                    
                    return (
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canEditStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status inicial" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStatuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
              />
              {(() => {
                const allItemsCompleted = watchItems && watchItems.length > 0
                  ? watchItems.every((item: any) => item.status === 'Concluído')
                  : false;
                
                if (!allItemsCompleted && watchItems && watchItems.length > 0) {
                  return (
                    <p className="text-sm text-destructive">
                      Não é possível concluir: todas as items devem estar concluídas
                    </p>
                  );
                }
                return null;
              })()}
               {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
          </div>
          <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLimitedMode}>
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
        <Textarea id="description" {...register("description")} placeholder="Descreva o objetivo principal, escopo e os resultados esperados desta iniciativa." rows={5} disabled={isLimitedMode} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      
       <div className="space-y-4 rounded-lg border p-4">
        <div className="flex justify-between items-center">
            <Label>Items (Obrigatório - mínimo 1)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentAreaId = getValues('areaId') || '';
                appendItem({ 
                  title: "", 
                  startDate: undefined as any, // Obrigatório se não vinculado, calculado se vinculado
                  endDate: undefined as any, // Obrigatório, usuário deve preencher antes de salvar
                  linkedToPrevious: false,
                  status: 'Pendente',
                  areaId: currentAreaId, // Usar a área do projeto
                  priority: 'Baixa',
                  description: '',
                  responsible: "", // Obrigatório
                  subItems: [] as any[]
                });
              }}
              disabled={isLimitedMode}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
        </div>
         {hasItems ? (
          <div className="space-y-4">
            {itemFields.map((field, index) => (
              <div key={field.id} className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Item {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeItem(index)}
                    disabled={isLimitedMode}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Checkbox de Vinculação (apenas para itens após o primeiro) */}
                {index > 0 && (
                  <div className="flex items-center space-x-2 pb-2">
                    <Controller
                      name={`items.${index}.linkedToPrevious`}
                      control={control}
                      render={({ field }) => {
                        const previousItem = watchItems?.[index - 1];
                        const previousHasEndDate = previousItem?.endDate ? true : false;
                        const isDisabled = isLimitedMode || !canEditDeadline || !previousHasEndDate;
                        
                        return (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`linked-${index}`}
                              checked={field.value || false}
                              onCheckedChange={(checked) => {
                                if (previousHasEndDate) {
                                  field.onChange(checked);
                                }
                              }}
                              disabled={isDisabled}
                            />
                            <Label htmlFor={`linked-${index}`} className="text-sm font-normal cursor-pointer">
                              Vincular ao item anterior
                            </Label>
                            {!previousHasEndDate && (
                              <p className="text-xs text-muted-foreground">
                                O item anterior precisa ter data de fim definida para vincular.
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Título da Item</Label>
                    <Input
                      {...register(`items.${index}.title`)}
                      placeholder="Ex: Planejamento"
                      className={cn(errors.items?.[index]?.title && "border-destructive")}
                      disabled={isLimitedMode}
                    />
                    {errors.items?.[index]?.title && (
                      <p className="text-sm text-destructive">{errors.items[index]?.title?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Início {!watchItems?.[index]?.linkedToPrevious && <span className="text-destructive">*</span>}</Label>
                    <Controller
                      name={`items.${index}.startDate`}
                      control={control}
                      render={({ field }) => {
                        const isLinked = watchItems?.[index]?.linkedToPrevious;
                        const previousItem = index > 0 ? watchItems?.[index - 1] : null;
                        // Se vinculado, usar endDate do anterior
                        const displayValue = isLinked && previousItem?.endDate ? previousItem.endDate : field.value;
                        
                        return (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className={cn("w-full justify-start text-left font-normal", errors.items?.[index]?.startDate && "border-destructive")} 
                                disabled={!canEditDeadline || isLimitedMode || isLinked}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {displayValue ? format(displayValue, "dd/MM/yyyy") : <span>Selecione</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={displayValue || undefined}
                                onSelect={(date) => {
                                  if (!isLinked) {
                                    field.onChange(date);
                                  }
                                }}
                                initialFocus
                                disabled={!canEditDeadline || isLimitedMode || isLinked}
                              />
                            </PopoverContent>
                          </Popover>
                        );
                      }}
                    />
                    {watchItems?.[index]?.linkedToPrevious && (
                      <p className="text-xs text-muted-foreground">
                        Data de início definida automaticamente pela data de fim do item anterior.
                      </p>
                    )}
                    {errors.items?.[index]?.startDate && (
                      <p className="text-sm text-destructive">{errors.items[index]?.startDate?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Fim <span className="text-destructive">*</span></Label>
                    <Controller
                      name={`items.${index}.endDate`}
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              className={cn("w-full justify-start text-left font-normal", errors.items?.[index]?.endDate && "border-destructive")} 
                              disabled={!canEditDeadline || isLimitedMode}
                            >
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
                              disabled={!canEditDeadline || isLimitedMode}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {!canEditDeadline && (
                      <p className="text-xs text-muted-foreground">
                        Você não tem permissão para editar as datas. Apenas PMO pode alterar datas.
                      </p>
                    )}
                    {errors.items?.[index]?.endDate && (
                      <p className="text-sm text-destructive">{errors.items[index]?.endDate?.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                      name={`items.${index}.status`}
                      control={control}
                      render={({ field }) => {
                        // Verificar se a item está em atraso
                        const itemEndDate = watchItems?.[index]?.endDate;
                        const itemStatus = field.value;
                        const itemIsOverdue = itemEndDate ? isOverdue(itemEndDate, itemStatus) : false;
                        
                        // Verificar se todos os subitens estão concluídos
                        const itemSubItems = watchItems?.[index]?.subItems || [];
                        const allSubItemsCompleted = itemSubItems.length > 0 
                          ? itemSubItems.every((si: any) => si.status === 'Concluído')
                          : true; // Se não tem subitens, pode concluir
                        
                        // Status disponíveis baseado em atraso
                        let availableStatuses = itemIsOverdue 
                          ? getAvailableStatuses(true)
                          : ['Pendente', 'Em execução', 'Concluído', 'Suspenso'] as const;
                        
                        // Se não está atrasado mas tenta concluir sem todos subitens concluídos, remover "Concluído"
                        if (!itemIsOverdue && !allSubItemsCompleted && itemSubItems.length > 0) {
                          availableStatuses = availableStatuses.filter(s => s !== 'Concluído') as any;
                        }
                        
                        return (
                          <Select onValueChange={field.onChange} value={field.value} disabled={!canEditStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }}
                    />
                    {(() => {
                      const itemEndDate = watchItems?.[index]?.endDate;
                      const itemStatus = watchItems?.[index]?.status;
                      const itemIsOverdue = itemEndDate ? isOverdue(itemEndDate, itemStatus) : false;
                      const itemSubItems = watchItems?.[index]?.subItems || [];
                      const allSubItemsCompleted = itemSubItems.length > 0 
                        ? itemSubItems.every((si: any) => si.status === 'Concluído')
                        : true;
                      
                      if (itemIsOverdue) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            Item em atraso: apenas Atrasado ou Concluído disponíveis
                          </p>
                        );
                      }
                      
                      if (!allSubItemsCompleted && itemSubItems.length > 0) {
                        return (
                          <p className="text-xs text-destructive">
                            Não é possível concluir: todos os subitens devem estar concluídos
                          </p>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Área</Label>
                    <Controller
                      name={`items.${index}.areaId`}
                      control={control}
                      render={({ field }) => (
                        <Select 
                          onValueChange={(value) => {
                            // Não permitir mudança - sempre usar a área do projeto
                            field.onChange(watchAreaId || value);
                          }} 
                          value={watchAreaId || field.value} 
                          disabled={true}
                        >
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
                    {errors.items?.[index]?.areaId && (
                      <p className="text-sm text-destructive">{errors.items[index]?.areaId?.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Controller
                      name={`items.${index}.priority`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLimitedMode}>
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
                      Responsável <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      {...register(`items.${index}.responsible`)}
                      placeholder="Ex: Maria Silva"
                      className={cn(errors.items?.[index]?.responsible && "border-destructive")}
                      disabled={isLimitedMode}
                    />
                    {errors.items?.[index]?.responsible && (
                      <p className="text-sm text-destructive">{errors.items[index]?.responsible?.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    {...register(`items.${index}.description`)}
                    placeholder="Descreva a item..."
                    rows={2}
                    className={cn(errors.items?.[index]?.description && "border-destructive")}
                    disabled={isLimitedMode}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-sm text-destructive">{errors.items[index]?.description?.message}</p>
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
                      disabled={isLimitedMode}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Subitem
                    </Button>
                  </div>
                  
                  {watchItems?.[index]?.subItems && watchItems[index].subItems.length > 0 ? (
                    <div className="space-y-3">
                      {watchItems[index].subItems.map((subItem: any, subItemIndex: number) => (
                        <div key={subItemIndex} className="space-y-2 p-2 border rounded bg-background">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Subitem {subItemIndex + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removeSubItem(index, subItemIndex)}
                              disabled={isLimitedMode}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Checkbox de Vinculação (apenas para subitens após o primeiro) */}
                          {subItemIndex > 0 && (
                            <div className="flex items-center space-x-2 pb-1">
                              <Controller
                                name={`items.${index}.subItems.${subItemIndex}.linkedToPrevious`}
                                control={control}
                                render={({ field }) => {
                                  const previousSubItem = watchItems?.[index]?.subItems?.[subItemIndex - 1];
                                  const previousHasEndDate = previousSubItem?.endDate ? true : false;
                                  const isDisabled = isLimitedMode || !canEditDeadline || !previousHasEndDate;
                                  
                                  return (
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`linked-subitem-${index}-${subItemIndex}`}
                                        checked={field.value || false}
                                        onCheckedChange={(checked) => {
                                          if (previousHasEndDate) {
                                            field.onChange(checked);
                                          }
                                        }}
                                        disabled={isDisabled}
                                      />
                                      <Label htmlFor={`linked-subitem-${index}-${subItemIndex}`} className="text-xs font-normal cursor-pointer">
                                        Vincular ao subitem anterior
                                      </Label>
                                      {!previousHasEndDate && (
                                        <p className="text-xs text-muted-foreground">
                                          O subitem anterior precisa ter data de fim definida para vincular.
                                        </p>
                                      )}
                                    </div>
                                  );
                                }}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Título</Label>
                              <Input
                                {...register(`items.${index}.subItems.${subItemIndex}.title`)}
                                placeholder="Título do subitem"
                                className="h-8 text-sm"
                                disabled={isLimitedMode}
                              />
                              {errors.items?.[index]?.subItems?.[subItemIndex]?.title && (
                                <p className="text-xs text-destructive">{errors.items[index]?.subItems?.[subItemIndex]?.title?.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Responsável *</Label>
                              <Input
                                {...register(`items.${index}.subItems.${subItemIndex}.responsible`)}
                                placeholder="Responsável"
                                className="h-8 text-sm"
                                disabled={isLimitedMode}
                              />
                              {errors.items?.[index]?.subItems?.[subItemIndex]?.responsible && (
                                <p className="text-xs text-destructive">{errors.items[index]?.subItems?.[subItemIndex]?.responsible?.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Data de Início {!watchItems?.[index]?.subItems?.[subItemIndex]?.linkedToPrevious && <span className="text-destructive">*</span>}</Label>
                              <Controller
                                name={`items.${index}.subItems.${subItemIndex}.startDate`}
                                control={control}
                                render={({ field }) => {
                                  const isLinked = watchItems?.[index]?.subItems?.[subItemIndex]?.linkedToPrevious;
                                  const previousSubItem = subItemIndex > 0 ? watchItems?.[index]?.subItems?.[subItemIndex - 1] : null;
                                  // Se vinculado, usar endDate do anterior
                                  const displayValue = isLinked && previousSubItem?.endDate ? previousSubItem.endDate : field.value;
                                  
                                  return (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          className={cn("w-full justify-start text-left font-normal h-8 text-sm", errors.items?.[index]?.subItems?.[subItemIndex]?.startDate && "border-destructive")} 
                                          disabled={!canEditDeadline || isLimitedMode || isLinked}
                                        >
                                          <CalendarIcon className="mr-2 h-3 w-3" />
                                          {displayValue ? format(displayValue, "dd/MM/yyyy") : <span>Selecione</span>}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          mode="single"
                                          selected={displayValue || undefined}
                                          onSelect={(date) => {
                                            if (!isLinked) {
                                              field.onChange(date);
                                            }
                                          }}
                                          initialFocus
                                          disabled={!canEditDeadline || isLimitedMode || isLinked}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  );
                                }}
                              />
                              {watchItems?.[index]?.subItems?.[subItemIndex]?.linkedToPrevious && (
                                <p className="text-xs text-muted-foreground">
                                  Data de início definida automaticamente pela data de fim do subitem anterior.
                                </p>
                              )}
                              {errors.items?.[index]?.subItems?.[subItemIndex]?.startDate && (
                                <p className="text-xs text-destructive">{errors.items[index]?.subItems?.[subItemIndex]?.startDate?.message}</p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Data de Fim <span className="text-destructive">*</span></Label>
                              <Controller
                                name={`items.${index}.subItems.${subItemIndex}.endDate`}
                                control={control}
                                render={({ field }) => (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        className={cn("w-full justify-start text-left font-normal h-8 text-sm", errors.items?.[index]?.subItems?.[subItemIndex]?.endDate && "border-destructive")} 
                                        disabled={!canEditDeadline || isLimitedMode}
                                      >
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
                                        disabled={!canEditDeadline || isLimitedMode}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                )}
                              />
                              {!canEditDeadline && (
                                <p className="text-xs text-muted-foreground">
                                  Você não tem permissão para editar as datas. Apenas PMO pode alterar datas.
                                </p>
                              )}
                              {errors.items?.[index]?.subItems?.[subItemIndex]?.endDate && (
                                <p className="text-xs text-destructive">{errors.items[index]?.subItems?.[subItemIndex]?.endDate?.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Status</Label>
                              <Controller
                                name={`items.${index}.subItems.${subItemIndex}.status`}
                                control={control}
                                render={({ field }) => {
                                  // Verificar se o subitem está em atraso
                                  const subItemEndDate = watchItems?.[index]?.subItems?.[subItemIndex]?.endDate;
                                  const subItemStatus = field.value;
                                  const subItemIsOverdue = subItemEndDate ? isOverdue(subItemEndDate, subItemStatus) : false;
                                  const availableStatuses = subItemIsOverdue 
                                    ? getAvailableStatuses(true)
                                    : ['Pendente', 'Em execução', 'Concluído', 'Suspenso'] as const;
                                  
                                  return (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEditStatus}>
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue placeholder="Status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableStatuses.map(status => (
                                          <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  );
                                }}
                              />
                              {(() => {
                                const subItemEndDate = watchItems?.[index]?.subItems?.[subItemIndex]?.endDate;
                                const subItemStatus = watchItems?.[index]?.subItems?.[subItemIndex]?.status;
                                const subItemIsOverdue = subItemEndDate ? isOverdue(subItemEndDate, subItemStatus) : false;
                                return subItemIsOverdue ? (
                                  <p className="text-xs text-muted-foreground">
                                    Subitem em atraso: apenas Atrasado ou Concluído disponíveis
                                  </p>
                                ) : null;
                              })()}
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">Prioridade</Label>
                              <Controller
                                name={`items.${index}.subItems.${subItemIndex}.priority`}
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value} disabled={isLimitedMode}>
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
                              {...register(`items.${index}.subItems.${subItemIndex}.description`)}
                              placeholder="Observações do subitem"
                              rows={2}
                              className="text-sm"
                              disabled={isLimitedMode}
                            />
                            {errors.items?.[index]?.subItems?.[subItemIndex]?.description && (
                              <p className="text-xs text-destructive">{errors.items[index]?.subItems?.[subItemIndex]?.description?.message}</p>
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
            {errors.items && (
              <div className="text-sm text-destructive space-y-1 p-3 border border-destructive rounded-md bg-destructive/10">
                <p className="font-semibold">Erros encontrados nas items:</p>
                {Array.isArray(errors.items) && errors.items.map((itemError: any, idx: number) => {
                  if (!itemError) return null;
                  return (
                    <div key={idx} className="ml-4 mt-2">
                      <p className="font-medium">Item {idx + 1}:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        {itemError.title && <li>{itemError.title.message}</li>}
                        {itemError.startDate && <li>{itemError.startDate.message}</li>}
                        {itemError.endDate && <li>{itemError.endDate.message}</li>}
                        {itemError.description && <li>{itemError.description.message}</li>}
                        {itemError.responsible && <li>{itemError.responsible.message}</li>}
                        {itemError.areaId && <li>{itemError.areaId.message}</li>}
                        {itemError.subItems && Array.isArray(itemError.subItems) && itemError.subItems.map((subItemError: any, subIdx: number) => {
                          if (!subItemError) return null;
                          return (
                            <li key={subIdx}>
                              Subitem {subIdx + 1}:
                              <ul className="list-disc list-inside ml-4 space-y-1">
                                {subItemError.title && <li>{subItemError.title.message}</li>}
                                {subItemError.startDate && <li>{subItemError.startDate.message}</li>}
                                {subItemError.endDate && <li>{subItemError.endDate.message}</li>}
                                {subItemError.responsible && <li>{subItemError.responsible.message}</li>}
                                {subItemError.description && <li>{subItemError.description.message}</li>}
                              </ul>
                            </li>
                          );
                        })}
                        {/* Exibir erro de subItems quando há erro no array inteiro (validação pai-filho) */}
                        {itemError.subItems && typeof itemError.subItems === 'object' && !Array.isArray(itemError.subItems) && 'message' in itemError.subItems && (
                          <li className="font-semibold text-destructive">{String(itemError.subItems.message)}</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
                {/* Exibir erro de items quando há erro no array inteiro (validação pai-filho) */}
                {typeof errors.items === 'object' && !Array.isArray(errors.items) && 'message' in errors.items && (
                  <p className="mt-2 font-semibold">{String(errors.items.message)}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhuma item adicionada. Adicione pelo menos uma item.
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

    