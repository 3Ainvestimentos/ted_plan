
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { MaintenanceSettings } from '@/types';

// Hardcoded admin emails as a fallback
const FALLBACK_ADMIN_EMAILS = ['matheus@3ainvestimentos.com.br'];

interface SettingsContextType {
  maintenanceSettings: MaintenanceSettings | null;
  isLoading: boolean;
  updateMaintenanceSettings: (newSettings: Partial<MaintenanceSettings>) => Promise<void>;
  addAdminEmail: (email: string) => Promise<void>;
  removeAdminEmail: (email: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const settingsDocRef = useMemo(() => doc(db, 'settings', 'maintenance'), []);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const docSnap = await getDoc(settingsDocRef);
      if (docSnap.exists()) {
        setMaintenanceSettings(docSnap.data() as MaintenanceSettings);
      } else {
        // If settings don't exist, create them with default values
        const defaultSettings: MaintenanceSettings = { isEnabled: false, adminEmails: FALLBACK_ADMIN_EMAILS };
        await setDoc(settingsDocRef, defaultSettings);
        setMaintenanceSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching settings: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [settingsDocRef]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  const updateMaintenanceSettings = useCallback(async (newSettings: Partial<MaintenanceSettings>) => {
    try {
        await updateDoc(settingsDocRef, newSettings);
        setMaintenanceSettings(prev => prev ? { ...prev, ...newSettings } : null);
    } catch (error) {
        console.error("Error updating maintenance settings: ", error);
        throw error;
    }
  }, [settingsDocRef]);

  const addAdminEmail = useCallback(async (email: string) => {
    if (maintenanceSettings?.adminEmails.includes(email)) {
        throw new Error("Este e-mail já é um administrador.");
    }
    try {
        await updateDoc(settingsDocRef, { adminEmails: arrayUnion(email) });
        await fetchSettings();
    } catch (error) {
        console.error("Error adding admin email: ", error);
        throw error;
    }
  }, [settingsDocRef, fetchSettings, maintenanceSettings]);

  const removeAdminEmail = useCallback(async (email: string) => {
    if (maintenanceSettings && maintenanceSettings.adminEmails.length <= 1) {
        throw new Error("Deve haver pelo menos um administrador.");
    }
    try {
        await updateDoc(settingsDocRef, { adminEmails: arrayRemove(email) });
        await fetchSettings();
    } catch (error) {
        console.error("Error removing admin email: ", error);
        throw error;
    }
  }, [settingsDocRef, fetchSettings, maintenanceSettings]);


  return (
    <SettingsContext.Provider value={{ maintenanceSettings, isLoading, updateMaintenanceSettings, addAdminEmail, removeAdminEmail }}>
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
