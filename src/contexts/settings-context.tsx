"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { db, app } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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
  const hasFetchedRef = useRef(false); // Evitar múltiplas chamadas

  // Função para buscar settings (não depende de estado, recebe user como parâmetro)
  const fetchSettings = useCallback(async (user: any) => {
    if (!user) {
      console.log('⚠️ [Settings] Usuário não fornecido');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('📖 [Settings] Buscando settings no Firestore para:', user.email);
      const docSnap = await getDoc(settingsDocRef);
      
      if (docSnap.exists()) {
        console.log('✅ [Settings] Settings encontrados');
        setMaintenanceSettings(docSnap.data() as MaintenanceSettings);
      } else {
        console.log('📝 [Settings] Criando settings padrão...');
        const defaultSettings: MaintenanceSettings = { isEnabled: false, adminEmails: FALLBACK_ADMIN_EMAILS };
        await setDoc(settingsDocRef, defaultSettings);
        setMaintenanceSettings(defaultSettings);
      }
    } catch (error: any) {
      console.error("❌ [Settings] Error fetching settings: ", error);
      if (error?.code === 'permission-denied') {
        console.warn('⚠️ [Settings] Permissão negada. Verifique as regras do Firestore.');
        // Mesmo com erro, definir loading como false para não travar a aplicação
      }
    } finally {
      setIsLoading(false);
    }
  }, [settingsDocRef]);

  // Listener de autenticação
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ [Settings] Usuário autenticado:', user.email);
        // Buscar settings apenas uma vez quando usuário autenticar
        if (!hasFetchedRef.current) {
          hasFetchedRef.current = true;
          fetchSettings(user); // Passar user diretamente
        }
      } else {
        console.log('⚠️ [Settings] Usuário não autenticado');
        hasFetchedRef.current = false; // Reset para permitir nova busca quando autenticar
        setIsLoading(false);
        setMaintenanceSettings(null);
      }
    });

    return () => unsubscribe();
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
        const auth = getAuth(app);
        await fetchSettings(auth.currentUser);
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
        const auth = getAuth(app);
        await fetchSettings(auth.currentUser);
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