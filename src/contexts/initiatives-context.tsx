
"use client";

import type { Initiative, InitiativeStatus, InitiativePriority, SubItem, InitiativeItem } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, writeBatch, setDoc, deleteField } from 'firebase/firestore';
import type { InitiativeFormData } from '@/components/initiatives/initiative-form';


type InitiativeData = Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'endDate' | 'startDate'> & { startDate: Date; endDate: Date };

interface InitiativesContextType {
  initiatives: Initiative[];
  addInitiative: (initiative: InitiativeFormData) => Promise<void>;
  updateInitiative: (initiativeId: string, data: InitiativeFormData) => Promise<void>;
  deleteInitiative: (initiativeId: string) => Promise<void>;
  archiveInitiative: (initiativeId: string) => Promise<void>;
  unarchiveInitiative: (initiativeId: string) => Promise<void>;
  updateInitiativeStatus: (initiativeId: string, newStatus: InitiativeStatus) => void;
  updateSubItem: (initiativeId: string, itemId: string, subItemId: string, completed: boolean, newStatus?: InitiativeStatus) => Promise<void>;
  addItem: (initiativeId: string, item: Omit<InitiativeItem, 'id'>) => Promise<void>;
  updateItem: (initiativeId: string, itemId: string, item: Partial<InitiativeItem>) => Promise<void>;
  deleteItem: (initiativeId: string, itemId: string) => Promise<void>;
  addSubItem: (initiativeId: string, itemId: string, subItem: Omit<SubItem, 'id'>) => Promise<void>;
  deleteSubItem: (initiativeId: string, itemId: string, subItemId: string) => Promise<void>;
  bulkAddInitiatives: (newInitiatives: Array<{
    title: string;
    owner: string;
    description?: string;
    status: InitiativeStatus;
    priority: InitiativePriority;
    startDate: string;
    endDate: string;
    areaId: string;
    items: Array<{
      title: string;
      startDate: string;
      endDate: string;
      status: InitiativeStatus;
      areaId: string;
      priority: InitiativePriority;
      description?: string;
      responsible: string;
      subItems?: Array<{
        title: string;
        startDate: string;
        endDate: string;
        status: InitiativeStatus;
        responsible: string;
        priority: InitiativePriority;
        description?: string;
      }>;
    }>;
  }>) => void;
  isLoading: boolean;
}

const InitiativesContext = createContext<InitiativesContextType | undefined>(undefined);

/**
 * ============================================
 * FUNÇÕES HELPER DE PROGRESSO E CONCLUSÃO
 * ============================================
 */

const calculateProgressFromSubItems = (subItems: SubItem[]): number => {
    if (!subItems || subItems.length === 0) return 0;
    const completedCount = subItems.filter(item => item.completed).length;
    return Math.round((completedCount / subItems.length) * 100);
};

const calculateProgressFromItems = (items: InitiativeItem[]): number => {
    if (!items || items.length === 0) return 0;
    
    const itemProgresses = items.map(item => {
        if (item.subItems && item.subItems.length > 0) {
            return calculateProgressFromSubItems(item.subItems);
        }
        return item.status === 'Concluído' ? 100 : 0;
    });
    
    const totalProgress = itemProgresses.reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / itemProgresses.length);
};

const calculateParentProgress = (parentId: string, allInitiatives: Initiative[]): number => {
    const children = allInitiatives.filter(i => i.parentId === parentId);
    if (children.length === 0) return 0;
    
    const totalProgress = children.reduce((sum, child) => sum + (child.progress || 0), 0);
    return Math.round(totalProgress / children.length);
};

/**
 * Verifica e atualiza o status do pai (item ou iniciativa) baseado na conclusão dos filhos.
 * 
 * REGRAS:
 * - Item só pode ser "Concluído" quando TODOS os subitens estiverem "Concluído"
 * - Iniciativa só pode ser "Concluído" quando TODOS os itens estiverem "Concluído"
 * - Atualiza progresso automaticamente quando status muda
 * 
 * @param initiativeId - ID da iniciativa a verificar
 * @param itemId - ID do item a verificar (opcional, se não fornecido verifica todos os itens)
 * @param allInitiatives - Array completo de iniciativas para buscar dados atualizados
 * @returns Objeto com itens atualizados e status da iniciativa atualizado, ou null se não houver mudanças
 * 
 * @example
 * // Verificar e atualizar item após concluir subitem
 * const result = checkAndUpdateParentStatus('init-123', 'item-456', initiatives);
 * if (result) {
 *   // Atualizar no Firestore
 * }
 * 
 * @example
 * // Verificar e atualizar iniciativa após concluir item
 * const result = checkAndUpdateParentStatus('init-123', undefined, initiatives);
 * if (result) {
 *   // Atualizar no Firestore
 * }
 */
