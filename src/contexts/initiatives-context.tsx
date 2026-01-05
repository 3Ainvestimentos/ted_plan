
"use client";

import type { Initiative, InitiativeStatus, SubItem, InitiativePhase } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, writeBatch, setDoc, deleteField } from 'firebase/firestore';
import type { InitiativeFormData } from '@/components/initiatives/initiative-form';


type InitiativeData = Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'deadline'> & { deadline: Date };

interface InitiativesContextType {
  initiatives: Initiative[];
  addInitiative: (initiative: InitiativeFormData) => Promise<void>;
  updateInitiative: (initiativeId: string, data: InitiativeFormData) => Promise<void>;
  deleteInitiative: (initiativeId: string) => Promise<void>;
  archiveInitiative: (initiativeId: string) => Promise<void>;
  unarchiveInitiative: (initiativeId: string) => Promise<void>;
  updateInitiativeStatus: (initiativeId: string, newStatus: InitiativeStatus) => void;
  updateSubItem: (initiativeId: string, phaseId: string, subItemId: string, completed: boolean, newStatus?: InitiativeStatus) => Promise<void>;
  addPhase: (initiativeId: string, phase: Omit<InitiativePhase, 'id'>) => Promise<void>;
  updatePhase: (initiativeId: string, phaseId: string, phase: Partial<InitiativePhase>) => Promise<void>;
  deletePhase: (initiativeId: string, phaseId: string) => Promise<void>;
  addSubItem: (initiativeId: string, phaseId: string, subItem: Omit<SubItem, 'id'>) => Promise<void>;
  deleteSubItem: (initiativeId: string, phaseId: string, subItemId: string) => Promise<void>;
  bulkAddInitiatives: (newInitiatives: Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'phases' | 'deadline'>[]) => void;
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

const calculateProgressFromPhases = (phases: InitiativePhase[]): number => {
    if (!phases || phases.length === 0) return 0;
    
    const phaseProgresses = phases.map(phase => {
        if (phase.subItems && phase.subItems.length > 0) {
            return calculateProgressFromSubItems(phase.subItems);
        }
        return phase.status === 'Concluído' ? 100 : 0;
    });
    
    const totalProgress = phaseProgresses.reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / phaseProgresses.length);
};

const calculateParentProgress = (parentId: string, allInitiatives: Initiative[]): number => {
    const children = allInitiatives.filter(i => i.parentId === parentId);
    if (children.length === 0) return 0;
    
    const totalProgress = children.reduce((sum, child) => sum + (child.progress || 0), 0);
    return Math.round(totalProgress / children.length);
};

/**
 * Verifica e atualiza o status do pai (fase ou iniciativa) baseado na conclusão dos filhos.
 * 
 * REGRAS:
 * - Fase só pode ser "Concluído" quando TODOS os subitens estiverem "Concluído"
 * - Iniciativa só pode ser "Concluído" quando TODAS as fases estiverem "Concluído"
 * - Atualiza progresso automaticamente quando status muda
 * 
 * @param initiativeId - ID da iniciativa a verificar
 * @param phaseId - ID da fase a verificar (opcional, se não fornecido verifica todas as fases)
 * @param allInitiatives - Array completo de iniciativas para buscar dados atualizados
 * @returns Objeto com fases atualizadas e status da iniciativa atualizado, ou null se não houver mudanças
 * 
 * @example
 * // Verificar e atualizar fase após concluir subitem
 * const result = checkAndUpdateParentStatus('init-123', 'phase-456', initiatives);
 * if (result) {
 *   // Atualizar no Firestore
 * }
 * 
 * @example
 * // Verificar e atualizar iniciativa após concluir fase
 * const result = checkAndUpdateParentStatus('init-123', undefined, initiatives);
 * if (result) {
 *   // Atualizar no Firestore
 * }
 */
