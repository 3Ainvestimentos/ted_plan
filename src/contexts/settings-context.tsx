
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { MaintenanceSettings } from '@/types';

interface SettingsContextType {
  maintenanceSettings: MaintenanceSettings | null;
  isLoading: boolean;
  updateMaintenanceSettings: (newSettings: Partial<MaintenanceSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // const settingsDocRef = doc(db, 'settings', 'maintenance');

  const fetchSettings = useCallback(async () => {
    setIsLoading(false);
    // try {
    //   const docSnap = await getDoc(settingsDocRef);
    //   if (docSnap.exists()) {
    //     setMaintenanceSettings(docSnap.data() as MaintenanceSettings);
    //   } else {
    //     // If settings don't exist, create them with default values
    //     const defaultSettings: MaintenanceSettings = { isEnabled: false, adminEmails: [] };
    //     await setDoc(settingsDocRef, defaultSettings);
    //     setMaintenanceSettings(defaultSettings);
    //   }
    // } catch (error) {
    //   console.error("Error fetching settings: ", error);
    // } finally {
    //   setIsLoading(false);
    // }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  const updateMaintenanceSettings = useCallback(async (newSettings: Partial<MaintenanceSettings>) => {
    // try {
    //     await updateDoc(settingsDocRef, newSettings);
    //     setMaintenanceSettings(prev => prev ? { ...prev, ...newSettings } : null);
    // } catch (error) {
    //     console.error("Error updating maintenance settings: ", error);
    //     throw error;
    // }
  }, []);

  return (
    <SettingsContext.Provider value={{ maintenanceSettings, isLoading, updateMaintenanceSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
