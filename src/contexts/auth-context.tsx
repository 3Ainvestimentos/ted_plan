
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_COLLABORATORS } from '@/lib/constants';

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

const ALLOWED_USERS_MAP = new Map(MOCK_COLLABORATORS.map(c => [c.email.toLowerCase(), c]));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for a user session in sessionStorage when the app loads
    try {
      const savedUser = sessionStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Could not parse user from session storage", e);
      sessionStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const lowerCaseEmail = email.toLowerCase();
    
    if (pass !== 'ted@2024' || !ALLOWED_USERS_MAP.has(lowerCaseEmail)) {
        throw new Error('Credenciais inválidas.');
    }

    const collaboratorData = ALLOWED_USERS_MAP.get(lowerCaseEmail);
    if (!collaboratorData) {
        throw new Error('Credenciais inválidas.');
    }

    const userProfile: User = {
      uid: collaboratorData.id,
      name: collaboratorData.name,
      email: collaboratorData.email,
      role: collaboratorData.cargo as UserRole
    };
    
    sessionStorage.setItem('user', JSON.stringify(userProfile));
    setUser(userProfile);
  };

  const logout = async () => {
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'PMO';

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
