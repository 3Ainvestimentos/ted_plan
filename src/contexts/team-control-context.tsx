
"use client";

import type { Collaborator } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, setDoc } from 'firebase/firestore';

interface TeamControlContextType {
  collaborators: Collaborator[];
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<void>;
  updateCollaborator: (id: string, data: Partial<Collaborator>) => Promise<void>;
  deleteCollaborator: (emailOrId: string) => Promise<void>;
  updateCollaboratorHistory: (id: string, historyType: 'remunerationHistory' | 'positionHistory', history: any[]) => Promise<void>;
  bulkUpdatePositions: (updates: {email: string, date: string, position: string}[]) => Promise<void>;
  addHistoryEntry: (id: string, historyType: 'remunerationHistory' | 'positionHistory', entry: any) => Promise<void>;
  isLoading: boolean;
}

const TeamControlContext = createContext<TeamControlContextType | undefined>(undefined);

export const TeamControlProvider = ({ children }: { children: ReactNode }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const collaboratorsCollectionRef = collection(db, 'collaborators');

  const fetchCollaborators = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collaboratorsCollectionRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      const collaboratorsData = querySnapshot.docs.map(doc => ({
        id: doc.id, // ID agora é o email
        ...doc.data()
      } as Collaborator));
      setCollaborators(collaboratorsData);
    } catch (error) {
      console.error("Error fetching collaborators: ", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const addCollaborator = async (collaboratorData: Omit<Collaborator, 'id'>) => {
    if (!collaboratorData.email) {
      throw new Error("Email é obrigatório para criar um colaborador.");
    }
    
    const newCollaborator = {
        ...collaboratorData,
        userType: collaboratorData.userType || 'head',
        remunerationHistory: [],
        positionHistory: [],
    }
    
    // Usar email como ID do documento
    const collaboratorDocRef = doc(db, 'collaborators', collaboratorData.email);
    await setDoc(collaboratorDocRef, newCollaborator);
    fetchCollaborators();
  };
  
  const updateCollaborator = async (id: string, data: Partial<Collaborator>) => {
    const collaboratorDocRef = doc(db, 'collaborators', id);
    await updateDoc(collaboratorDocRef, data);
    fetchCollaborators();
  };

  const deleteCollaborator = async (emailOrId: string) => {
    // Check against hardcoded emails
    if (['matheus@3ainvestimentos.com.br', 'thiago@3ainvestimentos.com.br'].includes(emailOrId)) {
        throw new Error("Não é possível remover usuários principais.");
    }
    // Usar email como ID (agora id e email são a mesma coisa)
    const collaboratorDocRef = doc(db, 'collaborators', emailOrId);
    await deleteDoc(collaboratorDocRef);
    fetchCollaborators();
  };
  
  const updateCollaboratorHistory = async (id: string, historyType: 'remunerationHistory' | 'positionHistory', history: any[]) => {
    const collaboratorDocRef = doc(db, 'collaborators', id);
    await updateDoc(collaboratorDocRef, { [historyType]: history });
    fetchCollaborators();
  }
  
  const addHistoryEntry = async (id: string, historyType: 'remunerationHistory' | 'positionHistory', entry: any) => {
      const collaborator = collaborators.find(c => c.id === id);
      if (!collaborator) return;
      
      const history = collaborator[historyType] || [];
      const updatedHistory = [...history, entry];
      
      await updateCollaboratorHistory(id, historyType, updatedHistory);
  }
  
  const bulkUpdatePositions = async (updates: {email: string, date: string, position: string}[]) => {
      const collaboratorsByEmail = new Map(collaborators.map(c => [c.email, c]));
      const promises: Promise<void>[] = [];
      
      updates.forEach(update => {
          const collaborator = collaboratorsByEmail.get(update.email);
          if (collaborator) {
              // Usar email como ID (que agora é o mesmo que collaborator.id)
              const newEntry = { date: update.date, position: update.position };
              const history = collaborator.positionHistory || [];
              const updatedHistory = [...history, newEntry];
              promises.push(updateCollaboratorHistory(update.email, 'positionHistory', updatedHistory));
          }
      });
      
      await Promise.all(promises);
      fetchCollaborators();
  }


  return (
    <TeamControlContext.Provider value={{ collaborators, isLoading, addCollaborator, updateCollaborator, deleteCollaborator, updateCollaboratorHistory, bulkUpdatePositions, addHistoryEntry }}>
      {children}
    </TeamControlContext.Provider>
  );
};

export const useTeamControl = () => {
  const context = useContext(TeamControlContext);
  if (context === undefined) {
    throw new Error('useTeamControl must be used within a TeamControlProvider');
  }
  return context;
};
