
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_COLLABORATORS } from '@/lib/constants';
import { useSettings } from './settings-context';

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  permissions?: Record<string, boolean>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isUnderMaintenance: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_USERS_MAP = new Map(MOCK_COLLABORATORS.map(c => [c.email.toLowerCase(), c]));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { maintenanceSettings, isLoading: isLoadingSettings } = useSettings();
  const router = useRouter();

  const checkSession = useCallback(() => {
    try {
      const savedUserJson = sessionStorage.getItem('user');
      if (savedUserJson) {
        const savedUser = JSON.parse(savedUserJson);
        setUser(savedUser);
      }
    } catch (e) {
      console.error("Could not parse user from session storage", e);
      sessionStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
      checkSession();
  }, [checkSession]);

  const login = async (email: string, pass: string) => {
    const lowerCaseEmail = email.toLowerCase();

    if (pass !== 'ted@2024' || !ALLOWED_USERS_MAP.has(lowerCaseEmail)) {
      throw new Error('Credenciais inválidas.');
    }

    const collaboratorData = ALLOWED_USERS_MAP.get(lowerCaseEmail);
    if (!collaboratorData) {
        throw new Error('Credenciais inválidas.'); // Should be caught by the first check, but for safety
    }
    
    const userProfile: User = {
      uid: collaboratorData.id,
      name: collaboratorData.name,
      email: collaboratorData.email,
      role: collaboratorData.cargo as UserRole,
      permissions: collaboratorData.permissions
    };
    
    sessionStorage.setItem('user', JSON.stringify(userProfile));
    setUser(userProfile);
    router.push('/strategic-initiatives');
  };

  const logout = async () => {
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'PMO';
  
  const isUnderMaintenance = !!maintenanceSettings?.isEnabled && !maintenanceSettings?.adminEmails.includes(user?.email || '');

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, login, logout, isLoading: isLoading || isLoadingSettings, isUnderMaintenance }}>
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