const checkAndUpdateParentStatus = (
  initiativeId: string,
  itemId: string | undefined,
  allInitiatives: Initiative[]
): { updatedItems: InitiativeItem[]; updatedInitiativeStatus?: InitiativeStatus } | null => {
  const initiative = allInitiatives.find(i => i.id === initiativeId);
  if (!initiative || !initiative.items) return null;
  
  let updatedItems = [...initiative.items];
  let hasChanges = false;
  
  // Se itemId foi fornecido, verificar e atualizar esse item específico
  // Se não foi fornecido, verificar todos os itens
  const itemsToCheck = itemId 
    ? updatedItems.filter(p => p.id === itemId)
    : updatedItems;
  
  // Verificar cada item que tem subitens
  itemsToCheck.forEach(item => {
    if (item.subItems && item.subItems.length > 0) {
      // Verificar se todos os subitens estão concluídos (usando status)
      const allSubItemsCompleted = item.subItems.every(subItem => subItem.status === 'Concluído');
      
      // Se todos os subitens estão concluídos e item não está concluído, concluir item
      if (allSubItemsCompleted && item.status !== 'Concluído') {
        // Atualizar item para "Concluído"
        updatedItems = updatedItems.map(p => 
          p.id === item.id ? { ...p, status: 'Concluído' as InitiativeStatus } : p
        );
        hasChanges = true;
      }
      
      // Se nem todos os subitens estão concluídos mas item está concluído, reverter item para "Em execução"
      if (!allSubItemsCompleted && item.status === 'Concluído') {
        updatedItems = updatedItems.map(p => 
          p.id === item.id ? { ...p, status: 'Em execução' as InitiativeStatus } : p
        );
        hasChanges = true;
      }
    }
  });
  
  // Verificar se todos os itens estão concluídos para atualizar iniciativa
  // IMPORTANTE: Considerar apenas itens com status definido e igual a 'Concluído'
  // Itens sem status ou com status vazio são considerados não concluídos
  const allItemsCompleted = updatedItems.length > 0 && 
    updatedItems.every(item => item.status === 'Concluído');
  let updatedInitiativeStatus: InitiativeStatus | undefined;
  
  // Se todos os itens estão concluídos e iniciativa não está concluída, concluir iniciativa
  if (allItemsCompleted && updatedItems.length > 0 && initiative.status !== 'Concluído') {
    updatedInitiativeStatus = 'Concluído';
    hasChanges = true;
  }
  
  // Se nem todos os itens estão concluídos mas iniciativa está concluída, reverter status da iniciativa
  // IMPORTANTE: Esta verificação deve acontecer SEMPRE que há itens e a iniciativa está concluída
  // IMPORTANTE: Quando revertido, sempre usar "Em execução" como padrão
  if (updatedItems.length > 0 && initiative.status === 'Concluído' && !allItemsCompleted) {
    // Sempre reverter para "Em execução" quando um filho muda de status
    updatedInitiativeStatus = 'Em execução';
    hasChanges = true;
  }
  
  // Retornar mudanças se houver
  if (hasChanges) {
    return {
      updatedItems,
      ...(updatedInitiativeStatus && { updatedInitiativeStatus })
    };
  }
  
  return null;
};

/**
 * Remove campos undefined de um objeto para evitar erros no Firestore
 * Preserva deleteField() e outros FieldValue do Firestore
 */
const removeUndefinedFields = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    // Preservar FieldValue do Firestore (deleteField, serverTimestamp, etc)
    // FieldValue tem uma propriedade _methodName que identifica o tipo
    if (obj && typeof obj === 'object' && '_methodName' in obj) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedFields(item));
    }
    
    if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (value !== undefined) {
                    cleaned[key] = removeUndefinedFields(value);
                }
            }
        }
        return cleaned;
    }
    
    return obj;
};

/**
 * Migra iniciativa da estrutura antiga (subItems diretos ou phases) para nova estrutura (items)
 */
