
"use client";

import type { MnaDeal, InitiativeStatus, SubItem } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import type { InitiativeFormData } from '@/components/initiatives/initiative-form';


type MnaDealData = Omit<MnaDeal, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'deadline'> & { deadline: Date };

interface MnaDealsContextType {
  deals: MnaDeal[];
  addDeal: (deal: InitiativeFormData) => Promise<void>;
  updateDeal: (dealId: string, data: InitiativeFormData) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  archiveDeal: (dealId: string) => Promise<void>;
  unarchiveDeal: (dealId: string) => Promise<void>;
  updateDealStatus: (dealId: string, newStatus: InitiativeStatus) => void;
  updateSubItem: (dealId: string, subItemId: string, completed: boolean) => Promise<void>;
  bulkAddDeals: (newDeals: Omit<MnaDeal, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'subItems' | 'deadline'>[]) => void;
  isLoading: boolean;
}

const MnaDealsContext = createContext<MnaDealsContextType | undefined>(undefined);

const calculateProgressFromSubItems = (subItems: SubItem[]): number => {
    if (!subItems || subItems.length === 0) return 0;
    const completedCount = subItems.filter(item => item.completed).length;
    return Math.round((completedCount / subItems.length) * 100);
};

const calculateParentProgress = (parentId: string, allDeals: MnaDeal[]): number => {
    const children = allDeals.filter(i => i.parentId === parentId);
    if (children.length === 0) return 0;
    
    const totalProgress = children.reduce((sum, child) => sum + (child.progress || 0), 0);
    return Math.round(totalProgress / children.length);
};


