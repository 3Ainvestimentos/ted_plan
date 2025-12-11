
"use client";

import type { Collaborator } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, setDoc } from 'firebase/firestore';

interface TeamControlContextType {
  collaborators: Collaborator[];
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<void>;
  updateCollaborator: (id: string, data: Partial<Collaborator>) => Promise<void>;
  deleteCollaborator: (id: string, email: string) => Promise<void>;
  updateCollaboratorPermissions: (id: string, navItem: string, isEnabled: boolean) => Promise<void>;
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
        id: doc.id,
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

  const addCollaborator = async (collaboratorData: Omit<Collaborator, 'id'| 'permissions'>) => {
    const newCollaborator = {
        ...collaboratorData,
        userType: collaboratorData.userType || 'Usuário padrão',
        permissions: {}, // Permissões vazias por padrão
        remunerationHistory: [],
        positionHistory: [],
    }
    await addDoc(collaboratorsCollectionRef, newCollaborator);
    fetchCollaborators();
  };
  
  const updateCollaborator = async (id: string, data: Partial<Collaborator>) => {
    const collaboratorDocRef = doc(db, 'collaborators', id);
    const collaborator = collaborators.find(c => c.id === id);
    
    // Se mudou de Usuário padrão para Administrador, limpar permissões
    // Se mudou de Administrador para Usuário padrão, manter permissões vazias
    if (collaborator && data.userType && data.userType !== collaborator.userType) {
      if (data.userType === 'Administrador') {
        data.permissions = {};
      }
    }
    
    await updateDoc(collaboratorDocRef, data);
    fetchCollaborators();
  };

  const deleteCollaborator = async (id: string, email: string) => {
    // Check against hardcoded emails
    if (['matheus@3ainvestimentos.com.br', 'thiago@3ainvestimentos.com.br'].includes(email)) {
        throw new Error("Não é possível remover usuários principais.");
    }
    const collaboratorDocRef = doc(db, 'collaborators', id);
    await deleteDoc(collaboratorDocRef);
    fetchCollaborators();
  };
  
  const updateCollaboratorPermissions = async (id: string, navItem: string, isEnabled: boolean) => {
    const collaborator = collaborators.find(c => c.id === id);
    // Não permitir atualizar permissões de administradores
    if (collaborator?.userType === 'Administrador') {
      return;
    }
    
    const key = navItem.startsWith('/') ? navItem.substring(1) : navItem;
    const collaboratorDocRef = doc(db, 'collaborators', id);
    const currentPermissions = collaborator?.permissions || {};
    const updatedPermissions = {
      ...currentPermissions,
      [key]: isEnabled 
    };
    await updateDoc(collaboratorDocRef, { 
        permissions: updatedPermissions
    });
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
              const newEntry = { date: update.date, position: update.position };
              const history = collaborator.positionHistory || [];
              const updatedHistory = [...history, newEntry];
              promises.push(updateCollaboratorHistory(collaborator.id, 'positionHistory', updatedHistory));
          }
      });
      
      await Promise.all(promises);
      fetchCollaborators();
  }


  return (
    <TeamControlContext.Provider value={{ collaborators, isLoading, addCollaborator, updateCollaborator, deleteCollaborator, updateCollaboratorPermissions, updateCollaboratorHistory, bulkUpdatePositions, addHistoryEntry }}>
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
