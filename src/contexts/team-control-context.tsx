
"use client";

import type { Collaborator, RemunerationHistory, PositionHistory } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, query, where, orderBy, getDoc, arrayUnion, addDoc, deleteDoc } from 'firebase/firestore';

type CollaboratorData = Omit<Collaborator, 'id'>;

interface TeamControlContextType {
  collaborators: Collaborator[];
  isLoading: boolean;
  refetch: () => void;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<void>;
  updateCollaborator: (id: string, collaborator: Partial<Omit<Collaborator, 'id'>>) => Promise<void>;
  deleteCollaborator: (id: string, email: string) => Promise<void>;
  updateCollaboratorPermissions: (id: string, permissionKey: string, value: boolean) => Promise<void>;
  updateCollaboratorHistory: (collaboratorId: string, historyType: 'remunerationHistory' | 'positionHistory', data: any[]) => Promise<void>;
  addHistoryEntry: (collaboratorId: string, historyType: 'remunerationHistory' | 'positionHistory', entry: RemunerationHistory | PositionHistory) => Promise<void>;
  bulkUpdateRemuneration: (csvData: any[]) => Promise<void>;
  bulkUpdatePositions: (csvData: any[]) => Promise<void>;
}

const TeamControlContext = createContext<TeamControlContextType | undefined>(undefined);

export const TeamControlProvider = ({ children }: { children: ReactNode }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const collaboratorsCollectionRef = collection(db, 'collaborators');
  const authorizedUsersCollectionRef = collection(db, 'authorizedUsers');

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
      console.error("Error fetching collaborators for team control: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [collaboratorsCollectionRef]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const addCollaborator = async (collaboratorData: CollaboratorData) => {
    try {
      const batch = writeBatch(db);
      
      const newCollaboratorRef = doc(collaboratorsCollectionRef);
      batch.set(newCollaboratorRef, { ...collaboratorData, permissions: {}, remunerationHistory: [], positionHistory: [] });

      const newAuthorizedUserRef = doc(authorizedUsersCollectionRef);
      batch.set(newAuthorizedUserRef, { email: collaboratorData.email });
      
      await batch.commit();
      await fetchCollaborators();
    } catch (error) {
      console.error("Error adding collaborator: ", error);
      throw error;
    }
  };

  const updateCollaborator = async (id: string, collaboratorData: Partial<CollaboratorData>) => {
    try {
      const collaboratorDocRef = doc(db, 'collaborators', id);
      await updateDoc(collaboratorDocRef, collaboratorData);
      await fetchCollaborators();
    } catch (error) {
      console.error("Error updating collaborator: ", error);
      throw error;
    }
  };

  const deleteCollaborator = async (id: string, email: string) => {
    try {
      const batch = writeBatch(db);
      
      const collaboratorDocRef = doc(db, 'collaborators', id);
      batch.delete(collaboratorDocRef);

      const q = query(authorizedUsersCollectionRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => {
          batch.delete(doc.ref);
      });

      await batch.commit();
      await fetchCollaborators();
    } catch (error) {
      console.error("Error deleting collaborator: ", error);
      throw error;
    }
  };

  const updateCollaboratorPermissions = useCallback(async (id: string, permissionKey: string, value: boolean) => {
    const collaboratorDocRef = doc(db, 'collaborators', id);
    const validPermissionKey = permissionKey.startsWith('/') ? permissionKey.substring(1) : permissionKey;

    try {
        const fieldToUpdate = `permissions.${validPermissionKey}`;
        await updateDoc(collaboratorDocRef, { [fieldToUpdate]: value });
        setCollaborators(prev => 
            prev.map(c => 
                c.id === id 
                    ? { ...c, permissions: { ...(c.permissions || {}), [validPermissionKey]: value } }
                    : c
            )
        );
    } catch (error) {
        console.error("Error updating collaborator permissions: ", error);
        throw error;
    }
  }, []);

  const updateCollaboratorHistory = async (collaboratorId: string, historyType: 'remunerationHistory' | 'positionHistory', data: any[]) => {
      const collaboratorDocRef = doc(db, 'collaborators', collaboratorId);
      try {
          await updateDoc(collaboratorDocRef, { [historyType]: data });
          await fetchCollaborators();
      } catch (error) {
          console.error(`Error updating ${historyType} history:`, error);
          throw error;
      }
  };

  const addHistoryEntry = async (collaboratorId: string, historyType: 'remunerationHistory' | 'positionHistory', entry: RemunerationHistory | PositionHistory) => {
    const collaboratorDocRef = doc(db, 'collaborators', collaboratorId);
      try {
          await updateDoc(collaboratorDocRef, { [historyType]: arrayUnion(entry) });
          await fetchCollaborators();
      } catch (error) {
          console.error(`Error adding ${historyType} entry:`, error);
          throw error;
      }
  }
  
  const bulkUpdateRemuneration = async (csvData: any[]) => {
      const batch = writeBatch(db);
      const collaboratorsRef = collection(db, 'collaborators');
      
      for (const row of csvData) {
        const q = query(collaboratorsRef, where('email', '==', row.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const collaboratorDoc = querySnapshot.docs[0];
            const docRef = collaboratorDoc.ref;
            const remunerationUpdate: RemunerationHistory = { date: row.date, value: parseFloat(row.value) };
            batch.update(docRef, { remunerationHistory: arrayUnion(remunerationUpdate) });
        } else {
            console.warn(`Collaborator with email ${row.email} not found. Skipping.`);
        }
      }

      try {
          await batch.commit();
          await fetchCollaborators();
      } catch(error) {
          console.error("Error bulk updating remuneration", error);
          throw error;
      }
  }
  
  const bulkUpdatePositions = async (csvData: any[]) => {
      const batch = writeBatch(db);
      const collaboratorsRef = collection(db, 'collaborators');
      
      for (const row of csvData) {
        const q = query(collaboratorsRef, where('email', '==', row.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const collaboratorDoc = querySnapshot.docs[0];
            const docRef = collaboratorDoc.ref;
            const positionUpdate: PositionHistory = { date: row.date, position: row.position };
            batch.update(docRef, { positionHistory: arrayUnion(positionUpdate) });
        } else {
            console.warn(`Collaborator with email ${row.email} not found. Skipping.`);
        }
      }

      try {
          await batch.commit();
          await fetchCollaborators();
      } catch(error) {
          console.error("Error bulk updating positions", error);
          throw error;
      }
  }


  return (
    <TeamControlContext.Provider value={{ collaborators, isLoading, refetch: fetchCollaborators, addCollaborator, updateCollaborator, deleteCollaborator, updateCollaboratorPermissions, updateCollaboratorHistory, addHistoryEntry, bulkUpdateRemuneration, bulkUpdatePositions }}>
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