export const MnaDealsProvider = ({ children }: { children: ReactNode }) => {
  const [deals, setDeals] = useState<MnaDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dealsCollectionRef = collection(db, 'mnaDeals');

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    try {
        const q = query(dealsCollectionRef, orderBy('topicNumber'));
        const querySnapshot = await getDocs(q);
        const rawDeals = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MnaDeal));

        const dealsWithProgress = rawDeals.map(deal => {
            let progress = deal.progress || 0;
            if (deal.subItems && deal.subItems.length > 0) {
                progress = calculateProgressFromSubItems(deal.subItems);
            } else if (deal.status === 'Concluído') {
                progress = 100;
            }
            return { ...deal, progress };
        });

        const dealsWithFinalProgress = dealsWithProgress.map(deal => {
            if (rawDeals.some(child => child.parentId === deal.id)) {
                return {
                    ...deal,
                    progress: calculateParentProgress(deal.id, dealsWithProgress),
                };
            }
            return deal;
        });

        setDeals(dealsWithFinalProgress);
    } catch (error) {
        console.error("Error fetching M&A deals: ", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);


  const getNextTopicNumber = (currentDeals: MnaDeal[]) => {
      const mainTopics = currentDeals.filter(i => i.topicNumber && !i.topicNumber.includes('.'));
      return mainTopics.length > 0 ? (Math.max(...mainTopics.map(i => parseInt(i.topicNumber))) + 1) : 1;
  };

  const addDeal = useCallback(async (dealData: InitiativeFormData) => {
    const nextTopicNumber = getNextTopicNumber(deals).toString();
    
    const newDeal = {
        ...dealData,
        deadline: dealData.deadline ? dealData.deadline.toISOString().split('T')[0] : null,
        lastUpdate: new Date().toISOString(),
        topicNumber: nextTopicNumber,
        progress: 0, 
        keyMetrics: [],
        parentId: null,
        archived: false,
        subItems: dealData.subItems?.map(si => ({...si, id: doc(collection(db, 'dummy')).id})) || [],
    };

    try {
        await addDoc(dealsCollectionRef, newDeal);
        fetchDeals(); 
    } catch (error) {
        console.error("Error adding deal: ", error);
    }
  }, [deals, fetchDeals, dealsCollectionRef]);

  const bulkAddDeals = useCallback(async (newDealsData: any[]) => {
    let nextTopicNumber = getNextTopicNumber(deals);
    const batch = writeBatch(db);
    newDealsData.forEach(dealData => {
        const deadline = dealData.deadline && !isNaN(new Date(dealData.deadline).getTime())
          ? new Date(dealData.deadline).toISOString().split('T')[0]
          : null;

        const newDeal = {
          ...dealData,
          deadline: deadline,
          lastUpdate: new Date().toISOString(),
          topicNumber: (nextTopicNumber++).toString(),
          progress: 0,
          keyMetrics: [],
          parentId: null,
          subItems: [],
          archived: false,
        };
        const docRef = doc(dealsCollectionRef);
        batch.set(docRef, newDeal);
    });

    try {
      await batch.commit();
      fetchDeals();
    } catch (error) {
        console.error("Error bulk adding deals: ", error);
    }
  }, [deals, fetchDeals, dealsCollectionRef]);
  
  const updateDeal = useCallback(async (dealId: string, data: InitiativeFormData) => {
    const dealDocRef = doc(db, 'mnaDeals', dealId);
    try {
      const updatedData = {
          ...data,
          deadline: data.deadline ? data.deadline.toISOString().split('T')[0] : null,
          lastUpdate: new Date().toISOString(),
          subItems: data.subItems?.map(si => ({...si, id: si.id || doc(collection(db, 'dummy')).id})) || [],
      };
      await updateDoc(dealDocRef, updatedData as any);
      fetchDeals();
    } catch (error) {
        console.error("Error updating deal: ", error);
    }
  }, [fetchDeals]);

  const deleteDeal = useCallback(async (dealId: string) => {
    const dealDocRef = doc(db, 'mnaDeals', dealId);
    try {
        await deleteDoc(dealDocRef);
        fetchDeals();
    } catch (error) {
        console.error("Error deleting deal: ", error);
    }
  }, [fetchDeals]);

  const archiveDeal = useCallback(async (dealId: string) => {
    const dealDocRef = doc(db, 'mnaDeals', dealId);
    try {
      await updateDoc(dealDocRef, {
        archived: true,
        lastUpdate: new Date().toISOString(),
      });
      fetchDeals();
    } catch (error) {
      console.error("Error archiving deal: ", error);
    }
  }, [fetchDeals]);
  
  const unarchiveDeal = useCallback(async (dealId: string) => {
    const dealDocRef = doc(db, 'mnaDeals', dealId);
    try {
      await updateDoc(dealDocRef, {
        archived: false,
        lastUpdate: new Date().toISOString(),
      });
      fetchDeals();
    } catch (error) {
      console.error("Error unarchiving deal: ", error);
    }
  }, [fetchDeals]);

  const updateDealStatus = useCallback(async (dealId: string, newStatus: InitiativeStatus) => {
    const dealDocRef = doc(db, 'mnaDeals', dealId);
    try {
        await updateDoc(dealDocRef, {
            status: newStatus,
            lastUpdate: new Date().toISOString(),
        });
        await fetchDeals();
    } catch (error) {
        console.error("Error updating deal status: ", error);
    }
  }, [fetchDeals]);

  const updateSubItem = useCallback(async (dealId: string, subItemId: string, completed: boolean) => {
      const localDeal = deals.find(i => i.id === dealId);
      if (!localDeal || !localDeal.subItems) return;

      const updatedSubItems = localDeal.subItems.map(si => 
          si.id === subItemId ? { ...si, completed } : si
      );
      
      const dealDocRef = doc(db, 'mnaDeals', dealId);
      try {
          await updateDoc(dealDocRef, { subItems: updatedSubItems, lastUpdate: new Date().toISOString() });
          setDeals(prevDeals => {
              const newDeals = prevDeals.map(deal => {
                  if (deal.id === dealId) {
                      return {
                          ...deal,
                          subItems: updatedSubItems,
                          progress: calculateProgressFromSubItems(updatedSubItems),
                          lastUpdate: new Date().toISOString(),
                      };
                  }
                  return deal;
              });

              if (localDeal.parentId) {
                  const parentId = localDeal.parentId;
                  return newDeals.map(deal => {
                      if (deal.id === parentId) {
                          return {
                              ...deal,
                              progress: calculateParentProgress(parentId, newDeals)
                          };
                      }
                      return deal;
                  });
              }
              return newDeals;
          });

      } catch(error) {
          console.error("Error updating subitem:", error);
      }
  }, [deals]);

  return (
    <MnaDealsContext.Provider value={{ deals, addDeal, bulkAddDeals, updateDeal, deleteDeal, archiveDeal, unarchiveDeal, updateDealStatus, updateSubItem, isLoading }}>
      {children}
    </MnaDealsContext.Provider>
  );
};

export const useMnaDeals = () => {
  const context = useContext(MnaDealsContext);
  if (context === undefined) {
    throw new Error('useMnaDeals must be used within a MnaDealsProvider');
  }
  return context;
};