const checkAndUpdateParentStatus = (
  initiativeId: string,
  phaseId: string | undefined,
  allInitiatives: Initiative[]
): { updatedPhases: InitiativePhase[]; updatedInitiativeStatus?: InitiativeStatus } | null => {
  const initiative = allInitiatives.find(i => i.id === initiativeId);
  if (!initiative || !initiative.phases) return null;
  
  let updatedPhases = [...initiative.phases];
  let hasChanges = false;
  
  // Se phaseId foi fornecido, verificar e atualizar essa fase específica
  // Se não foi fornecido, verificar todas as fases
  const phasesToCheck = phaseId 
    ? updatedPhases.filter(p => p.id === phaseId)
    : updatedPhases;
  
  // Verificar cada fase que tem subitens
  phasesToCheck.forEach(phase => {
    if (phase.subItems && phase.subItems.length > 0) {
      // Verificar se todos os subitens estão concluídos (usando status)
      const allSubItemsCompleted = phase.subItems.every(subItem => subItem.status === 'Concluído');
      
      // Se todos os subitens estão concluídos e fase não está concluída, concluir fase
      if (allSubItemsCompleted && phase.status !== 'Concluído') {
        // Atualizar fase para "Concluído"
        updatedPhases = updatedPhases.map(p => 
          p.id === phase.id ? { ...p, status: 'Concluído' as InitiativeStatus } : p
        );
        hasChanges = true;
      }
      
      // Se nem todos os subitens estão concluídos mas fase está concluída, reverter fase para "Em execução"
      if (!allSubItemsCompleted && phase.status === 'Concluído') {
        updatedPhases = updatedPhases.map(p => 
          p.id === phase.id ? { ...p, status: 'Em execução' as InitiativeStatus } : p
        );
        hasChanges = true;
      }
    }
  });
  
  // Verificar se todas as fases estão concluídas para atualizar iniciativa
  // IMPORTANTE: Considerar apenas fases com status definido e igual a 'Concluído'
  // Fases sem status ou com status vazio são consideradas não concluídas
  const allPhasesCompleted = updatedPhases.length > 0 && 
    updatedPhases.every(phase => phase.status === 'Concluído');
  let updatedInitiativeStatus: InitiativeStatus | undefined;
  
  // Se todas as fases estão concluídas e iniciativa não está concluída, concluir iniciativa
  if (allPhasesCompleted && updatedPhases.length > 0 && initiative.status !== 'Concluído') {
    updatedInitiativeStatus = 'Concluído';
    hasChanges = true;
  }
  
  // Se nem todas as fases estão concluídas mas iniciativa está concluída, reverter status da iniciativa
  // IMPORTANTE: Esta verificação deve acontecer SEMPRE que há fases e a iniciativa está concluída
  // IMPORTANTE: Quando revertido, sempre usar "Em execução" como padrão
  if (updatedPhases.length > 0 && initiative.status === 'Concluído' && !allPhasesCompleted) {
    // Sempre reverter para "Em execução" quando um filho muda de status
    updatedInitiativeStatus = 'Em execução';
    hasChanges = true;
  }
  
  // Retornar mudanças se houver
  if (hasChanges) {
    return {
      updatedPhases,
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
 * Migra iniciativa da estrutura antiga (subItems diretos) para nova estrutura (phases)
 */
const migrateInitiativeToThreeLayer = (initiative: Initiative): Initiative => {
    // Se já tem phases, não precisa migrar
    if (initiative.phases && initiative.phases.length > 0) {
        return initiative;
    }

    // Se não tem subItems antigos, criar estrutura vazia
    if (!initiative.subItems || initiative.subItems.length === 0) {
        const { subItems, ...initiativeWithoutSubItems } = initiative;
        return {
            ...initiativeWithoutSubItems,
            phases: [],
            areaId: initiative.areaId || '', // Se não tiver areaId, usar string vazia (será obrigatório no form)
        };
    }

    // Converter cada subItem antigo em uma Fase com um único subItem dentro
    const migratedPhases: InitiativePhase[] = initiative.subItems.map((oldSubItem, index) => {
        // Criar novo subItem com campos atualizados
        const newSubItem: SubItem = {
            id: oldSubItem.id,
            title: oldSubItem.title,
            completed: oldSubItem.completed,
            deadline: oldSubItem.deadline,
            status: 'Pendente', // Default
            responsible: '', // Será obrigatório, mas migração usa vazio
            priority: 'Baixa', // Default
            description: '', // Default
        };

        // Criar fase com o subItem
        return {
            id: doc(collection(db, 'dummy')).id, // Gerar ID temporário
            title: `Fase ${index + 1}`, // Título padrão
            deadline: oldSubItem.deadline,
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
        phases: migratedPhases,
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
        const rawInitiatives = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Initiative));

        // Migrar iniciativas antigas para nova estrutura
        const migratedInitiatives = rawInitiatives.map(init => migrateInitiativeToThreeLayer(init));

        // Salvar iniciativas migradas de volta ao Firestore (se necessário)
        const needsMigration = rawInitiatives.some(init => 
            (!init.phases || init.phases.length === 0) && init.subItems && init.subItems.length > 0
        );
        
        if (needsMigration) {
            // Usar updateDoc individualmente para ter mais controle
            const migrationPromises: Promise<void>[] = [];
            migratedInitiatives.forEach((migrated, index) => {
                const original = rawInitiatives[index];
                // Só salvar se realmente foi migrado
                if ((!original.phases || original.phases.length === 0) && original.subItems && original.subItems.length > 0) {
                    const docRef = doc(db, 'initiatives', migrated.id);
                    // Criar objeto sem subItems para evitar undefined
                    const { subItems, ...migratedWithoutSubItems } = migrated;
                    const dataToSave = {
                        ...migratedWithoutSubItems,
                        phases: migrated.phases || [],
                        subItems: deleteField(), // Remover campo subItems do Firestore
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

        // First pass: calculate progress for phases
        const initiativesWithProgress = migratedInitiatives.map(init => {
            let progress = init.progress || 0;
            if (init.phases && init.phases.length > 0) {
                progress = calculateProgressFromPhases(init.phases);
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
    const nextTopicNumber = getNextMainTopicNumber(initiatives).toString();
    
    const newInitiative = {
        title: initiativeData.title,
        owner: initiativeData.owner,
        description: initiativeData.description,
        status: initiativeData.status,
        priority: initiativeData.priority,
        deadline: initiativeData.deadline ? initiativeData.deadline.toISOString().split('T')[0] : null,
        areaId: initiativeData.areaId,
        lastUpdate: new Date().toISOString(),
        topicNumber: nextTopicNumber,
        progress: 0, 
        keyMetrics: [],
        parentId: null,
        archived: false,
        phases: initiativeData.phases?.map(p => ({
            id: p.id || doc(collection(db, 'dummy')).id,
            title: p.title,
            deadline: p.deadline ? p.deadline.toISOString().split('T')[0] : null,
            status: p.status,
            areaId: p.areaId,
            priority: p.priority,
            description: p.description,
            responsible: p.responsible || null,
            subItems: p.subItems?.map(si => ({
                id: si.id || doc(collection(db, 'dummy')).id,
                title: si.title,
                completed: si.completed || false,
                deadline: si.deadline ? (typeof si.deadline === 'string' ? si.deadline : si.deadline.toISOString().split('T')[0]) : null,
                status: si.status || 'Pendente',
                responsible: si.responsible || '',
                priority: si.priority || 'Baixa',
                description: si.description || '',
            })) || [],
        })) || [],
    };

    try {
        // Remover campos undefined antes de salvar
        const cleanedInitiative = removeUndefinedFields(newInitiative);
        await addDoc(initiativesCollectionRef, cleanedInitiative);
        fetchInitiatives(); 
    } catch (error) {
        console.error("Error adding initiative: ", error);
    }
  }, [initiatives, fetchInitiatives, initiativesCollectionRef]);

  const bulkAddInitiatives = useCallback(async (newInitiativesData: any[]) => {
    let nextTopicNumber = getNextMainTopicNumber(initiatives);
    const batch = writeBatch(db);
    newInitiativesData.forEach(initiativeData => {
        const deadline = initiativeData.deadline && !isNaN(new Date(initiativeData.deadline).getTime())
          ? new Date(initiativeData.deadline).toISOString().split('T')[0]
          : null;

        const newInitiative = {
          ...initiativeData,
          deadline: deadline,
          lastUpdate: new Date().toISOString(),
          topicNumber: (nextTopicNumber++).toString(),
          progress: 0,
          keyMetrics: [],
          parentId: null,
          phases: [],
          areaId: '',
          archived: false,
        };
        const docRef = doc(initiativesCollectionRef);
        batch.set(docRef, newInitiative);
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
      const updatedData = {
          title: data.title,
          owner: data.owner,
          description: data.description,
          status: data.status,
          priority: data.priority,
          deadline: data.deadline ? data.deadline.toISOString().split('T')[0] : null,
          areaId: data.areaId,
          lastUpdate: new Date().toISOString(),
          phases: data.phases?.map(p => ({
              id: p.id || doc(collection(db, 'dummy')).id,
              title: p.title,
              deadline: p.deadline ? p.deadline.toISOString().split('T')[0] : null,
              status: p.status,
              areaId: p.areaId,
              priority: p.priority,
              description: p.description,
              responsible: p.responsible || null,
              subItems: p.subItems?.map(si => ({
                  id: si.id || doc(collection(db, 'dummy')).id,
                  title: si.title,
                  completed: si.completed || false,
                  deadline: si.deadline ? (typeof si.deadline === 'string' ? si.deadline : si.deadline.toISOString().split('T')[0]) : null,
                  status: si.status || 'Pendente',
                  responsible: si.responsible || '',
                  priority: si.priority || 'Baixa',
                  description: si.description || '',
              })) || [],
          })) || [],
      };
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
        await deleteDoc(initiativeDocRef);
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
   * - Iniciativa não pode ser "Concluído" se nem todas as fases estão concluídas
   * - Se todas as fases estão concluídas, permite concluir automaticamente
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
    
    // Validação: não pode concluir iniciativa se nem todas as fases estão concluídas
    // IMPORTANTE: Esta validação deve ser SEMPRE aplicada, mesmo se a iniciativa estiver em atraso
    // IMPORTANTE: Fases sem status ou com status vazio são consideradas não concluídas
    if (newStatus === 'Concluído') {
      // Se não tem fases, pode concluir
      if (localInitiative.phases && localInitiative.phases.length > 0) {
        // Verificar se todas as fases têm status definido e igual a 'Concluído'
        const allPhasesCompleted = localInitiative.phases.every(phase => phase.status === 'Concluído');
        if (!allPhasesCompleted) {
          console.warn(`[InitiativesContext] Não é possível concluir iniciativa ${initiativeId}: nem todas as fases estão concluídas`);
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
   * Atualiza o estado de conclusão de um subitem e verifica se deve concluir fase/iniciativa automaticamente.
   * 
   * @param initiativeId - ID da iniciativa
   * @param phaseId - ID da fase
   * @param subItemId - ID do subitem
   * @param completed - Novo estado de conclusão
   */
  /**
   * Atualiza um subitem, podendo alterar o campo completed e/ou o status diretamente.
   * 
   * @param initiativeId - ID da iniciativa
   * @param phaseId - ID da fase
   * @param subItemId - ID do subitem
   * @param completed - Novo valor de completed (true/false)
   * @param newStatus - Novo status (opcional). Se fornecido, será usado em vez de calcular baseado em completed
   * 
   * REGRAS:
   * - Se newStatus for fornecido, ele será usado diretamente
   * - Se newStatus não for fornecido, o status será calculado: completed=true → "Concluído", completed=false → "Em execução"
   * - O campo completed sempre será atualizado conforme o parâmetro
   */
  const updateSubItem = useCallback(async (initiativeId: string, phaseId: string, subItemId: string, completed: boolean, newStatus?: InitiativeStatus) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.phases) return;

      // Atualizar subitem
      const updatedPhases = localInitiative.phases.map(phase => {
          if (phase.id === phaseId && phase.subItems) {
              const updatedSubItems = phase.subItems.map(si => {
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
                  ...phase,
                  subItems: updatedSubItems,
              };
          }
          return phase;
      });
      
      // Verificar e atualizar status do pai (fase e iniciativa) se necessário
      // Criar array temporário com iniciativa atualizada para verificação
      const tempInitiatives = initiatives.map(init => 
        init.id === initiativeId ? { ...init, phases: updatedPhases } : init
      );
      const parentUpdate = checkAndUpdateParentStatus(initiativeId, phaseId, tempInitiatives);
      
      // Aplicar atualizações do pai se houver
      let finalPhases = updatedPhases;
      let finalInitiativeStatus = localInitiative.status;
      
      if (parentUpdate) {
          finalPhases = parentUpdate.updatedPhases;
          if (parentUpdate.updatedInitiativeStatus) {
              finalInitiativeStatus = parentUpdate.updatedInitiativeStatus;
          }
      }
      
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          const updateData: any = { 
              phases: finalPhases, 
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
                          phases: finalPhases,
                          status: finalInitiativeStatus,
                          progress: calculateProgressFromPhases(finalPhases),
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

  const addPhase = useCallback(async (initiativeId: string, phase: Omit<InitiativePhase, 'id'>) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative) return;

      const newPhase: InitiativePhase = {
          ...phase,
          id: doc(collection(db, 'dummy')).id,
          subItems: phase.subItems || [],
      };

      const updatedPhases = [...(localInitiative.phases || []), newPhase];
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      
      try {
          await setDoc(initiativeDocRef, { phases: updatedPhases, lastUpdate: new Date().toISOString() }, { merge: true });
          fetchInitiatives();
      } catch (error) {
          console.error("Error adding phase:", error);
      }
  }, [initiatives, fetchInitiatives]);

  /**
   * Atualiza uma fase e verifica se deve concluir iniciativa automaticamente.
   * 
   * @param initiativeId - ID da iniciativa
   * @param phaseId - ID da fase
   * @param phase - Dados parciais da fase para atualizar
   */
  const updatePhase = useCallback(async (initiativeId: string, phaseId: string, phase: Partial<InitiativePhase>) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.phases) return;

      const updatedPhases = localInitiative.phases.map(p => 
          p.id === phaseId ? { ...p, ...phase } : p
      );
      
      // Verificar e atualizar status da iniciativa se todas as fases estão concluídas
      // Criar array temporário com iniciativa atualizada para verificação
      const tempInitiatives = initiatives.map(init => 
        init.id === initiativeId ? { ...init, phases: updatedPhases } : init
      );
      const parentUpdate = checkAndUpdateParentStatus(initiativeId, undefined, tempInitiatives);
      
      // Aplicar atualizações se houver
      let finalPhases = updatedPhases;
      let finalInitiativeStatus = localInitiative.status;
      
      if (parentUpdate) {
          finalPhases = parentUpdate.updatedPhases;
          if (parentUpdate.updatedInitiativeStatus) {
              finalInitiativeStatus = parentUpdate.updatedInitiativeStatus;
          }
      }
      
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          const updateData: any = { 
              phases: finalPhases, 
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
                  phases: finalPhases,
                  status: finalInitiativeStatus,
                  progress: calculateProgressFromPhases(finalPhases),
                  lastUpdate: new Date().toISOString(),
                };
              }
              return init;
            });
          });
      } catch (error) {
          console.error("Error updating phase:", error);
      }
  }, [initiatives]);

  const deletePhase = useCallback(async (initiativeId: string, phaseId: string) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.phases) return;

      const updatedPhases = localInitiative.phases.filter(p => p.id !== phaseId);
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      
      try {
          await setDoc(initiativeDocRef, { phases: updatedPhases, lastUpdate: new Date().toISOString() }, { merge: true });
          fetchInitiatives();
      } catch (error) {
          console.error("Error deleting phase:", error);
      }
  }, [initiatives, fetchInitiatives]);

  const addSubItem = useCallback(async (initiativeId: string, phaseId: string, subItem: Omit<SubItem, 'id'>) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.phases) return;

      const newSubItem: SubItem = {
          ...subItem,
          id: doc(collection(db, 'dummy')).id,
      };

      const updatedPhases = localInitiative.phases.map(phase => {
          if (phase.id === phaseId) {
              return {
                  ...phase,
                  subItems: [...(phase.subItems || []), newSubItem],
              };
          }
          return phase;
      });

      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          await setDoc(initiativeDocRef, { phases: updatedPhases, lastUpdate: new Date().toISOString() }, { merge: true });
          fetchInitiatives();
      } catch (error) {
          console.error("Error adding subitem:", error);
      }
  }, [initiatives, fetchInitiatives]);

  const deleteSubItem = useCallback(async (initiativeId: string, phaseId: string, subItemId: string) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.phases) return;

      const updatedPhases = localInitiative.phases.map(phase => {
          if (phase.id === phaseId && phase.subItems) {
              return {
                  ...phase,
                  subItems: phase.subItems.filter(si => si.id !== subItemId),
              };
          }
          return phase;
      });

      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          await setDoc(initiativeDocRef, { phases: updatedPhases, lastUpdate: new Date().toISOString() }, { merge: true });
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
      addPhase,
      updatePhase,
      deletePhase,
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
