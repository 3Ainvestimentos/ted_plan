
"use client";

import type { Initiative, InitiativeStatus } from '@/types';
import { MOCK_INITIATIVES } from '@/lib/constants';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type InitiativeData = Omit<Initiative, 'id' | 'lastUpdate' | 'topicNumber' | 'progress' | 'keyMetrics'>;

interface InitiativesContextType {
  initiatives: Initiative[];
  addInitiative: (initiative: InitiativeData) => void;
  updateInitiativeStatus: (initiativeId: string, newStatus: InitiativeStatus) => void;
  bulkAddInitiatives: (newInitiatives: InitiativeData[]) => void;
}

const InitiativesContext = createContext<InitiativesContextType | undefined>(undefined);

export const InitiativesProvider = ({ children }: { children: ReactNode }) => {
  const [initiatives, setInitiatives] = useState<Initiative[]>(MOCK_INITIATIVES);

  const getNextMainTopicNumber = (currentInitiatives: Initiative[]) => {
      const mainTopics = currentInitiatives.filter(i => !i.topicNumber.includes('.'));
      return mainTopics.length > 0 ? (Math.max(...mainTopics.map(i => parseInt(i.topicNumber))) + 1) : 1;
  };

  const addInitiative = useCallback((initiativeData: InitiativeData) => {
    setInitiatives(prev => {
        const nextTopicNumber = getNextMainTopicNumber(prev).toString();
        
        const newInitiative: Initiative = {
            ...initiativeData,
            id: `task-${Date.now()}`,
            lastUpdate: new Date().toISOString(),
            topicNumber: nextTopicNumber,
            progress: 0, 
            keyMetrics: [],
        };
        return [...prev, newInitiative];
    });
  }, []);

  const bulkAddInitiatives = useCallback((newInitiativesData: InitiativeData[]) => {
    setInitiatives(prev => {
      let nextTopicNumber = getNextMainTopicNumber(prev);
      const addedInitiatives: Initiative[] = newInitiativesData.map((initiativeData, index) => {
        const newInitiative: Initiative = {
          ...initiativeData,
          id: `task-${Date.now()}-${index}`,
          lastUpdate: new Date().toISOString(),
          topicNumber: (nextTopicNumber++).toString(),
          progress: 0,
          keyMetrics: [],
        };
        return newInitiative;
      });
      return [...prev, ...addedInitiatives];
    });
  }, []);

  const updateInitiativeStatus = useCallback((initiativeId: string, newStatus: InitiativeStatus) => {
    setInitiatives(prev => 
      prev.map(init => 
        init.id === initiativeId ? { ...init, status: newStatus, lastUpdate: new Date().toISOString() } : init
      )
    );
  }, []);

  return (
    <InitiativesContext.Provider value={{ initiatives, addInitiative, bulkAddInitiatives, updateInitiativeStatus }}>
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