const migrateInitiativeToThreeLayer = (initiative: Initiative): Initiative => {
    // Se já tem items, não precisa migrar
    if (initiative.items && initiative.items.length > 0) {
        // Garantir que owner existe (para dados antigos)
        return {
            ...initiative,
            owner: initiative.owner || '',
        };
    }

    // Migrar de phases para items (se existir phases no Firestore)
    if ((initiative as any).phases && Array.isArray((initiative as any).phases) && (initiative as any).phases.length > 0) {
        const { phases, ...initiativeWithoutPhases } = initiative as any;
        return {
            ...initiativeWithoutPhases,
            owner: initiative.owner || '', // Garantir owner obrigatório
            items: phases.map((phase: any) => ({
                id: phase.id,
                title: phase.title,
                startDate: phase.startDate || '',
                endDate: phase.endDate || '',
                linkedToPrevious: phase.linkedToPrevious || false,
                status: phase.status,
                areaId: phase.areaId,
                priority: phase.priority,
                description: phase.description,
                responsible: phase.responsible,
                subItems: (phase.subItems || []).map((subItem: any) => ({
                    ...subItem,
                    startDate: subItem.startDate || '',
                    endDate: subItem.endDate || '',
                    linkedToPrevious: subItem.linkedToPrevious || false,
                })),
            })),
            areaId: initiative.areaId || '',
        };
    }

    // Se não tem subItems antigos, criar estrutura vazia
    if (!initiative.subItems || initiative.subItems.length === 0) {
        const { subItems, ...initiativeWithoutSubItems } = initiative;
        return {
            ...initiativeWithoutSubItems,
            owner: initiative.owner || '', // Garantir owner obrigatório
            items: [],
            areaId: initiative.areaId || '', // Se não tiver areaId, usar string vazia (será obrigatório no form)
        };
    }

    // Converter cada subItem antigo em um Item com um único subItem dentro
    const migratedItems: InitiativeItem[] = initiative.subItems.map((oldSubItem, index) => {
        // Usar endDate e startDate diretamente (ou valores vazios se não existirem)
        const endDate = oldSubItem.endDate || '';
        const startDate = oldSubItem.startDate || '';

        // Criar novo subItem com campos atualizados
        const newSubItem: SubItem = {
            id: oldSubItem.id,
            title: oldSubItem.title,
            completed: oldSubItem.completed,
            startDate: startDate,
            endDate: endDate,
            linkedToPrevious: false,
            status: 'Pendente', // Default
            responsible: '', // Será obrigatório, mas migração usa vazio
            priority: 'Baixa', // Default
            description: '', // Default
        };

        // Calcular datas do item: usar endDate do subitem como referência
        const itemEndDate = endDate;
        const itemStartDate = itemEndDate ? (() => {
            const endDateObj = new Date(itemEndDate);
            endDateObj.setDate(endDateObj.getDate() - 30);
            return endDateObj.toISOString().split('T')[0];
        })() : '';

        // Criar item com o subItem
        return {
            id: doc(collection(db, 'dummy')).id, // Gerar ID temporário
            title: `Item ${index + 1}`, // Título padrão
            startDate: itemStartDate,
            endDate: itemEndDate,
            linkedToPrevious: false,
            status: oldSubItem.completed ? 'Concluído' : 'Pendente',
            areaId: initiative.areaId || '', // Usar área do projeto
            priority: 'Baixa',
            description: '',
            responsible: null,
            subItems: [newSubItem],
        };
    });

    // Remover subItems do objeto original antes de retornar
    const { subItems, ...initiativeWithoutSubItems } = initiative;
    return {
        ...initiativeWithoutSubItems,
        owner: initiative.owner || '', // Garantir owner obrigatório
        items: migratedItems,
        areaId: initiative.areaId || '', // Garantir que areaId existe
    };
};


