
"use client";

import type { BusinessArea, Okr, Kpi } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface StrategicPanelContextType {
  businessAreas: BusinessArea[];
  isLoading: boolean;
}

const StrategicPanelContext = createContext<StrategicPanelContextType | undefined>(undefined);

export const StrategicPanelProvider = ({ children }: { children: ReactNode }) => {
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPanelData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch all business areas
      const areasSnapshot = await getDocs(collection(db, 'businessAreas'));
      const areasData = areasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessArea));

      // 2. Fetch all OKRs and KPIs
      const okrsSnapshot = await getDocs(collection(db, 'okrs'));
      const allOkrs = okrsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Okr));
      
      const kpisSnapshot = await getDocs(collection(db, 'kpis'));
      const allKpis = kpisSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kpi));

      // 3. Map OKRs and KPIs to their respective business areas
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

  return (
    <StrategicPanelContext.Provider value={{ businessAreas, isLoading }}>
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
