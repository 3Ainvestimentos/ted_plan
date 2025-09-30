
"use client";

import type { UserRole } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_COLLABORATORS } from '@/lib/constants'; // Assuming user data is here

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

// Define allowed users directly, pulling from a central mock if available
const ALLOWED_USERS = MOCK_COLLABORATORS.map(c => ({
    email: c.email.toLowerCase(),
    uid: c.id,
    name: c.name,
    role: c.cargo as UserRole
}));
const ALLOWED_EMAILS = ALLOWED_USERS.map(u => u.email);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'PMO';
  
  useEffect(() => {
    // This effect runs only once on mount to check for an existing session.
    const checkSession = () => {
        try {
            const session = sessionStorage.getItem('user-session');
            if (session) {
                const userData = JSON.parse(session);
                setUser(userData);
            }
        } catch (error) {
            console.error("Failed to parse user session:", error);
            sessionStorage.removeItem('user-session');
        } finally {
            setIsLoading(false);
        }
    };
    checkSession();
  }, []);


  const login = async (email: string, pass: string) => {
    setIsLoading(true);

    const lowerCaseEmail = email.toLowerCase();
    
    // 1. Check if email is allowed
    if (!ALLOWED_EMAILS.includes(lowerCaseEmail)) {
        setIsLoading(false);
        throw new Error('Usuário não autorizado.');
    }

    // 2. Check hardcoded password
    if (pass !== 'ted@2024') {
        setIsLoading(false);
        throw new Error('Credenciais inválidas.');
    }

    // 3. Find user data from our mock list
    const userData = ALLOWED_USERS.find(u => u.email === lowerCaseEmail);
    if (!userData) {
        setIsLoading(false);
        // This should technically never happen if email is in ALLOWED_EMAILS
        throw new Error('Usuário não encontrado.');
    }

    // 4. Set session and state
    const userToSave: User = {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role
    };

    sessionStorage.setItem('user-session', JSON.stringify(userToSave));
    setUser(userToSave);
    
    // Let the layout handle the redirection
    setIsLoading(false);
  };

  const logout = async () => {
    sessionStorage.removeItem('user-session');
    setUser(null);
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
