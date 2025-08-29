

"use client";

import type { Collaborator } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';

type CollaboratorData = Omit<Collaborator, 'id'>;

interface CollaboratorsContextType {
  collaborators: Collaborator[];
  addCollaborator: (collaborator: CollaboratorData) => Promise<void>;
  updateCollaborator: (id: string, collaborator: Partial<CollaboratorData>) => Promise<void>;
  updateCollaboratorPermissions: (id: string, permissionKey: string, value: boolean) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
  bulkAddCollaborators: (collaborators: CollaboratorData[]) => Promise<void>;
  isLoading: boolean;
}

const CollaboratorsContext = createContext<CollaboratorsContextType | undefined>(undefined);

export const CollaboratorsProvider = ({ children }: { children: ReactNode }) => {
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

  const addCollaborator = useCallback(async (collaboratorData: CollaboratorData) => {
    try {
      await addDoc(collaboratorsCollectionRef, { ...collaboratorData, permissions: {} });
      fetchCollaborators();
    } catch (error) {
      console.error("Error adding collaborator: ", error);
      throw error;
    }
  }, [fetchCollaborators, collaboratorsCollectionRef]);

  const updateCollaborator = useCallback(async (id: string, collaboratorData: Partial<CollaboratorData>) => {
    const collaboratorDocRef = doc(db, 'collaborators', id);
    try {
      await updateDoc(collaboratorDocRef, collaboratorData);
      fetchCollaborators();
    } catch (error) {
      console.error("Error updating collaborator: ", error);
      throw error;
    }
  }, [fetchCollaborators]);

  const updateCollaboratorPermissions = useCallback(async (id: string, permissionKey: string, value: boolean) => {
    const collaboratorDocRef = doc(db, 'collaborators', id);
    try {
        const fieldToUpdate = `permissions.${permissionKey}`;
        await updateDoc(collaboratorDocRef, { [fieldToUpdate]: value });
        setCollaborators(prev => 
            prev.map(c => 
                c.id === id 
                    ? { ...c, permissions: { ...(c.permissions || {}), [permissionKey]: value } }
                    : c
            )
        );
    } catch (error) {
        console.error("Error updating collaborator permissions: ", error);
        throw error;
    }
  }, []);
  
  const deleteCollaborator = useCallback(async (id: string) => {
    const collaboratorDocRef = doc(db, 'collaborators', id);
    try {
        await deleteDoc(collaboratorDocRef);
        fetchCollaborators();
    } catch (error) {
        console.error("Error deleting collaborator: ", error);
        throw error;
    }
  }, [fetchCollaborators]);

  const bulkAddCollaborators = useCallback(async (collaboratorsData: CollaboratorData[]) => {
      const batch = writeBatch(db);
      collaboratorsData.forEach(collaborator => {
          const docRef = doc(collection(db, 'collaborators'));
          batch.set(docRef, {...collaborator, permissions: {}});
      });
      try {
          await batch.commit();
          fetchCollaborators();
      } catch (error) {
          console.error("Error bulk adding collaborators: ", error);
          throw error;
      }
  }, [fetchCollaborators]);


  return (
    <CollaboratorsContext.Provider value={{ collaborators, addCollaborator, updateCollaborator, updateCollaboratorPermissions, deleteCollaborator, bulkAddCollaborators, isLoading }}>
      {children}
    </CollaboratorsContext.Provider>
  );
};

export const useCollaborators = () => {
  const context = useContext(CollaboratorsContext);
  if (context === undefined) {
    throw new Error('useCollaborators must be used within a CollaboratorsProvider');
  }
  return context;
};

    