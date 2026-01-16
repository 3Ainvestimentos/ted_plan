
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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
  // Nota: Quando linkedToPrevious é true, o startDate é calculado automaticamente
  // e pode não estar no objeto no momento desta validação. A validação completa
  // será feita no itemSchema.superRefine que tem acesso ao array completo de subitens.
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
  message: "A data de fim do item deve ser maior que a data de fim do subitem.",
  path: ["subItems"],
}).superRefine((data, ctx) => {
  // Validação adicional: verificar endDate >= startDate para subitens vinculados
  // Quando linkedToPrevious é true, o startDate é o endDate do subitem anterior
  if (data.subItems && data.subItems.length > 0) {
    data.subItems.forEach((subItem, index) => {
      // Se está vinculado e não tem startDate definido, usar endDate do subitem anterior
      if (subItem.linkedToPrevious && index > 0) {
        const previousSubItem = data.subItems?.[index - 1];
        const actualStartDate = previousSubItem?.endDate;
        
        // Validar que endDate >= startDate calculado
        if (actualStartDate && subItem.endDate && subItem.endDate < actualStartDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A data de fim deve ser maior ou igual à data de início.",
            path: ["subItems", index, "endDate"],
          });
        }
      }
      // Se não está vinculado mas tem startDate e endDate, validar (validação dupla de segurança)
      if (!subItem.linkedToPrevious && subItem.startDate && subItem.endDate && subItem.endDate < subItem.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A data de fim deve ser maior ou igual à data de início.",
          path: ["subItems", index, "endDate"],
        });
      }
    });
  }
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
  items: z.array(itemSchema).min(1, "É necessário adicionar pelo menos um item antes de criar a iniciativa."),
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
    clearErrors,
    trigger,
    formState: { errors, isSubmitted },
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
    mode: 'onChange', // Para validação em tempo real
    reValidateMode: 'onChange', // Revalidar ao mudar para limpar erros automaticamente
    shouldUnregister: false, // Manter valores mesmo quando campos são removidos
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchAreaId = watch("areaId");
  const watchStatus = watch("status");
  const hasItems = watchItems && watchItems.length > 0;
  
  // Estado para controlar mensagens de erro temporárias (desaparecem após 20s ou quando status muda)
  const [tempErrorMessages, setTempErrorMessages] = useState<Set<string>>(new Set());
  
  // Ref para armazenar timeouts e permitir cleanup adequado
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  /**
   * Adiciona uma mensagem de erro temporária que desaparece após 20 segundos
   * ou quando o status correspondente mudar
   */
  const addTempErrorMessage = useCallback((key: string) => {
    // Limpar timeout anterior se existir
    const existingTimeout = timeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Adicionar mensagem ao estado
    setTempErrorMessages(prev => new Set(prev).add(key));
    
    // Criar novo timeout
    const timeoutId = setTimeout(() => {
      setTempErrorMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      timeoutsRef.current.delete(key);
    }, 20000);
    
    // Armazenar timeout para cleanup
    timeoutsRef.current.set(key, timeoutId);
  }, []);
  
  /**
   * Remove uma mensagem de erro temporária manualmente
   */
  const removeTempErrorMessage = useCallback((key: string) => {
    // Limpar timeout se existir
    const timeout = timeoutsRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(key);
    }
    
    // Remover do estado
    setTempErrorMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);
  
  /**
   * Limpa todas as mensagens de erro temporárias
   */
  const clearAllTempErrorMessages = useCallback(() => {
    // Limpar todos os timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    
    // Limpar estado
    setTempErrorMessages(new Set());
  }, []);
  
  // Limpar mensagens quando status mudar (consolidado em um único useEffect)
  useEffect(() => {
    // Limpar mensagem de erro da iniciativa quando status mudar
    if (tempErrorMessages.has('initiative-status')) {
      removeTempErrorMessage('initiative-status');
    }
    
    // Limpar mensagens de erro dos itens quando seus status mudarem
    if (watchItems && watchItems.length > 0) {
      watchItems.forEach((item: any, index: number) => {
        const errorKey = `item-${index}-status`;
        if (tempErrorMessages.has(errorKey)) {
          removeTempErrorMessage(errorKey);
        }
        
        // Limpar mensagens de erro dos subitens quando seus status mudarem
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.forEach((subItem: any, subItemIndex: number) => {
            const subItemErrorKey = `subitem-${index}-${subItemIndex}-status`;
            if (tempErrorMessages.has(subItemErrorKey)) {
              removeTempErrorMessage(subItemErrorKey);
            }
          });
        }
      });
    }
  }, [watchStatus, watchItems, tempErrorMessages, removeTempErrorMessage]);
  
  // Cleanup: limpar todos os timeouts quando o componente desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);
  
  /**
   * Verifica se todos os itens e subitens estão concluídos e atualiza status da iniciativa automaticamente
   * 
   * REGRAS:
   * - Iniciativa só pode ser "Concluído" quando TODOS os itens estiverem "Concluído"
   * - Item só é considerado concluído se:
   *   - Tem subitens: todos os subitens E o item devem estar "Concluído"
   *   - Não tem subitens: apenas o item deve estar "Concluído"
   * - Se nem todos os itens estão concluídos mas iniciativa está concluída, reverter para "Em execução"
   */
  const checkAndUpdateInitiativeStatus = useCallback(() => {
    if (!watchItems || watchItems.length === 0) {
      return;
    }
    
    // Verificar se todos os itens estão concluídos
    const allItemsCompleted = watchItems.every((item: any) => {
      // Se item tem subitens, verificar se todos estão concluídos E o item também
      if (item.subItems && item.subItems.length > 0) {
        const allSubItemsCompleted = item.subItems.every((subItem: any) => subItem.status === 'Concluído');
        // Item só está concluído se todos os subitens estiverem concluídos E o item também
        return allSubItemsCompleted && item.status === 'Concluído';
      }
      // Se não tem subitens, verificar apenas o status do item
      return item.status === 'Concluído';
    });
    
    const currentStatus = getValues('status');
    
    // Se todos os itens estão concluídos e iniciativa não está concluída, atualizar
    if (allItemsCompleted && currentStatus !== 'Concluído') {
      setValue('status', 'Concluído', { shouldValidate: false });
    }
    
    // Se nem todos os itens estão concluídos mas iniciativa está concluída, reverter
    if (!allItemsCompleted && currentStatus === 'Concluído') {
      setValue('status', 'Em execução', { shouldValidate: false });
    }
  }, [watchItems, getValues, setValue]);
  
  // Observar mudanças nos status dos itens e subitens para atualizar status da iniciativa automaticamente
  useEffect(() => {
    checkAndUpdateInitiativeStatus();
  }, [
    // Criar string de dependência baseada nos status de todos os itens e subitens
    watchItems?.map((item: any, idx: number) => {
      const itemStatus = item.status || '';
      const subItemsStatus = item.subItems 
        ? item.subItems.map((si: any) => si.status || '').join(',')
        : '';
      return `${idx}:${itemStatus}:${subItemsStatus}`;
    }).join('|'),
    checkAndUpdateInitiativeStatus
  ]);

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
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:437',message:'useEffect: calculating automatic startDate',data:{itemsCount:watchItems?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    if (watchItems && watchItems.length > 0) {
      watchItems.forEach((item, index) => {
        // Se não é o primeiro item e está vinculado
        if (index > 0 && item.linkedToPrevious) {
          const previousItem = watchItems[index - 1];
          // Se o item anterior tem endDate, usar como startDate do atual
          if (previousItem?.endDate) {
            const currentStartDate = getValues(`items.${index}.startDate`);
            const previousEndDate = previousItem.endDate;
            
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:452',message:'Calculating item startDate from previous',data:{itemIndex:index,previousEndDate:previousEndDate?.toString(),currentStartDate:currentStartDate?.toString(),willUpdate:currentStartDate!==previousEndDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
            // #endregion
            
            // Só atualizar se for diferente para evitar loops infinitos
            if (currentStartDate !== previousEndDate) {
              setValue(`items.${index}.startDate`, previousEndDate, { shouldValidate: true });
              
              // Verificar imediatamente se endDate < startDate calculado e revalidar
              const currentEndDate = getValues(`items.${index}.endDate`);
              if (currentEndDate && previousEndDate && currentEndDate < previousEndDate) {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:460',message:'Item endDate conflict detected after auto-calculation',data:{itemIndex:index,calculatedStartDate:previousEndDate?.toString(),currentEndDate:currentEndDate?.toString(),hasConflict:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                // #endregion
                // Limpar e revalidar para exibir erro imediatamente
                clearErrors(`items.${index}.endDate`);
                // Revalidar após pequeno delay para garantir que o startDate foi atualizado
                setTimeout(() => {
                  trigger(`items.${index}.endDate`);
                }, 50);
              } else {
                // Se não há conflito, limpar erros relacionados
                clearErrors(`items.${index}.endDate`);
              }
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
                
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:481',message:'Calculating subItem startDate from previous',data:{itemIndex:index,subItemIndex,previousEndDate:previousEndDate?.toString(),currentStartDate:currentStartDate?.toString(),willUpdate:currentStartDate!==previousEndDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                // #endregion
                
                // Só atualizar se for diferente para evitar loops infinitos
                if (currentStartDate !== previousEndDate) {
                  setValue(`items.${index}.subItems.${subItemIndex}.startDate`, previousEndDate, { shouldValidate: true });
                  
                  // Verificar imediatamente se endDate < startDate calculado e revalidar
                  const currentEndDate = getValues(`items.${index}.subItems.${subItemIndex}.endDate`);
                  if (currentEndDate && previousEndDate && currentEndDate < previousEndDate) {
                    // #region agent log
                    fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:489',message:'SubItem endDate conflict detected after auto-calculation',data:{itemIndex:index,subItemIndex,calculatedStartDate:previousEndDate?.toString(),currentEndDate:currentEndDate?.toString(),hasConflict:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                    // #endregion
                    // Limpar e revalidar para exibir erro imediatamente
                    clearErrors(`items.${index}.subItems.${subItemIndex}.endDate`);
                    clearErrors(`items.${index}.subItems`);
                    // Revalidar após pequeno delay para garantir que o startDate foi atualizado
                    setTimeout(() => {
                      trigger(`items.${index}.subItems.${subItemIndex}.endDate`);
                      trigger(`items.${index}.subItems`);
                    }, 50);
                  } else {
                    // Se não há conflito, limpar erros relacionados
                    clearErrors(`items.${index}.subItems.${subItemIndex}.endDate`);
                    clearErrors(`items.${index}.subItems`);
                  }
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
    
    // Se for array, verificar se está vazio ou só tem null/undefined/vazios
    if (Array.isArray(errorObj)) {
      // Se array só tem null/undefined/objetos vazios, não há erros
      const hasNonEmptyItems = errorObj.some(item => {
        if (item === null || item === undefined) return false;
        if (typeof item === 'object' && Object.keys(item).length === 0) return false;
        return true;
      });
      if (!hasNonEmptyItems) return false;
      return errorObj.some(item => hasRealErrorMessage(item));
    }
    
    // Verificar se o objeto está vazio (sem propriedades próprias)
    const ownKeys = Object.keys(errorObj);
    if (ownKeys.length === 0) {
      return false; // Objeto vazio não tem erros
    }
    
    // Verificar se tem mensagem direta
    if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.trim().length > 0) {
      return true;
    }
    
    // Verificar se há um objeto 'root' com mensagem (erro de validação customizado do Zod)
    if (errorObj.root && typeof errorObj.root === 'object') {
      if (errorObj.root.message && typeof errorObj.root.message === 'string' && errorObj.root.message.trim().length > 0) {
        return true;
      }
      // Verificar recursivamente dentro de root também
      if (hasRealErrorMessage(errorObj.root)) {
        return true;
      }
    }
    
    // Ignorar propriedades especiais do react-hook-form que não são erros reais (mas já verificamos root acima)
    const ignoredKeys = ['_errors', 'type', 'ref'];
    
    // Verificar recursivamente em todas as propriedades (exceto as ignoradas)
    for (const key in errorObj) {
      if (ignoredKeys.includes(key)) {
        continue;
      }
      
      // Não verificar 'root' novamente, já verificamos acima
      if (key === 'root') {
        continue;
      }
      
      if (hasRealErrorMessage(errorObj[key])) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Verifica se há erro de items obrigatórios (array vazio)
   * 
   * @param itemsErrors - Objeto de erros de items
   * @returns true se houver erro de mínimo de items
   */
  const hasItemsMinError = (itemsErrors: any): boolean => {
    return !!itemsErrors && 
           typeof itemsErrors === 'object' && 
           !Array.isArray(itemsErrors) && 
           'message' in itemsErrors;
  };

  /**
   * Extrai mensagens de erro de forma recursiva
   * Protegido contra recursão infinita com Set de objetos visitados
   */
  const extractErrorMessages = (
    errorObj: any, 
    path: string = '', 
    visited: WeakSet<any> = new WeakSet(),
    depth: number = 0,
    maxDepth: number = 10
  ): Array<{ path: string; message: string }> => {
    const messages: Array<{ path: string; message: string }> = [];
    
    // Limite de profundidade para evitar recursão excessiva
    if (depth > maxDepth) {
      return messages;
    }
    
    if (!errorObj || typeof errorObj !== 'object') {
      return messages;
    }
    
    // Proteção contra referências circulares: objetos e arrays
    if (typeof errorObj === 'object' && !Array.isArray(errorObj)) {
      if (visited.has(errorObj)) {
        return messages; // Objeto já visitado, evitar recursão infinita
      }
      visited.add(errorObj);
    }
    
    // Verificar mensagem direta
    if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.trim().length > 0) {
      messages.push({ path, message: errorObj.message });
    }
    
    // Verificar mensagem em root (validação customizada do Zod)
    if (errorObj.root?.message && typeof errorObj.root.message === 'string' && errorObj.root.message.trim().length > 0) {
      messages.push({ path: path || 'root', message: errorObj.root.message });
    }
    
    // Verificar recursivamente apenas propriedades serializáveis
    const ignoredKeys = ['ref', 'nativeEvent', 'target', 'currentTarget', 'root', 'message'];
    
    for (const key in errorObj) {
      // Ignorar chaves que podem causar problemas ou já foram verificadas
      if (ignoredKeys.includes(key)) continue;
      
      // Ignorar funções e símbolos
      if (typeof errorObj[key] === 'function' || typeof key === 'symbol') continue;
      
      const currentPath = path ? `${path}.${key}` : key;
      const nestedMessages = extractErrorMessages(errorObj[key], currentPath, visited, depth + 1, maxDepth);
      messages.push(...nestedMessages);
    }
    
    return messages;
  };

  /**
   * Serializa erros de forma segura removendo referências circulares
   * Extrai apenas dados serializáveis para logs
   */
  const serializeErrorsForLog = (errors: any): any => {
    if (!errors || typeof errors !== 'object') {
      return { errorCount: 0, errorMessages: [] };
    }
    
    // Usar extractErrorMessages para extrair apenas mensagens
    const errorMessages = extractErrorMessages(errors);
    const errorKeys = errors ? Object.keys(errors).filter(key => 
      !key.startsWith('_') && 
      !key.includes('Fiber') && 
      !key.includes('react') &&
      key !== 'ref' &&
      key !== 'nativeEvent' &&
      key !== 'target' &&
      key !== 'currentTarget'
    ) : [];
    
    return {
      errorKeys,
      errorMessages,
      errorCount: errorMessages.length,
      // Não serializar o objeto errors completo para evitar referências circulares
    };
  };

  /**
   * Handler de erros de validação do formulário
   * 
   * @param errors - Objeto de erros do react-hook-form
   */
  const onError = (errors: any) => {
    // Serializar erros uma vez no início para usar em todos os logs
    const errorsSafe = serializeErrorsForLog(errors);
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:669',message:'onError called',data:{errorsSafe,isEmpty:!errors||Object.keys(errors||{}).length===0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Verificar se errors existe e não está vazio
    if (!errors || typeof errors !== 'object') {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:675',message:'onError early return: invalid errors',data:{errorsSafe},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    // Verificar se é um objeto vazio (sem propriedades próprias)
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:682',message:'onError early return: empty errors object',data:{errorsSafe},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Objeto vazio: não há erros reais, permitir submissão
      return;
    }
    
    const hasRealErrors = hasRealErrorMessage(errors);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:693',message:'onError: checking real errors',data:{errorsSafe,errorKeys,hasRealErrors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Ignorar completamente se não houver erros reais
    if (!hasRealErrors) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:699',message:'onError early return: no real error messages',data:{errorsSafe},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Objeto com propriedades mas sem mensagens de erro reais, permitir submissão
      return;
    }
    
    // Log apenas quando houver erros reais
    if (hasRealErrors) {
      console.error("Erros de validação:", errors);
    }
    
    // Extrair todas as mensagens de erro
    const errorMessages = extractErrorMessages(errors);
    const firstErrorMessage = errorMessages[0];
    
    // Função auxiliar para fazer scroll com offset (campo não fica no extremo norte)
    const scrollToElementWithOffset = (element: Element, offset: number = 80) => {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    };
    
    // Tratar erro de items (array vazio)
    if (hasItemsMinError(errors.items)) {
      const itemsSection = document.querySelector('[data-items-section]');
      if (itemsSection) {
        setTimeout(() => {
          scrollToElementWithOffset(itemsSection, 100);
        }, 100);
        return;
      }
    }
    
    // Tratar erros de subItems.root (data de fim do subitem > data de fim do item)
    if (errors.items && Array.isArray(errors.items)) {
      for (let itemIndex = 0; itemIndex < errors.items.length; itemIndex++) {
        const itemError = errors.items[itemIndex];
        if (itemError?.subItems?.root?.message) {
          // Para este tipo de erro, rolar para o endDate do item (não do subitem)
          // Encontrar o botão de data do item e fazer scroll
          setTimeout(() => {
            let targetElement: Element | null = null;
            
            // Encontrar todos os labels "Data de Fim" dentro da seção de items
            const itemsSection = document.querySelector('[data-items-section]');
            if (itemsSection) {
              const allLabels = Array.from(itemsSection.querySelectorAll('label'));
              const endDateLabels = allLabels.filter(label => 
                label.textContent?.trim().startsWith('Data de Fim') || 
                label.textContent?.includes('Data de Fim')
              );
              
              // Pegar o label correspondente ao índice do item (considerando que cada item tem um label "Data de Fim")
              if (endDateLabels[itemIndex]) {
                const label = endDateLabels[itemIndex];
                // Procurar o botão mais próximo ao label (pode estar no mesmo parent ou próximo)
                const labelParent = label.parentElement;
                if (labelParent) {
                  // Procurar botão no mesmo container
                  targetElement = labelParent.querySelector('button[class*="border"]') || 
                                 labelParent.querySelector('button');
                  
                  // Se não encontrou no parent direto, procurar nos irmãos
                  if (!targetElement && labelParent.parentElement) {
                    targetElement = labelParent.parentElement.querySelector('button');
                  }
                }
              }
            }
            
            // Fallback: Se não encontrou, rolar para a seção de items ou área de erros
            if (targetElement) {
              scrollToElementWithOffset(targetElement, 120);
            } else {
              // Rolar para a seção de items
              const itemsSection = document.querySelector('[data-items-section]');
              if (itemsSection) {
                scrollToElementWithOffset(itemsSection, 100);
              }
            }
          }, 200);
          return;
        }
      }
    }
    
    // Para outros erros, usar a primeira mensagem encontrada
    if (firstErrorMessage && firstErrorMessage.path) {
      const errorPath = firstErrorMessage.path;
      
      // Fazer scroll para o campo com erro
      setTimeout(() => {
        const fieldName = errorPath.split('.').pop();
        // Tentar várias estratégias para encontrar o elemento
        let element = document.querySelector(`[name="${errorPath}"]`) ||
                     document.querySelector(`[name="${fieldName}"]`) ||
                     document.querySelector(`#${fieldName}`);
        
        // Se for um campo de data (Controller), o input pode estar dentro de um PopoverTrigger button
        if (!element && errorPath.includes('endDate')) {
          const button = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.getAttribute('aria-label')?.includes('endDate') ||
            btn.textContent?.includes('Selecione') ||
            btn.querySelector('[name*="endDate"]')
          );
          if (button) element = button;
        }
        
        if (element) {
          scrollToElementWithOffset(element, 100);
        } else {
          // Fallback: rolar para a seção de items
          const itemsSection = document.querySelector('[data-items-section]');
          if (itemsSection) {
            scrollToElementWithOffset(itemsSection, 100);
          }
        }
      }, 150);
    }
  };

  // Wrapper para rastrear quando onSubmit é chamado
  const handleFormSubmit = (data: InitiativeFormData) => {
    // #region agent log
    const itemsWithSubItems = data.items?.map((item, idx) => ({
      index: idx,
      title: item.title,
      subItemsCount: item.subItems?.length || 0,
      subItems: item.subItems?.map((si, siIdx) => ({
        index: siIdx,
        title: si.title,
        hasStartDate: !!si.startDate,
        hasEndDate: !!si.endDate,
        linkedToPrevious: si.linkedToPrevious,
        hasResponsible: !!si.responsible,
        startDate: si.startDate?.toString(),
        endDate: si.endDate?.toString(),
      })) || []
    })) || [];
    
    fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:634',message:'Form onSubmit called with subitems data',data:{hasTitle:!!data.title,itemsCount:data.items?.length||0,hasStartDate:!!data.startDate,hasEndDate:!!data.endDate,itemsWithSubItems},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    try {
      onSubmit(data);
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:650',message:'onSubmit completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:653',message:'onSubmit threw error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  };

  // Wrapper para handleSubmit que loga o estado de erros
  const wrappedHandleSubmit = handleSubmit(
    handleFormSubmit,
    (errors) => {
      // Extrair erros detalhados dos subitens
      const subItemErrors: any[] = [];
      if (errors.items && Array.isArray(errors.items)) {
        errors.items.forEach((itemError: any, itemIdx: number) => {
          if (itemError?.subItems) {
            if (Array.isArray(itemError.subItems)) {
              itemError.subItems.forEach((subItemError: any, subItemIdx: number) => {
                if (subItemError) {
                  subItemErrors.push({
                    itemIndex: itemIdx,
                    subItemIndex: subItemIdx,
                    errors: {
                      title: subItemError.title?.message,
                      startDate: subItemError.startDate?.message,
                      endDate: subItemError.endDate?.message,
                      responsible: subItemError.responsible?.message,
                    }
                  });
                }
              });
            } else if (typeof itemError.subItems === 'object' && 'message' in itemError.subItems) {
              subItemErrors.push({
                itemIndex: itemIdx,
                subItemIndex: -1,
                errors: {
                  subItems: itemError.subItems.message
                }
              });
            }
          }
        });
      }
      
      // #region agent log
      const errorsSafe = serializeErrorsForLog(errors);
      fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:918',message:'handleSubmit validation failed with subitem errors',data:{errorsSafe,subItemErrors,hasRealErrors:hasRealErrorMessage(errors)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      // Verificar se realmente há erros reais
      if (!hasRealErrorMessage(errors)) {
        // #region agent log
        const errorsSafe = serializeErrorsForLog(errors);
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiative-form.tsx:932',message:'No real errors, clearing and re-submitting',data:{errorsSafe},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // Limpar erros falsos e tentar submeter novamente
        clearErrors();
        // Usar setTimeout para permitir que o estado seja atualizado
        setTimeout(() => {
          handleSubmit(handleFormSubmit)();
        }, 0);
        return;
      }
      
      // Se houver erros reais, chamar onError normalmente
      onError(errors);
    }
  );

  return (
    <form onSubmit={wrappedHandleSubmit} className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título da Iniciativa</Label>
        <Input id="title" {...register("title")} placeholder="Ex: Otimizar o Funil de Vendas" disabled={isLimitedMode} />
        {isSubmitted && errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
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
                              onSelect={(date) => {
                                field.onChange(date);
                                // Limpar erro de startDate quando a data mudar
                                clearErrors('startDate');
                                // Limpar erro de endDate se houver (relacionado à validação endDate >= startDate)
                                clearErrors('endDate');
                                // Revalidar endDate para atualizar erros relacionados
                                trigger('endDate');
                              }}
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
              {isSubmitted && errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
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
                              onSelect={(date) => {
                                field.onChange(date);
                                // Limpar erro de endDate quando a data mudar
                                clearErrors('endDate');
                                // Limpar erro de startDate se houver (relacionado à validação endDate >= startDate)
                                clearErrors('startDate');
                                // Limpar erros de items se houver (relacionado à validação item.endDate <= initiative.endDate)
                                clearErrors('items');
                                // Revalidar campos relacionados
                                trigger('startDate');
                                trigger('items');
                              }}
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
              {isSubmitted && errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
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
              {isSubmitted && errors.areaId && <p className="text-sm text-destructive">{errors.areaId.message}</p>}
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
              {isSubmitted && errors.owner && <p className="text-sm text-destructive">{errors.owner.message}</p>}
          </div>
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
                    
                    // Status disponíveis - manter todos os status, validação será feita no onValueChange
                    const availableStatuses = ['Pendente', 'Em execução', 'Concluído', 'Suspenso'] as const;
                    
                    return (
                      <Select 
                        onValueChange={(newStatus: InitiativeStatus) => {
                          // Verificar se está tentando concluir sem todas as items concluídas
                          if (newStatus === 'Concluído' && !allItemsCompleted && watchItems && watchItems.length > 0) {
                            // Adicionar mensagem de erro temporária
                            addTempErrorMessage('initiative-status');
                            // Não alterar o status, manter o atual
                            return;
                          }
                          // Limpar mensagem de erro se mudou para outro status
                          if (tempErrorMessages.has('initiative-status')) {
                            setTempErrorMessages(prev => {
                              const newSet = new Set(prev);
                              newSet.delete('initiative-status');
                              return newSet;
                            });
                          }
                          // Permitir mudança de status
                          field.onChange(newStatus);
                        }} 
                        value={field.value} 
                        disabled={!canEditStatus}
                      >
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
                
                // Mostrar mensagem de erro apenas se estiver no conjunto de mensagens temporárias
                if (!allItemsCompleted && watchItems && watchItems.length > 0 && tempErrorMessages.has('initiative-status')) {
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
      
       <div className="space-y-4 rounded-lg border p-4" data-items-section>
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
                // Limpar erro de "sem itens" quando um item é adicionado
                clearErrors('items');
              }}
              disabled={isLimitedMode}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
        </div>
        {/* Exibir erro de items obrigatórios no topo da seção apenas quando tentar submeter sem itens */}
        {isSubmitted && hasItemsMinError(errors.items) && (
          <div className="p-3 border-2 border-destructive rounded-md bg-destructive/20">
            <p className="text-sm font-semibold text-destructive">
              ⚠️ {String(errors.items?.message || 'É necessário adicionar pelo menos um item antes de criar a iniciativa.')}
            </p>
          </div>
        )}
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
                  {/* Linha 1: Título | Responsável */}
                  <div className="space-y-2">
                    <Label>Título da Item</Label>
                    <Input
                      {...register(`items.${index}.title`)}
                      placeholder="Ex: Planejamento"
                      className={cn(errors.items?.[index]?.title && "border-destructive")}
                      disabled={isLimitedMode}
                    />
                    {isSubmitted && errors.items?.[index]?.title && (
                      <p className="text-sm text-destructive">{errors.items[index]?.title?.message}</p>
                    )}
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
                    {isSubmitted && errors.items?.[index]?.responsible && (
                      <p className="text-sm text-destructive">{errors.items[index]?.responsible?.message}</p>
                    )}
                  </div>

                  {/* Linha 2: Data de Início | Data de Fim */}
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
                                    // Limpar erro de startDate quando a data mudar
                                    clearErrors(`items.${index}.startDate`);
                                    // Limpar erro de endDate se houver (relacionado à validação endDate >= startDate)
                                    clearErrors(`items.${index}.endDate`);
                                    // Revalidar endDate para atualizar erros relacionados
                                    trigger(`items.${index}.endDate`);
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
                    {isSubmitted && errors.items?.[index]?.startDate && (
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
                              className={cn(
                                "w-full justify-start text-left font-normal", 
                                (errors.items?.[index]?.endDate || errors.items?.[index]?.subItems?.root) && "border-destructive border-2"
                              )}
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
                              onSelect={(date) => {
                                field.onChange(date);
                                // Limpar erro de subItems.root quando a data mudar
                                clearErrors(`items.${index}.subItems`);
                                // Revalidar o item para atualizar erros
                                trigger(`items.${index}.endDate`);
                              }}
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
                    {isSubmitted && (errors.items?.[index]?.endDate || errors.items?.[index]?.subItems?.root) && (
                      <p className="text-sm text-destructive">
                        {errors.items[index]?.endDate?.message || errors.items[index]?.subItems?.root?.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Linha 3: Status | Prioridade */}
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
                        
                        // Chave única para mensagem de erro deste item
                        const errorKey = `item-${index}-status`;
                        
                        return (
                          <Select 
                            onValueChange={(newStatus: InitiativeStatus) => {
                              // Verificar se está tentando concluir sem todos os subitens concluídos
                              if (newStatus === 'Concluído' && !allSubItemsCompleted && itemSubItems.length > 0) {
                                // Adicionar mensagem de erro temporária
                                addTempErrorMessage(errorKey);
                                // Não alterar o status, manter o atual
                                return;
                              }
                              // Limpar mensagem de erro se mudou para outro status
                              if (tempErrorMessages.has(errorKey)) {
                                setTempErrorMessages(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(errorKey);
                                  return newSet;
                                });
                              }
                              // Permitir mudança de status
                              field.onChange(newStatus);
                            }} 
                            value={field.value} 
                            disabled={!canEditStatus}
                          >
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
                      
                      // Mostrar mensagem de erro apenas se estiver no conjunto de mensagens temporárias
                      if (!allSubItemsCompleted && itemSubItems.length > 0 && tempErrorMessages.has(`item-${index}-status`)) {
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
                              {isSubmitted && errors.items?.[index]?.subItems?.[subItemIndex]?.title && (
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
                              {isSubmitted && errors.items?.[index]?.subItems?.[subItemIndex]?.responsible && (
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
                                            // Limpar erro de startDate quando a data mudar
                                            clearErrors(`items.${index}.subItems.${subItemIndex}.startDate`);
                                            // Limpar erro de endDate se houver (relacionado à validação endDate >= startDate)
                                            clearErrors(`items.${index}.subItems.${subItemIndex}.endDate`);
                                            // Limpar erro de subItems.root se houver (validação de hierarquia)
                                            clearErrors(`items.${index}.subItems`);
                                            // Revalidar endDate e subItems para atualizar erros relacionados
                                            trigger(`items.${index}.subItems.${subItemIndex}.endDate`);
                                            trigger(`items.${index}.subItems`);
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
                              {isSubmitted && errors.items?.[index]?.subItems?.[subItemIndex]?.startDate && (
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
                                        onSelect={(date) => {
                                          field.onChange(date);
                                          // Limpar erro de subItems.root quando a data do subitem mudar
                                          clearErrors(`items.${index}.subItems`);
                                          // Revalidar o item para atualizar erros
                                          trigger(`items.${index}.endDate`);
                                        }}
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
                              {isSubmitted && errors.items?.[index]?.subItems?.[subItemIndex]?.endDate && (
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
                                  
                                  // Chave única para mensagem de erro deste subitem
                                  const errorKey = `subitem-${index}-${subItemIndex}-status`;
                                  
                                  return (
                                    <Select 
                                      onValueChange={(newStatus: InitiativeStatus) => {
                                        // Limpar mensagem de erro se mudou para outro status
                                        if (tempErrorMessages.has(errorKey)) {
                                          setTempErrorMessages(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(errorKey);
                                            return newSet;
                                          });
                                        }
                                        // Permitir mudança de status (subitens não têm filhos, podem ser concluídos livremente)
                                        field.onChange(newStatus);
                                      }} 
                                      value={field.value} 
                                      disabled={!canEditStatus}
                                    >
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
            {/* Exibir erros de itens individuais apenas quando há itens e erros específicos */}
            {errors.items && Array.isArray(errors.items) && errors.items.length > 0 && (
              <div className="text-sm text-destructive space-y-1 p-3 border border-destructive rounded-md bg-destructive/10">
                <p className="font-semibold">Erros encontrados nos itens:</p>
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
                        {itemError.subItems && typeof itemError.subItems === 'object' && !Array.isArray(itemError.subItems) && (
                          <>
                            {itemError.subItems.message && (
                              <li className="font-semibold text-destructive">{String(itemError.subItems.message)}</li>
                            )}
                            {itemError.subItems.root?.message && (
                              <li className="font-semibold text-destructive">{String(itemError.subItems.root.message)}</li>
                            )}
                          </>
                        )}
                      </ul>
                    </div>
                  );
                })}
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

    