

"use client";

import type { BusinessArea, Okr, Kpi, BusinessAreaFormData, OkrFormData, KpiFormData } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, where, orderBy } from 'firebase/firestore';

interface StrategicPanelContextType {
  businessAreas: BusinessArea[];
  isLoading: boolean;
  refetchData: () => void;
  addBusinessArea: (areaData: BusinessAreaFormData) => Promise<string | undefined>;
  updateBusinessArea: (areaId: string, areaData: Partial<BusinessAreaFormData>) => Promise<void>;
  deleteBusinessArea: (areaId: string) => Promise<void>;
  updateBusinessAreasOrder: (reorderedAreas: BusinessArea[]) => Promise<void>;
  addOkr: (areaId: string, okrData: OkrFormData) => Promise<void>;
  updateOkr: (okrId: string, okrData: OkrFormData) => Promise<void>;
  deleteOkr: (okrId: string) => Promise<void>;
  addKpi: (areaId: string, kpiData: KpiFormData) => Promise<void>;
  updateKpi: (kpiId: string, kpiData: KpiFormData) => Promise<void>;
  deleteKpi: (kpiId: string) => Promise<void>;
}

const StrategicPanelContext = createContext<StrategicPanelContextType | undefined>(undefined);

export const StrategicPanelProvider = ({ children }: { children: ReactNode }) => {
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPanelData = useCallback(async () => {
    setIsLoading(true);
    try {
      const areasQuery = query(collection(db, 'businessAreas'), orderBy('order'));
      const areasSnapshot = await getDocs(areasQuery);
      const areasData = areasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessArea));

      const okrsSnapshot = await getDocs(collection(db, 'okrs'));
      const allOkrs = okrsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Okr));
      
      const kpisSnapshot = await getDocs(collection(db, 'kpis'));
      const allKpis = kpisSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kpi));

      const populatedAreas = areasData.map(area => ({
        ...area,
        okrs: allOkrs.filter(okr => okr.areaId === area.id),
        kpis: allKpis.filter(kpi => kpi.areaId === area.id)
      }));
      
      setBusinessAreas(populatedAreas);
    } catch (error) {
      console.error("Error fetching strategic panel data: ", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPanelData();
  }, [fetchPanelData]);
  
  // CRUD functions
  const addBusinessArea = async (areaData: Omit<BusinessAreaFormData, 'order'>) => {
      try {
          const newOrder = businessAreas.length;
          const dataToSave = { ...areaData, order: newOrder };
          const docRef = await addDoc(collection(db, 'businessAreas'), dataToSave);
          await fetchPanelData();
          return docRef.id;
      } catch (e) { console.error("Error adding document: ", e); }
  }

  const updateBusinessArea = async (areaId: string, areaData: Partial<BusinessAreaFormData>) => {
      try {
          const areaDocRef = doc(db, 'businessAreas', areaId);
          await updateDoc(areaDocRef, areaData);
          await fetchPanelData();
      } catch (e) { console.error("Error updating document: ", e); }
  }

  const updateBusinessAreasOrder = async (reorderedAreas: BusinessArea[]) => {
    setBusinessAreas(reorderedAreas); // Optimistic update
    const batch = writeBatch(db);
    reorderedAreas.forEach((area, index) => {
        const docRef = doc(db, 'businessAreas', area.id);
        batch.update(docRef, { order: index });
    });
    try {
        await batch.commit();
        // No need to fetch, state is already updated
    } catch (error) {
        console.error("Failed to update order", error);
        fetchPanelData(); // Revert on failure
    }
  };

  const deleteBusinessArea = async (areaId: string) => {
      try {
          const batch = writeBatch(db);
          // Delete the business area
          batch.delete(doc(db, 'businessAreas', areaId));

          // Find and delete associated OKRs
          const okrsQuery = query(collection(db, 'okrs'), where('areaId', '==', areaId));
          const okrsSnapshot = await getDocs(okrsQuery);
          okrsSnapshot.forEach(doc => batch.delete(doc.ref));

          // Find and delete associated KPIs
          const kpisQuery = query(collection(db, 'kpis'), where('areaId', '==', areaId));
          const kpisSnapshot = await getDocs(kpisQuery);
          kpisSnapshot.forEach(doc => batch.delete(doc.ref));
          
          await batch.commit();
          await fetchPanelData();
      } catch (e) { console.error("Error deleting document and subcollections: ", e); }
  }
  
  const addOkr = async (areaId: string, okrData: OkrFormData) => {
    try {
        const dataToSave = { ...okrData, areaId };
        await addDoc(collection(db, 'okrs'), dataToSave);
        await fetchPanelData();
    } catch (e) { console.error("Error adding OKR: ", e); }
  }

  const updateOkr = async (okrId: string, okrData: OkrFormData) => {
      try {
          await updateDoc(doc(db, 'okrs', okrId), okrData as any);
          await fetchPanelData();
      } catch (e) { console.error("Error updating OKR: ", e); }
  }

  const deleteOkr = async (okrId: string) => {
      try {
          await deleteDoc(doc(db, 'okrs', okrId));
          await fetchPanelData();
      } catch (e) { console.error("Error deleting OKR: ", e); }
  }

  const addKpi = async (areaId: string, kpiData: KpiFormData) => {
      try {
          const dataToSave = { ...kpiData, areaId };
          await addDoc(collection(db, 'kpis'), dataToSave);
          await fetchPanelData();
      } catch (e) { console.error("Error adding KPI: ", e); }
  }

  const updateKpi = async (kpiId: string, kpiData: KpiFormData) => {
       try {
          await updateDoc(doc(db, 'kpis', kpiId), kpiData as any);
          await fetchPanelData();
      } catch (e) { console.error("Error updating KPI: ", e); }
  }

  const deleteKpi = async (kpiId: string) => {
      try {
          await deleteDoc(doc(db, 'kpis', kpiId));
          await fetchPanelData();
      } catch (e) { console.error("Error deleting KPI: ", e); }
  }

  return (
    <StrategicPanelContext.Provider value={{
        businessAreas, 
        isLoading,
        refetchData: fetchPanelData,
        addBusinessArea,
        updateBusinessArea,
        deleteBusinessArea,
        updateBusinessAreasOrder,
        addOkr,
        updateOkr,
        deleteOkr,
        addKpi,
        updateKpi,
        deleteKpi,
    }}>
      {children}
    </StrategicPanelContext.Provider>
  );
};

export const useStrategicPanel = () => {
  const context = useContext(StrategicPanelContext);
  if (context === undefined) {
    throw new Error('useStrategicPanel must be used within a StrategicPanelProvider');
  }
  return context;
};
