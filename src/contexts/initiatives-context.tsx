
"use client";

import type { Initiative, InitiativeStatus } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import type { InitiativeFormData } from '@/components/initiatives/initiative-form';


type InitiativeData = Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'deadline'> & { deadline: Date };

interface InitiativesContextType {
  initiatives: Initiative[];
  addInitiative: (initiative: InitiativeData) => void;
  updateInitiative: (initiativeId: string, data: InitiativeFormData) => Promise<void>;
  deleteInitiative: (initiativeId: string) => Promise<void>;
  updateInitiativeStatus: (initiativeId: string, newStatus: InitiativeStatus) => void;
  bulkAddInitiatives: (newInitiatives: Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics' | 'deadline'>[]) => void;
  isLoading: boolean;
}

const InitiativesContext = createContext<InitiativesContextType | undefined>(undefined);

export const InitiativesProvider = ({ children }: { children: ReactNode }) => {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initiativesCollectionRef = collection(db, 'initiatives');

  const fetchInitiatives = useCallback(async () => {
    setIsLoading(true);
    try {
        const q = query(initiativesCollectionRef, orderBy('topicNumber'));
        const querySnapshot = await getDocs(q);
        const initiativesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Initiative));
        setInitiatives(initiativesData);
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

  const addInitiative = useCallback(async (initiativeData: InitiativeData) => {
    const nextTopicNumber = getNextMainTopicNumber(initiatives).toString();
    
    const newInitiative = {
        ...initiativeData,
        deadline: initiativeData.deadline.toISOString().split('T')[0],
        lastUpdate: new Date().toISOString(),
        topicNumber: nextTopicNumber,
        progress: 0, 
        keyMetrics: [],
    };

    try {
        await addDoc(initiativesCollectionRef, newInitiative);
        fetchInitiatives(); // Refetch to get the new list with the created ID
    } catch (error) {
        console.error("Error adding initiative: ", error);
    }
  }, [initiatives, fetchInitiatives, initiativesCollectionRef]);

  const bulkAddInitiatives = useCallback(async (newInitiativesData: any[]) => {
    let nextTopicNumber = getNextMainTopicNumber(initiatives);
    try {
      for (const initiativeData of newInitiativesData) {
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
        };
        await addDoc(initiativesCollectionRef, newInitiative);
      }
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
      };
      await updateDoc(initiativeDocRef, updatedData);
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
        // Optimistic update
        setInitiatives(prev => 
          prev.map(init => 
            init.id === initiativeId ? { ...init, status: newStatus, lastUpdate: new Date().toISOString() } : init
          )
        );
    } catch (error) {
        console.error("Error updating initiative status: ", error);
    }
  }, []);

  return (
    <InitiativesContext.Provider value={{ initiatives, addInitiative, bulkAddInitiatives, updateInitiative, deleteInitiative, updateInitiativeStatus, isLoading }}>
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