export const InitiativesProvider = ({ children }: { children: ReactNode }) => {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initiativesCollectionRef = collection(db, 'initiatives');

  const fetchInitiatives = useCallback(async () => {
    setIsLoading(true);
    try {
        const q = query(initiativesCollectionRef, orderBy('topicNumber'));
        const querySnapshot = await getDocs(q);
        const rawInitiatives = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Initiative))
            .filter(init => !init.deletedAt); // Filter out soft-deleted initiatives

        // Migrar iniciativas antigas para nova estrutura
        const migratedInitiatives = rawInitiatives.map(init => migrateInitiativeToThreeLayer(init));

        // Salvar iniciativas migradas de volta ao Firestore (se necessário)
        const needsMigration = rawInitiatives.some(init => {
            const hasPhases = (init as any).phases && Array.isArray((init as any).phases) && (init as any).phases.length > 0;
            const hasOldSubItems = init.subItems && init.subItems.length > 0;
            const hasNoItems = !init.items || init.items.length === 0;
            return hasNoItems && (hasPhases || hasOldSubItems);
        });
        
        if (needsMigration) {
            // Usar updateDoc individualmente para ter mais controle
            const migrationPromises: Promise<void>[] = [];
            migratedInitiatives.forEach((migrated, index) => {
                const original = rawInitiatives[index];
                const hasPhases = (original as any).phases && Array.isArray((original as any).phases) && (original as any).phases.length > 0;
                const hasOldSubItems = original.subItems && original.subItems.length > 0;
                const hasNoItems = !original.items || original.items.length === 0;
                
                // Só salvar se realmente foi migrado (de phases ou subItems antigos)
                if (hasNoItems && (hasPhases || hasOldSubItems)) {
                    const docRef = doc(db, 'initiatives', migrated.id);
                    // Criar objeto sem subItems e phases para evitar undefined
                    const { subItems, phases, ...migratedWithoutOldFields } = migrated as any;
                    const dataToSave = {
                        ...migratedWithoutOldFields,
                        items: migrated.items || [],
                        subItems: deleteField(), // Remover campo subItems do Firestore
                        phases: deleteField(), // Remover campo phases do Firestore
                    };
                    // Remover campos undefined antes de salvar (exceto deleteField)
                    const cleanedData = removeUndefinedFields(dataToSave);
                    migrationPromises.push(
                        updateDoc(docRef, cleanedData).catch(err => {
                            console.error(`Error migrating initiative ${migrated.id}:`, err);
                        })
                    );
                }
            });
            try {
                await Promise.all(migrationPromises);
            } catch (error) {
                console.error("Error saving migrated initiatives:", error);
            }
        }

        // Migração de initiativeType: adicionar 'strategic' para iniciativas existentes sem o campo
        const needsInitiativeTypeMigration = migratedInitiatives.some(init => init.initiativeType === undefined);
        
        if (needsInitiativeTypeMigration) {
            const initiativeTypeMigrationPromises: Promise<void>[] = [];
            migratedInitiatives.forEach(init => {
                // Se não tem initiativeType, adicionar 'strategic' como padrão
                if (init.initiativeType === undefined) {
                    const docRef = doc(db, 'initiatives', init.id);
                    initiativeTypeMigrationPromises.push(
                        updateDoc(docRef, {
                            initiativeType: 'strategic'
                        }).catch(err => {
                            console.error(`Error migrating initiativeType for ${init.id}:`, err);
                        })
                    );
                }
            });
            
            if (initiativeTypeMigrationPromises.length > 0) {
                try {
                    await Promise.all(initiativeTypeMigrationPromises);
                    console.log(`Migrated initiativeType for ${initiativeTypeMigrationPromises.length} initiatives`);
                } catch (error) {
                    console.error("Error saving initiativeType migration:", error);
                }
            }
        }

        // First pass: calculate progress for items
        const initiativesWithProgress = migratedInitiatives.map(init => {
            let progress = init.progress || 0;
            if (init.items && init.items.length > 0) {
                progress = calculateProgressFromItems(init.items);
            } else if (init.status === 'Concluído') {
                progress = 100;
            }
            return { ...init, progress };
        });

        // Second pass: calculate progress for parent items
        const initiativesWithFinalProgress = initiativesWithProgress.map(init => {
            if (migratedInitiatives.some(child => child.parentId === init.id)) {
                return {
                    ...init,
                    progress: calculateParentProgress(init.id, initiativesWithProgress),
                };
            }
            return init;
        });

        setInitiatives(initiativesWithFinalProgress);
    } catch (error) {
        console.error("Error fetching initiatives: ", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);


  const getNextMainTopicNumber = (currentInitiatives: Initiative[]) => {
      const mainTopics = currentInitiatives.filter(i => i.topicNumber && !i.topicNumber.includes('.'));
      return mainTopics.length > 0 ? (Math.max(...mainTopics.map(i => parseInt(i.topicNumber))) + 1) : 1;
  };

  const addInitiative = useCallback(async (initiativeData: InitiativeFormData) => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiatives-context.tsx:442',message:'addInitiative called',data:{hasTitle:!!initiativeData.title,hasOwner:!!initiativeData.owner,itemsCount:initiativeData.items?.length||0,hasStartDate:!!initiativeData.startDate,hasEndDate:!!initiativeData.endDate,hasAreaId:!!initiativeData.areaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    const nextTopicNumber = getNextMainTopicNumber(initiatives).toString();
    
    const newInitiative = {
        title: initiativeData.title,
        owner: initiativeData.owner,
        description: initiativeData.description,
        status: initiativeData.status,
        priority: initiativeData.priority,
        startDate: initiativeData.startDate ? (typeof initiativeData.startDate === 'string' ? initiativeData.startDate : initiativeData.startDate.toISOString().split('T')[0]) : '',
        endDate: initiativeData.endDate ? (typeof initiativeData.endDate === 'string' ? initiativeData.endDate : initiativeData.endDate.toISOString().split('T')[0]) : '',
        areaId: initiativeData.areaId,
        initiativeType: (initiativeData as any).initiativeType || 'strategic', // Default 'strategic' se não fornecido
        lastUpdate: new Date().toISOString(),
        topicNumber: nextTopicNumber,
        progress: 0, 
        keyMetrics: [],
        parentId: null,
        archived: false,
        items: initiativeData.items?.map(p => ({
            id: p.id || doc(collection(db, 'dummy')).id,
            title: p.title,
            startDate: p.startDate ? (typeof p.startDate === 'string' ? p.startDate : p.startDate.toISOString().split('T')[0]) : '',
            endDate: p.endDate ? (typeof p.endDate === 'string' ? p.endDate : p.endDate.toISOString().split('T')[0]) : '',
            linkedToPrevious: p.linkedToPrevious || false,
            status: p.status,
            areaId: p.areaId,
            priority: p.priority,
            description: p.description,
            responsible: p.responsible || null,
            subItems: p.subItems?.map(si => ({
                id: si.id || doc(collection(db, 'dummy')).id,
                title: si.title,
                completed: si.completed || false,
                startDate: si.startDate ? (typeof si.startDate === 'string' ? si.startDate : si.startDate.toISOString().split('T')[0]) : '',
                endDate: si.endDate ? (typeof si.endDate === 'string' ? si.endDate : si.endDate.toISOString().split('T')[0]) : '',
                linkedToPrevious: si.linkedToPrevious || false,
                status: si.status || 'Pendente',
                responsible: si.responsible || '',
                priority: si.priority || 'Baixa',
                description: si.description || '',
            })) || [],
        })) || [],
    };

    try {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiatives-context.tsx:488',message:'Preparing to save initiative',data:{title:newInitiative.title,topicNumber:nextTopicNumber,itemsCount:newInitiative.items?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        
        // Remover campos undefined antes de salvar
        const cleanedInitiative = removeUndefinedFields(newInitiative);
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiatives-context.tsx:493',message:'Calling addDoc to save initiative',data:{title:cleanedInitiative.title,topicNumber:cleanedInitiative.topicNumber},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        
        await addDoc(initiativesCollectionRef, cleanedInitiative);
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiatives-context.tsx:497',message:'addDoc completed successfully',data:{title:cleanedInitiative.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        
        fetchInitiatives();
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiatives-context.tsx:501',message:'fetchInitiatives called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/8c87e21a-3e34-4b39-9562-571850528ec6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'initiatives-context.tsx:505',message:'addDoc failed with error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        console.error("Error adding initiative: ", error);
    }
  }, [initiatives, fetchInitiatives, initiativesCollectionRef]);

  /**
   * Adiciona múltiplas iniciativas em lote com estrutura hierárquica (itens e subitens).
   * 
   * @param newInitiativesData - Array de iniciativas com itens e subitens
   * Cada iniciativa deve ter:
   * - Campos obrigatórios: title, owner, status, priority, startDate, endDate, areaId
   * - items: Array de itens (mínimo 1)
   *   - Cada item deve ter: title, startDate, endDate, status, areaId, priority, responsible
   *   - Cada item pode ter subItems: Array de subitens (opcional)
   *     - Cada subitem deve ter: title, startDate, endDate, status, responsible, priority
   */
  const bulkAddInitiatives = useCallback(async (newInitiativesData: Array<{
    title: string;
    owner: string;
    description?: string;
    status: InitiativeStatus;
    priority: InitiativePriority;
    startDate: string;
    endDate: string;
    areaId: string;
    items: Array<{
      title: string;
      startDate: string;
      endDate: string;
      status: InitiativeStatus;
      areaId: string;
      priority: InitiativePriority;
      description?: string;
      responsible: string;
      subItems?: Array<{
        title: string;
        startDate: string;
        endDate: string;
        status: InitiativeStatus;
        responsible: string;
        priority: InitiativePriority;
        description?: string;
      }>;
    }>;
  }>) => {
    let nextTopicNumber = getNextMainTopicNumber(initiatives);
    const batch = writeBatch(db);
    
    newInitiativesData.forEach(initiativeData => {
        // Validar que a iniciativa tem pelo menos 1 item
        if (!initiativeData.items || initiativeData.items.length === 0) {
            console.error(`Iniciativa "${initiativeData.title}" não possui itens. Será ignorada.`);
            return;
        }

        // Validar e formatar datas da iniciativa
        const startDate = initiativeData.startDate && !isNaN(new Date(initiativeData.startDate).getTime())
          ? new Date(initiativeData.startDate).toISOString().split('T')[0]
          : '';
        const endDate = initiativeData.endDate && !isNaN(new Date(initiativeData.endDate).getTime())
          ? new Date(initiativeData.endDate).toISOString().split('T')[0]
          : '';

        // Mapear itens com subitens
        const items = initiativeData.items.map(item => {
            // Validar e formatar datas do item
            const itemStartDate = item.startDate && !isNaN(new Date(item.startDate).getTime())
              ? new Date(item.startDate).toISOString().split('T')[0]
              : '';
            const itemEndDate = item.endDate && !isNaN(new Date(item.endDate).getTime())
              ? new Date(item.endDate).toISOString().split('T')[0]
              : '';

            // Mapear subitens se presentes
            const subItems = item.subItems?.map(subItem => {
                // Validar e formatar datas do subitem
                const subItemStartDate = subItem.startDate && !isNaN(new Date(subItem.startDate).getTime())
                  ? new Date(subItem.startDate).toISOString().split('T')[0]
                  : '';
                const subItemEndDate = subItem.endDate && !isNaN(new Date(subItem.endDate).getTime())
                  ? new Date(subItem.endDate).toISOString().split('T')[0]
                  : '';

                return {
                    id: doc(collection(db, 'dummy')).id,
                    title: subItem.title,
                    completed: subItem.status === 'Concluído',
                    startDate: subItemStartDate,
                    endDate: subItemEndDate,
                    linkedToPrevious: false,
                    status: subItem.status,
                    responsible: subItem.responsible,
                    priority: subItem.priority,
                    description: subItem.description || '',
                };
            }) || [];

            return {
                id: doc(collection(db, 'dummy')).id,
                title: item.title,
                startDate: itemStartDate,
                endDate: itemEndDate,
                linkedToPrevious: false,
                status: item.status,
                areaId: item.areaId,
                priority: item.priority,
                description: item.description || '',
                responsible: item.responsible || null,
                subItems: subItems,
            };
        });

        const newInitiative = {
          title: initiativeData.title,
          owner: initiativeData.owner,
          description: initiativeData.description || '',
          status: initiativeData.status,
          priority: initiativeData.priority,
          startDate: startDate,
          endDate: endDate,
          areaId: initiativeData.areaId,
          initiativeType: (initiativeData as any).initiativeType || 'strategic', // Default 'strategic' se não fornecido
          lastUpdate: new Date().toISOString(),
          topicNumber: (nextTopicNumber++).toString(),
          progress: 0,
          keyMetrics: [],
          parentId: null,
          items: items,
          archived: false,
        };
        
        // Remover campos undefined antes de salvar
        const cleanedInitiative = removeUndefinedFields(newInitiative);
        const docRef = doc(initiativesCollectionRef);
        batch.set(docRef, cleanedInitiative);
    });

    try {
      await batch.commit();
      fetchInitiatives();
    } catch (error) {
      console.error("Error bulk adding initiatives: ", error);
    }
  }, [initiatives, fetchInitiatives, initiativesCollectionRef]);
  
  const updateInitiative = useCallback(async (initiativeId: string, data: InitiativeFormData) => {
    const initiativeDocRef = doc(db, 'initiatives', initiativeId);
    try {
      const updatedData: any = {
          title: data.title,
          owner: data.owner,
          description: data.description,
          status: data.status,
          priority: data.priority,
          startDate: data.startDate ? (typeof data.startDate === 'string' ? data.startDate : data.startDate.toISOString().split('T')[0]) : '',
          endDate: data.endDate ? (typeof data.endDate === 'string' ? data.endDate : data.endDate.toISOString().split('T')[0]) : '',
          areaId: data.areaId,
          lastUpdate: new Date().toISOString(),
          items: data.items?.map(p => ({
              id: p.id || doc(collection(db, 'dummy')).id,
              title: p.title,
              startDate: p.startDate ? (typeof p.startDate === 'string' ? p.startDate : p.startDate.toISOString().split('T')[0]) : '',
              endDate: p.endDate ? (typeof p.endDate === 'string' ? p.endDate : p.endDate.toISOString().split('T')[0]) : '',
              linkedToPrevious: p.linkedToPrevious || false,
              status: p.status,
              areaId: p.areaId,
              priority: p.priority,
              description: p.description,
              responsible: p.responsible || null,
              subItems: p.subItems?.map(si => ({
                  id: si.id || doc(collection(db, 'dummy')).id,
                  title: si.title,
                  completed: si.completed || false,
                  startDate: si.startDate ? (typeof si.startDate === 'string' ? si.startDate : si.startDate.toISOString().split('T')[0]) : '',
                  endDate: si.endDate ? (typeof si.endDate === 'string' ? si.endDate : si.endDate.toISOString().split('T')[0]) : '',
                  linkedToPrevious: si.linkedToPrevious || false,
                  status: si.status || 'Pendente',
                  responsible: si.responsible || '',
                  priority: si.priority || 'Baixa',
                  description: si.description || '',
              })) || [],
          })) || [],
      };
      
      // Preservar initiativeType se fornecido (caso seja necessário atualizar)
      if ((data as any).initiativeType !== undefined) {
        updatedData.initiativeType = (data as any).initiativeType;
      }
      
      // Remover campos undefined antes de salvar
      const cleanedData = removeUndefinedFields(updatedData);
      await setDoc(initiativeDocRef, cleanedData, { merge: true });
      fetchInitiatives();
    } catch (error) {
        console.error("Error updating initiative: ", error);
    }
  }, [fetchInitiatives]);

  const deleteInitiative = useCallback(async (initiativeId: string) => {
    const initiativeDocRef = doc(db, 'initiatives', initiativeId);
    try {
        // Soft delete implementation
        await updateDoc(initiativeDocRef, {
            deletedAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
        });
        fetchInitiatives();
    } catch (error) {
        console.error("Error deleting initiative: ", error);
    }
  }, [fetchInitiatives]);

  const archiveInitiative = useCallback(async (initiativeId: string) => {
    const initiativeDocRef = doc(db, 'initiatives', initiativeId);
    try {
      await setDoc(initiativeDocRef, {
        archived: true,
        lastUpdate: new Date().toISOString(),
      }, { merge: true });
      fetchInitiatives();
    } catch (error) {
      console.error("Error archiving initiative: ", error);
    }
  }, [fetchInitiatives]);
  
  const unarchiveInitiative = useCallback(async (initiativeId: string) => {
    const initiativeDocRef = doc(db, 'initiatives', initiativeId);
    try {
      await setDoc(initiativeDocRef, {
        archived: false,
        lastUpdate: new Date().toISOString(),
      }, { merge: true });
      fetchInitiatives();
    } catch (error) {
      console.error("Error unarchiving initiative: ", error);
    }
  }, [fetchInitiatives]);

  /**
   * Atualiza o status de uma iniciativa com validação de conclusão.
   * 
   * REGRAS:
   * - Iniciativa não pode ser "Concluído" se nem todos os itens estão concluídos
   * - Se todos os itens estão concluídos, permite concluir automaticamente
   * 
   * @param initiativeId - ID da iniciativa
   * @param newStatus - Novo status desejado
   */
  const updateInitiativeStatus = useCallback(async (initiativeId: string, newStatus: InitiativeStatus) => {
    const localInitiative = initiatives.find(i => i.id === initiativeId);
    if (!localInitiative) {
      // Se não encontrou localmente, buscar do Firestore
      await fetchInitiatives();
      return;
    }
    
    // Validação: não pode concluir iniciativa se nem todos os itens estão concluídos
    // IMPORTANTE: Esta validação deve ser SEMPRE aplicada, mesmo se a iniciativa estiver em atraso
    // IMPORTANTE: Itens sem status ou com status vazio são considerados não concluídos
    if (newStatus === 'Concluído') {
      // Se não tem itens, pode concluir
      if (localInitiative.items && localInitiative.items.length > 0) {
        // Verificar se todos os itens têm status definido e igual a 'Concluído'
        const allItemsCompleted = localInitiative.items.every(item => item.status === 'Concluído');
        if (!allItemsCompleted) {
          console.warn(`[InitiativesContext] Não é possível concluir iniciativa ${initiativeId}: nem todos os itens estão concluídos`);
          // Não atualizar status - manter o atual
          return;
        }
      }
    }
    
    const initiativeDocRef = doc(db, 'initiatives', initiativeId);
    try {
        await setDoc(initiativeDocRef, {
            status: newStatus,
            lastUpdate: new Date().toISOString(),
        }, { merge: true });
        
        // Atualizar estado local sem recarregar tudo
        setInitiatives(prevInitiatives => {
          return prevInitiatives.map(init => {
            if (init.id === initiativeId) {
              return {
                ...init,
                status: newStatus,
                lastUpdate: new Date().toISOString(),
              };
            }
            return init;
          });
        });
    } catch (error) {
        console.error("Error updating initiative status: ", error);
    }
  }, [initiatives]);

  /**
   * Atualiza o estado de conclusão de um subitem e verifica se deve concluir item/iniciativa automaticamente.
   * 
   * @param initiativeId - ID da iniciativa
   * @param itemId - ID do item
   * @param subItemId - ID do subitem
   * @param completed - Novo estado de conclusão
   */
  /**
   * Atualiza um subitem, podendo alterar o campo completed e/ou o status diretamente.
   * 
   * @param initiativeId - ID da iniciativa
   * @param itemId - ID do item
   * @param subItemId - ID do subitem
   * @param completed - Novo valor de completed (true/false)
   * @param newStatus - Novo status (opcional). Se fornecido, será usado em vez de calcular baseado em completed
   * 
   * REGRAS:
   * - Se newStatus for fornecido, ele será usado diretamente
   * - Se newStatus não for fornecido, o status será calculado: completed=true → "Concluído", completed=false → "Em execução"
   * - O campo completed sempre será atualizado conforme o parâmetro
   */
  const updateSubItem = useCallback(async (initiativeId: string, itemId: string, subItemId: string, completed: boolean, newStatus?: InitiativeStatus) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.items) return;

      // Atualizar subitem
      const updatedItems = localInitiative.items.map(item => {
          if (item.id === itemId && item.subItems) {
              const updatedSubItems = item.subItems.map(si => {
                  if (si.id === subItemId) {
                      // Se newStatus foi fornecido, usar diretamente; senão, calcular baseado em completed
                      const finalStatus = newStatus || (completed ? 'Concluído' as InitiativeStatus : 'Em execução' as InitiativeStatus);
                      
                      return { 
                          ...si, 
                          completed,
                          status: finalStatus
                      };
                  }
                  return si;
              });
              return {
                  ...item,
                  subItems: updatedSubItems,
              };
          }
          return item;
      });
      
      // Verificar e atualizar status do pai (item e iniciativa) se necessário
      // Criar array temporário com iniciativa atualizada para verificação
      const tempInitiatives = initiatives.map(init => 
        init.id === initiativeId ? { ...init, items: updatedItems } : init
      );
      const parentUpdate = checkAndUpdateParentStatus(initiativeId, itemId, tempInitiatives);
      
      // Aplicar atualizações do pai se houver
      let finalItems = updatedItems;
      let finalInitiativeStatus = localInitiative.status;
      
      if (parentUpdate) {
          finalItems = parentUpdate.updatedItems;
          if (parentUpdate.updatedInitiativeStatus) {
              finalInitiativeStatus = parentUpdate.updatedInitiativeStatus;
          }
      }
      
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          const updateData: any = { 
              items: finalItems, 
              lastUpdate: new Date().toISOString() 
          };
          
          // Se status da iniciativa mudou, incluir na atualização
          if (finalInitiativeStatus !== localInitiative.status) {
              updateData.status = finalInitiativeStatus;
          }
          
          await setDoc(initiativeDocRef, updateData, { merge: true });
          
          // Update state locally
          setInitiatives(prevInitiatives => {
              const newInitiatives = prevInitiatives.map(init => {
                  if (init.id === initiativeId) {
                      return {
                          ...init,
                          items: finalItems,
                          status: finalInitiativeStatus,
                          progress: calculateProgressFromItems(finalItems),
                          lastUpdate: new Date().toISOString(),
                      };
                  }
                  return init;
              });

              // If the updated initiative has a parent, recalculate the parent's progress
              if (localInitiative.parentId) {
                  const parentId = localInitiative.parentId;
                  return newInitiatives.map(init => {
                      if (init.id === parentId) {
                          return {
                              ...init,
                              progress: calculateParentProgress(parentId, newInitiatives)
                          };
                      }
                      return init;
                  });
              }

              return newInitiatives;
          });

      } catch(error) {
          console.error("Error updating subitem:", error);
      }
  }, [initiatives]);

  const addItem = useCallback(async (initiativeId: string, item: Omit<InitiativeItem, 'id'>) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative) return;

      const newItem: InitiativeItem = {
          ...item,
          id: doc(collection(db, 'dummy')).id,
          subItems: item.subItems || [],
      };

      const updatedItems = [...(localInitiative.items || []), newItem];
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      
      try {
          await setDoc(initiativeDocRef, { items: updatedItems, lastUpdate: new Date().toISOString() }, { merge: true });
          fetchInitiatives();
      } catch (error) {
          console.error("Error adding item:", error);
      }
  }, [initiatives, fetchInitiatives]);

  /**
   * Atualiza um item e verifica se deve concluir iniciativa automaticamente.
   * 
   * @param initiativeId - ID da iniciativa
   * @param itemId - ID do item
   * @param item - Dados parciais do item para atualizar
   */
  const updateItem = useCallback(async (initiativeId: string, itemId: string, item: Partial<InitiativeItem>) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.items) return;

      const updatedItems = localInitiative.items.map(p => 
          p.id === itemId ? { ...p, ...item } : p
      );
      
      // Verificar e atualizar status da iniciativa se todos os itens estão concluídos
      // Criar array temporário com iniciativa atualizada para verificação
      const tempInitiatives = initiatives.map(init => 
        init.id === initiativeId ? { ...init, items: updatedItems } : init
      );
      const parentUpdate = checkAndUpdateParentStatus(initiativeId, undefined, tempInitiatives);
      
      // Aplicar atualizações se houver
      let finalItems = updatedItems;
      let finalInitiativeStatus = localInitiative.status;
      
      if (parentUpdate) {
          finalItems = parentUpdate.updatedItems;
          if (parentUpdate.updatedInitiativeStatus) {
              finalInitiativeStatus = parentUpdate.updatedInitiativeStatus;
          }
      }
      
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          const updateData: any = { 
              items: finalItems, 
              lastUpdate: new Date().toISOString() 
          };
          
          // Se status da iniciativa mudou, incluir na atualização
          if (finalInitiativeStatus !== localInitiative.status) {
              updateData.status = finalInitiativeStatus;
          }
          
          await setDoc(initiativeDocRef, updateData, { merge: true });
          
          // Atualizar estado local sem recarregar tudo
          setInitiatives(prevInitiatives => {
            return prevInitiatives.map(init => {
              if (init.id === initiativeId) {
                return {
                  ...init,
                  items: finalItems,
                  status: finalInitiativeStatus,
                  progress: calculateProgressFromItems(finalItems),
                  lastUpdate: new Date().toISOString(),
                };
              }
              return init;
            });
          });
      } catch (error) {
          console.error("Error updating item:", error);
      }
  }, [initiatives]);

  const deleteItem = useCallback(async (initiativeId: string, itemId: string) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.items) return;

      const updatedItems = localInitiative.items.filter(p => p.id !== itemId);
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      
      try {
          await setDoc(initiativeDocRef, { items: updatedItems, lastUpdate: new Date().toISOString() }, { merge: true });
          fetchInitiatives();
      } catch (error) {
          console.error("Error deleting item:", error);
      }
  }, [initiatives, fetchInitiatives]);

  const addSubItem = useCallback(async (initiativeId: string, itemId: string, subItem: Omit<SubItem, 'id'>) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.items) return;

      const newSubItem: SubItem = {
          ...subItem,
          id: doc(collection(db, 'dummy')).id,
      };

      const updatedItems = localInitiative.items.map(item => {
          if (item.id === itemId) {
              return {
                  ...item,
                  subItems: [...(item.subItems || []), newSubItem],
              };
          }
          return item;
      });

      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          await setDoc(initiativeDocRef, { items: updatedItems, lastUpdate: new Date().toISOString() }, { merge: true });
          fetchInitiatives();
      } catch (error) {
          console.error("Error adding subitem:", error);
      }
  }, [initiatives, fetchInitiatives]);

  const deleteSubItem = useCallback(async (initiativeId: string, itemId: string, subItemId: string) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.items) return;

      const updatedItems = localInitiative.items.map(item => {
          if (item.id === itemId && item.subItems) {
              return {
                  ...item,
                  subItems: item.subItems.filter(si => si.id !== subItemId),
              };
          }
          return item;
      });

      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          await setDoc(initiativeDocRef, { items: updatedItems, lastUpdate: new Date().toISOString() }, { merge: true });
          fetchInitiatives();
      } catch (error) {
          console.error("Error deleting subitem:", error);
      }
  }, [initiatives, fetchInitiatives]);

  return (
    <InitiativesContext.Provider value={{ 
      initiatives, 
      addInitiative, 
      bulkAddInitiatives, 
      updateInitiative, 
      deleteInitiative, 
      archiveInitiative, 
      unarchiveInitiative, 
      updateInitiativeStatus, 
      updateSubItem,
      addItem,
      updateItem,
      deleteItem,
      addSubItem,
      deleteSubItem,
      isLoading 
    }}>
      {children}
    </InitiativesContext.Provider>
  );
};

export const useInitiatives = () => {
  const context = useContext(InitiativesContext);
  if (context === undefined) {
    throw new Error('useInitiatives must be used within an InitiativesProvider');
  }
  return context;
};
