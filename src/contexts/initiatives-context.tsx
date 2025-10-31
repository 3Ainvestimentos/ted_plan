
"use client";

import type { Initiative, InitiativeStatus, SubItem } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
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
  updateSubItem: (initiativeId: string, subItemId: string, completed: boolean) => Promise<void>;
  bulkAddInitiatives: (newInitiatives: Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'subItems' | 'deadline'>[]) => void;
  isLoading: boolean;
}

const InitiativesContext = createContext<InitiativesContextType | undefined>(undefined);

const calculateProgressFromSubItems = (subItems: SubItem[]): number => {
    if (!subItems || subItems.length === 0) return 0;
    const completedCount = subItems.filter(item => item.completed).length;
    return Math.round((completedCount / subItems.length) * 100);
};

const calculateParentProgress = (parentId: string, allInitiatives: Initiative[]): number => {
    const children = allInitiatives.filter(i => i.parentId === parentId);
    if (children.length === 0) return 0;
    
    const totalProgress = children.reduce((sum, child) => sum + (child.progress || 0), 0);
    return Math.round(totalProgress / children.length);
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

        // First pass: calculate progress for items
        const initiativesWithProgress = rawInitiatives.map(init => {
            let progress = init.progress || 0;
            if (init.subItems && init.subItems.length > 0) {
                progress = calculateProgressFromSubItems(init.subItems);
            } else if (init.status === 'Concluído') {
                progress = 100;
            }
            return { ...init, progress };
        });

        // Second pass: calculate progress for parent items
        const initiativesWithFinalProgress = initiativesWithProgress.map(init => {
            if (rawInitiatives.some(child => child.parentId === init.id)) {
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
        ...initiativeData,
        deadline: initiativeData.deadline ? initiativeData.deadline.toISOString().split('T')[0] : null,
        lastUpdate: new Date().toISOString(),
        topicNumber: nextTopicNumber,
        progress: 0, 
        keyMetrics: [],
        parentId: null,
        archived: false,
        subItems: initiativeData.subItems?.map(si => ({...si, id: doc(collection(db, 'dummy')).id})) || [],
    };

    try {
        await addDoc(initiativesCollectionRef, newInitiative);
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
          subItems: [],
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
          ...data,
          deadline: data.deadline ? data.deadline.toISOString().split('T')[0] : null,
          lastUpdate: new Date().toISOString(),
          subItems: data.subItems?.map(si => ({...si, id: si.id || doc(collection(db, 'dummy')).id})) || [],
      };
      await setDoc(initiativeDocRef, updatedData, { merge: true });
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

  const updateInitiativeStatus = useCallback(async (initiativeId: string, newStatus: InitiativeStatus) => {
    const initiativeDocRef = doc(db, 'initiatives', initiativeId);
    try {
        await setDoc(initiativeDocRef, {
            status: newStatus,
            lastUpdate: new Date().toISOString(),
        }, { merge: true });
        await fetchInitiatives(); // Refetch to recalculate parent progress if needed
    } catch (error) {
        console.error("Error updating initiative status: ", error);
    }
  }, [fetchInitiatives]);

  const updateSubItem = useCallback(async (initiativeId: string, subItemId: string, completed: boolean) => {
      const localInitiative = initiatives.find(i => i.id === initiativeId);
      if (!localInitiative || !localInitiative.subItems) return;

      const updatedSubItems = localInitiative.subItems.map(si => 
          si.id === subItemId ? { ...si, completed } : si
      );
      
      const initiativeDocRef = doc(db, 'initiatives', initiativeId);
      try {
          await setDoc(initiativeDocRef, { subItems: updatedSubItems, lastUpdate: new Date().toISOString() }, { merge: true });
          // Update state locally instead of re-fetching everything
          setInitiatives(prevInitiatives => {
              const newInitiatives = prevInitiatives.map(init => {
                  if (init.id === initiativeId) {
                      return {
                          ...init,
                          subItems: updatedSubItems,
                          progress: calculateProgressFromSubItems(updatedSubItems),
                          lastUpdate: new Date().toISOString(),
                      };
                  }
                  return init;
              });

              // If the updated initiative has a parent, we need to recalculate the parent's progress
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
          // Optionally revert local state changes on failure
      }
  }, [initiatives]);

  return (
    <InitiativesContext.Provider value={{ initiatives, addInitiative, bulkAddInitiatives, updateInitiative, deleteInitiative, archiveInitiative, unarchiveInitiative, updateInitiativeStatus, updateSubItem, isLoading }}>
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
