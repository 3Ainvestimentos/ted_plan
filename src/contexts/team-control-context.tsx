
"use client";

import type { Collaborator, RemunerationHistory, PositionHistory } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, query, where, orderBy, getDoc, arrayUnion } from 'firebase/firestore';

interface TeamControlContextType {
  collaborators: Collaborator[];
  isLoading: boolean;
  updateCollaboratorHistory: (collaboratorId: string, historyType: 'remuneration' | 'position', data: any[]) => Promise<void>;
  bulkUpdateCollaboratorsFromCSV: (csvData: any[]) => Promise<void>;
}

const TeamControlContext = createContext<TeamControlContextType | undefined>(undefined);

export const TeamControlProvider = ({ children }: { children: ReactNode }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollaborators = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'collaborators'), orderBy('name'));
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
  }, []);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const updateCollaboratorHistory = async (collaboratorId: string, historyType: 'remuneration' | 'position', data: any[]) => {
      const collaboratorDocRef = doc(db, 'collaborators', collaboratorId);
      const fieldToUpdate = historyType === 'remuneration' ? 'remunerationHistory' : 'positionHistory';
      try {
          await updateDoc(collaboratorDocRef, { [fieldToUpdate]: data });
          await fetchCollaborators();
      } catch (error) {
          console.error(`Error updating ${historyType} history:`, error);
          throw error;
      }
  };
  
  const bulkUpdateCollaboratorsFromCSV = async (csvData: any[]) => {
      const batch = writeBatch(db);
      const collaboratorsRef = collection(db, 'collaborators');
      
      for (const row of csvData) {
        const q = query(collaboratorsRef, where('email', '==', row.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const collaboratorDoc = querySnapshot.docs[0];
            const docRef = collaboratorDoc.ref;
            
            const positionUpdate: PositionHistory = { date: row.date, position: row.cargo };
            const remunerationUpdate: RemunerationHistory = { date: row.date, value: parseFloat(row.remuneration) };

            // Use arrayUnion to avoid overwriting existing history and add new entries
            batch.update(docRef, { 
                positionHistory: arrayUnion(positionUpdate),
                remunerationHistory: arrayUnion(remunerationUpdate)
            });
        } else {
            console.warn(`Collaborator with email ${row.email} not found. Skipping.`);
        }
      }

      try {
          await batch.commit();
          await fetchCollaborators();
      } catch(error) {
          console.error("Error bulk updating collaborators from CSV", error);
          throw error;
      }
  }


  return (
    <TeamControlContext.Provider value={{ collaborators, isLoading, updateCollaboratorHistory, bulkUpdateCollaboratorsFromCSV }}>
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
