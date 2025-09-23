

"use client";

import type { Collaborator } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, where } from 'firebase/firestore';

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
      console.error("Error fetching collaborators: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [collaboratorsCollectionRef]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const addCollaborator = useCallback(async (collaboratorData: CollaboratorData) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Add to 'collaborators' collection
      const newCollaboratorRef = doc(collaboratorsCollectionRef);
      batch.set(newCollaboratorRef, { ...collaboratorData, permissions: {} });

      // 2. Add email to 'authorizedUsers' collection
      const newAuthorizedUserRef = doc(authorizedUsersCollectionRef);
      batch.set(newAuthorizedUserRef, { email: collaboratorData.email });
      
      await batch.commit();
      fetchCollaborators();
    } catch (error) {
      console.error("Error adding collaborator: ", error);
      throw error;
    }
  }, [fetchCollaborators, collaboratorsCollectionRef, authorizedUsersCollectionRef]);

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
    // Firestore field paths cannot contain '/'. We remove it.
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
  
  const deleteCollaborator = useCallback(async (id: string, email: string) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Delete from 'collaborators'
      const collaboratorDocRef = doc(db, 'collaborators', id);
      batch.delete(collaboratorDocRef);

      // 2. Delete from 'authorizedUsers'
      const q = query(authorizedUsersCollectionRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => {
          batch.delete(doc.ref);
      });

      await batch.commit();
      fetchCollaborators();
    } catch (error) {
        console.error("Error deleting collaborator: ", error);
        throw error;
    }
  }, [fetchCollaborators, authorizedUsersCollectionRef]);

  const bulkAddCollaborators = useCallback(async (collaboratorsData: CollaboratorData[]) => {
      const batch = writeBatch(db);
      collaboratorsData.forEach(collaborator => {
          const newCollaboratorRef = doc(collaboratorsCollectionRef);
          batch.set(newCollaboratorRef, {...collaborator, permissions: {}});
          
          const newAuthorizedUserRef = doc(authorizedUsersCollectionRef);
          batch.set(newAuthorizedUserRef, { email: collaborator.email });
      });
      try {
          await batch.commit();
          fetchCollaborators();
      } catch (error) {
          console.error("Error bulk adding collaborators: ", error);
          throw error;
      }
  }, [fetchCollaborators, collaboratorsCollectionRef, authorizedUsersCollectionRef]);


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

    
