
"use client";

import type { BusinessArea, Okr, Kpi, BusinessAreaFormData, OkrFormData, KpiFormData } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';

interface StrategicPanelContextType {
  businessAreas: BusinessArea[];
  isLoading: boolean;
  addBusinessArea: (area: BusinessAreaFormData) => Promise<void>;
  updateBusinessArea: (areaId: string, data: Partial<BusinessArea>) => Promise<void>;
  deleteBusinessArea: (areaId: string) => Promise<void>;
  addOkr: (areaId: string, okr: OkrFormData) => Promise<void>;
  updateOkr: (okrId: string, data: Partial<Okr>) => Promise<void>;
  deleteOkr: (okrId: string) => Promise<void>;
  addKpi: (areaId: string, kpi: KpiFormData) => Promise<void>;
  updateKpi: (kpiId: string, data: Partial<Kpi>) => Promise<void>;
  deleteKpi: (kpiId: string) => Promise<void>;
}

const StrategicPanelContext = createContext<StrategicPanelContextType | undefined>(undefined);

export const StrategicPanelProvider = ({ children }: { children: ReactNode }) => {
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const businessAreasCollectionRef = collection(db, 'businessAreas');
  const okrsCollectionRef = collection(db, 'okrs');
  const kpisCollectionRef = collection(db, 'kpis');

  const fetchStrategicPanelData = useCallback(async () => {
    setIsLoading(true);
    try {
        const areaQuery = query(businessAreasCollectionRef, orderBy('order'));
        const [areasSnapshot, okrsSnapshot, kpisSnapshot] = await Promise.all([
            getDocs(areaQuery),
            getDocs(okrsCollectionRef),
            getDocs(kpisCollectionRef)
        ]);

        const okrs = okrsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Okr))
            .filter(okr => !okr.deletedAt); // Filter out deleted OKRs
            
        const kpis = kpisSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Kpi))
            .filter(kpi => !kpi.deletedAt); // Filter out deleted KPIs

        const areas = areasSnapshot.docs
            .map(doc => {
            const areaId = doc.id;
            return {
                id: areaId,
                ...doc.data(),
                okrs: okrs.filter(okr => okr.areaId === areaId),
                kpis: kpis.filter(kpi => kpi.areaId === areaId)
            } as BusinessArea;
        })
        .filter(area => !area.deletedAt); // Filter out deleted Areas

        setBusinessAreas(areas);
    } catch (error) {
        console.error("Error fetching strategic panel data: ", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategicPanelData();
  }, [fetchStrategicPanelData]);

  // Business Area Operations
  const addBusinessArea = async (areaData: BusinessAreaFormData) => {
    const newArea = { ...areaData, order: businessAreas.length };
    await addDoc(businessAreasCollectionRef, newArea);
    fetchStrategicPanelData();
  };

  const updateBusinessArea = async (areaId: string, data: Partial<BusinessArea>) => {
    const areaDocRef = doc(db, 'businessAreas', areaId);
    await updateDoc(areaDocRef, data);
    fetchStrategicPanelData();
  };
  
  const deleteBusinessArea = async (areaId: string) => {
    const areaDocRef = doc(db, 'businessAreas', areaId);
    // Soft delete implementation
    await updateDoc(areaDocRef, { deletedAt: new Date().toISOString() });
    // Note: This doesn't recursively soft-delete sub-collections (OKRs, KPIs).
    // They will just be orphaned visually or can be filtered out if we query them independently.
    fetchStrategicPanelData();
  };

  // OKR Operations
  const addOkr = async (areaId: string, okrData: OkrFormData) => {
    const newOkr = { ...okrData, areaId, previousProgress: 0, lastUpdate: new Date().toISOString(), previousUpdate: null };
    await addDoc(okrsCollectionRef, newOkr);
    fetchStrategicPanelData();
  };

  const updateOkr = async (okrId: string, data: Partial<Okr>) => {
    const okrDocRef = doc(db, 'okrs', okrId);
    await updateDoc(okrDocRef, {...data, lastUpdate: new Date().toISOString()});
    fetchStrategicPanelData();
  };

  const deleteOkr = async (okrId: string) => {
    const okrDocRef = doc(db, 'okrs', okrId);
    // Soft delete implementation
    await updateDoc(okrDocRef, { deletedAt: new Date().toISOString() });
    fetchStrategicPanelData();
  };

  // KPI Operations
  const addKpi = async (areaId: string, kpiData: KpiFormData) => {
    const newKpi = { ...kpiData, areaId };
    await addDoc(kpisCollectionRef, newKpi);
    fetchStrategicPanelData();
  };

  const updateKpi = async (kpiId: string, data: Partial<Kpi>) => {
    const kpiDocRef = doc(db, 'kpis', kpiId);
    await updateDoc(kpiDocRef, data);
    fetchStrategicPanelData();
  };
  
  const deleteKpi = async (kpiId: string) => {
    const kpiDocRef = doc(db, 'kpis', kpiId);
    // Soft delete implementation
    await updateDoc(kpiDocRef, { deletedAt: new Date().toISOString() });
    fetchStrategicPanelData();
  };

  return (
    <StrategicPanelContext.Provider value={{ 
        businessAreas, isLoading, 
        addBusinessArea, updateBusinessArea, deleteBusinessArea,
        addOkr, updateOkr, deleteOkr,
        addKpi, updateKpi, deleteKpi
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
