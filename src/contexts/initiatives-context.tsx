

"use client";

import type { Initiative, InitiativeStatus, SubItem } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import type { InitiativeFormData } from '@/components/initiatives/initiative-form';


type InitiativeData = Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'deadline'> & { deadline: Date };

interface InitiativesContextType {
  initiatives: Initiative[];
  addInitiative: (initiative: InitiativeFormData) => Promise<void>;
  updateInitiative: (initiativeId: string, data: InitiativeFormData) => Promise<void>;
  deleteInitiative: (initiativeId: string) => Promise<void>;
  updateInitiativeStatus: (initiativeId: string, newStatus: InitiativeStatus) => void;
  updateSubItem: (initiativeId: string, subItemId: string, completed: boolean) => Promise<void>;
  bulkAddInitiatives: (newInitiatives: Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'deadline'>[]) => void;
  isLoading: boolean;
}

const InitiativesContext = createContext<InitiativesContextType | undefined>(undefined);

const calculateProgress = (initiative: Initiative, allInitiatives: Initiative[]): number => {
    // Check if it's a parent initiative (has sub-items in the data structure)
    const children = allInitiatives.filter(i => i.parentId === initiative.id);
    if (children.length > 0) {
        const completedChildren = children.filter(child => child.status === 'Concluído').length;
        return children.length > 0 ? Math.round((completedChildren / children.length) * 100) : 0;
    }

    // Check for checklist-style sub-items
    if (initiative.subItems && initiative.subItems.length > 0) {
        const completedCount = initiative.subItems.filter(item => item.completed).length;
        return Math.round((completedCount / initiative.subItems.length) * 100);
    }
    
    return initiative.progress;
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

        const initiativesWithCalculatedProgress = rawInitiatives.map(init => ({
            ...init,
            progress: calculateProgress(init, rawInitiatives),
        }));
        
        setInitiatives(initiativesWithCalculatedProgress);
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
        deadline: initiativeData.deadline.toISOString().split('T')[0],
        lastUpdate: new Date().toISOString(),
        topicNumber: nextTopicNumber,
        progress: 0, 
        keyMetrics: [],
        parentId: null,
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
          : new Date().toISOString().split('T')[0];

        const newInitiative = {
          ...initiativeData,
          deadline: deadline,
          lastUpdate: new Date().toISOString(),
          topicNumber: (nextTopicNumber++).toString(),
          progress: 0,
          keyMetrics: [],
          parentId: null,
          subItems: [],
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
          deadline: data.deadline.toISOString().split('T')[0],
          lastUpdate: new Date().toISOString(),
          subItems: data.subItems?.map(si => ({...si, id: si.id || doc(collection(db, 'dummy')).id})) || [],
      };
      await updateDoc(initiativeDocRef, updatedData as any);
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

  const updateInitiativeStatus = useCallback(async (initiativeId: string, newStatus: InitiativeStatus) => {
    const initiativeDocRef = doc(db, 'initiatives', initiativeId);
    try {
        await updateDoc(initiativeDocRef, {
            status: newStatus,
            lastUpdate: new Date().toISOString(),
        });
        await fetchInitiatives(); // Refetch to recalculate parent progress if needed
    } catch (error) {
        console.error("Error updating initiative status: ", error);
    }
  }, [fetchInitiatives]);

  const updateSubItem = useCallback(async (initiativeId: string, subItemId: string, completed: boolean) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (!initiative || !initiative.subItems) return;

    const updatedSubItems = initiative.subItems.map(si => 
        si.id === subItemId ? { ...si, completed } : si
    );
    
    const initiativeDocRef = doc(db, 'initiatives', initiativeId);
    try {
        await updateDoc(initiativeDocRef, { subItems: updatedSubItems, lastUpdate: new Date().toISOString() });
        await fetchInitiatives();
    } catch(error) {
        console.error("Error updating subitem:", error);
    }
  }, [initiatives, fetchInitiatives]);

  return (
    <InitiativesContext.Provider value={{ initiatives, addInitiative, bulkAddInitiatives, updateInitiative, deleteInitiative, updateInitiativeStatus, updateSubItem, isLoading }}>
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
