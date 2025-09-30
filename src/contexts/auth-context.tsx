
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MaintenanceSettings } from '@/types';

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  role: UserRole;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isUnderMaintenance: boolean;
  setIsUnderMaintenance: (isUnder: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for simple auth
const ALLOWED_USERS: User[] = [
    {
        uid: 'mock-matheus-uid',
        name: 'Matheus',
        email: 'matheus@3ainvestimentos.com.br',
        role: 'PMO'
    },
    {
        uid: 'mock-thiago-uid',
        name: 'Thiago',
        email: 'thiago@3ainvestimentos.com.br',
        role: 'PMO'
    }
];


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'PMO';

  useEffect(() => {
    const checkSession = async () => {
        setIsLoading(true);
        const maintenanceDocRef = doc(db, 'settings', 'maintenance');
        const maintenanceSnap = await getDoc(maintenanceDocRef);
        const maintenanceSettings = maintenanceSnap.exists() ? (maintenanceSnap.data() as MaintenanceSettings) : { isEnabled: false, adminEmails: [] };

        // Check for existing session in sessionStorage
        const session = sessionStorage.getItem('user-session');
        if (session) {
            const sessionUser = JSON.parse(session);
            // Check if user is allowed during maintenance
            if(maintenanceSettings.isEnabled && !maintenanceSettings.adminEmails.includes(sessionUser.email)) {
                 setIsUnderMaintenance(true);
                 setUser(null);
                 sessionStorage.removeItem('user-session');
                 router.push('/login');
            } else {
                setUser(sessionUser);
            }
        } else {
            // No session, check if maintenance is on for everyone else
            if (maintenanceSettings.isEnabled) {
                 setIsUnderMaintenance(true);
                 router.push('/login');
            }
        }
        setIsLoading(false);
    };
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);

    const normalizedEmail = email.toLowerCase();
    const userToLogin = ALLOWED_USERS.find(u => u.email === normalizedEmail);

    // Simple hardcoded authentication
    if (userToLogin && pass === 'ted@2024') {
        sessionStorage.setItem('user-session', JSON.stringify(userToLogin));
        setUser(userToLogin);
        router.push('/strategic-initiatives');
    } else {
        setIsLoading(false);
        throw new Error('Credenciais inválidas.');
    }
    
    // No need to set loading to false here as the page will redirect and re-render.
  };

  const logout = async () => {
    setUser(null);
    sessionStorage.removeItem('user-session');
    router.push('/login');
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, login, logout, isLoading, isUnderMaintenance, setIsUnderMaintenance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
